"use client";

import React, { useState } from 'react';
import { PYQ_BANK, Question } from '@/lib/quiz/pyqBank';
import { Brain, Trophy, AlertCircle, ArrowRight, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

type QuizState = 'setup' | 'loading' | 'playing' | 'results';
type SourceType = 'ai' | 'pyq';

export function QuizApp() {
  const [state, setState] = useState<QuizState>('setup');
  const [source, setSource] = useState<SourceType>('pyq');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const startQuiz = async () => {
    setErrorMsg('');
    if (source === 'pyq') {
      // Shuffle and pick
      const shuffled = [...PYQ_BANK].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(numQuestions, shuffled.length));
      setQuestions(selected);
      setCurrentIndex(0);
      setScore(0);
      setSelectedOption(null);
      setShowExplanation(false);
      setState('playing');
    } else {
      // Fetch from AI
      setState('loading');
      try {
        const res = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numQuestions, difficulty })
        });
        
        if (!res.ok) throw new Error("Failed to generate quiz");
        
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setCurrentIndex(0);
          setScore(0);
          setSelectedOption(null);
          setShowExplanation(false);
          setState('playing');
        } else {
          throw new Error("No questions returned");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to fetch AI questions. Try again or use PYQs.');
        setState('setup');
      }
    }
  };

  const handleOptionSelect = (index: number) => {
    if (showExplanation) return; // already answered
    setSelectedOption(index);
    setShowExplanation(true);
    
    if (index === questions[currentIndex].correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setState('results');
    }
  };

  const resetQuiz = () => {
    setState('setup');
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setShowExplanation(false);
  };

  // ---------------- SETUP VIEW ----------------
  if (state === 'setup') {
    return (
      <div className="max-w-2xl mx-auto mt-8 bg-neutral-900/50 border border-neutral-800 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Bitmap Index Quiz</h2>
            <p className="text-neutral-400">Test your knowledge with AI or Competitive Exams.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Question Source</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setSource('pyq')}
                className={`p-4 rounded-lg border text-left transition-colors ${source === 'pyq' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:bg-neutral-800'}`}
              >
                <div className="font-bold mb-1">Competitive Exams (PYQs)</div>
                <div className="text-xs opacity-70">Hand-picked Previous Year Questions from GATE, ISRO, UGC NET</div>
              </button>
              <button 
                onClick={() => setSource('ai')}
                className={`p-4 rounded-lg border text-left transition-colors ${source === 'ai' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:bg-neutral-800'}`}
              >
                <div className="font-bold mb-1">Generated by AI</div>
                <div className="text-xs opacity-70">Custom dynamically generated questions on the fly</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Number of Questions</label>
              <input 
                type="range" 
                min="3" max={source === 'pyq' ? PYQ_BANK.length : 15} 
                value={numQuestions} 
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="text-right text-sm text-neutral-300 font-mono mt-1">{numQuestions} Questions</div>
            </div>
            
            <div className={source === 'pyq' ? 'opacity-50 pointer-events-none' : ''}>
              <label className="block text-sm font-medium text-neutral-400 mb-2">AI Difficulty</label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <button 
            onClick={startQuiz}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            Start Quiz <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ---------------- LOADING VIEW ----------------
  if (state === 'loading') {
    return (
      <div className="max-w-2xl mx-auto mt-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl text-neutral-300">AI is generating your quiz...</h2>
        <p className="text-neutral-500 text-sm mt-2">Crafting {numQuestions} {difficulty.toLowerCase()} questions.</p>
      </div>
    );
  }

  // ---------------- PLAYING VIEW ----------------
  if (state === 'playing') {
    const q = questions[currentIndex];
    
    return (
      <div className="max-w-3xl mx-auto mt-8">
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm font-bold text-neutral-400 tracking-widest">
            QUESTION {currentIndex + 1} OF {questions.length}
          </div>
          <div className="px-3 py-1 bg-neutral-800 rounded-full text-xs text-neutral-300 border border-neutral-700">
            {q.source || "Unknown Source"}
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <h3 className="text-xl text-white leading-relaxed">{q.question}</h3>
        </div>

        <div className="space-y-3">
          {q.options.map((opt, i) => {
            let btnClass = "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:bg-neutral-800";
            let icon = null;

            if (showExplanation) {
              if (i === q.correctAnswerIndex) {
                btnClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400";
                icon = <CheckCircle2 className="w-5 h-5 shrink-0" />;
              } else if (i === selectedOption) {
                btnClass = "bg-red-500/20 border-red-500/50 text-red-400";
                icon = <XCircle className="w-5 h-5 shrink-0" />;
              } else {
                btnClass = "bg-neutral-900/50 border-neutral-800 text-neutral-600 opacity-50";
              }
            } else if (selectedOption === i) {
              btnClass = "bg-blue-500/20 border-blue-500/50 text-blue-400";
            }

            return (
              <button
                key={i}
                onClick={() => handleOptionSelect(i)}
                disabled={showExplanation}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${btnClass}`}
              >
                <div className="mt-0.5 flex-1">{opt}</div>
                {icon}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-6 p-6 bg-neutral-900/80 border border-neutral-800 rounded-xl animate-in fade-in slide-in-from-bottom-4">
            <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide">Explanation</h4>
            <p className="text-neutral-400 text-sm leading-relaxed">{q.explanation}</p>
            
            <button 
              onClick={nextQuestion}
              className="mt-6 w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------------- RESULTS VIEW ----------------
  return (
    <div className="max-w-2xl mx-auto mt-12 bg-neutral-900/50 border border-neutral-800 rounded-xl p-10 text-center relative overflow-hidden">
      <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
        <Trophy className="w-64 h-64 text-yellow-500" />
      </div>

      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
        <Trophy className="w-10 h-10 text-neutral-950" />
      </div>

      <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
      <p className="text-neutral-400 mb-8">You finished the {source === 'pyq' ? 'Competitive PYQ' : 'AI Generated'} quiz.</p>

      <div className="inline-block p-6 bg-neutral-950 rounded-2xl border border-neutral-800 mb-10">
        <div className="text-6xl font-black text-white mb-2">
          {score}<span className="text-neutral-600 text-4xl">/{questions.length}</span>
        </div>
        <div className="text-sm font-bold text-blue-400 uppercase tracking-widest">
          Final Score
        </div>
      </div>

      <button 
        onClick={resetQuiz}
        className="mx-auto py-3 px-8 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" /> Retake Quiz
      </button>
    </div>
  );
}
