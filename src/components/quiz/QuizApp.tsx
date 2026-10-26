"use client";

import React, { useState } from 'react';
import { PYQ_BANK, Question } from '@/lib/quiz/pyqBank';
import { generateDynamicAiQuiz } from '@/lib/quiz/aiQuizGenerator';
import { Brain, Trophy, AlertCircle, ArrowRight, CheckCircle2, XCircle, RotateCcw, Sparkles, RefreshCw } from 'lucide-react';
import { useLaboratoryStore } from '@/store/useLaboratoryStore';

type QuizState = 'setup' | 'loading' | 'playing' | 'results';
type SourceType = 'ai' | 'pyq' | 'combined';

export function QuizApp() {
  const { setQuizRecord } = useLaboratoryStore();
  const [state, setState] = useState<QuizState>('setup');
  const [source, setSource] = useState<SourceType>('ai');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  
  // Track seen question IDs across the session so repeated generations always produce new questions
  const [seenQuestionIds, setSeenQuestionIds] = useState<string[]>([]);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSourceChange = (newSource: 'ai' | 'pyq' | 'combined') => {
    setSource(newSource);
    const maxForNew = newSource === 'pyq' ? 52 : newSource === 'ai' ? 60 : 50;
    if (numQuestions > maxForNew) {
      setNumQuestions(maxForNew);
    }
  };

  const startQuiz = async () => {
    setErrorMsg('');
    if (source === 'combined') {
      const halfPyq = Math.floor(numQuestions / 2);
      const halfAi = numQuestions - halfPyq;

      // Select from PYQ bank
      const excludeSet = new Set(seenQuestionIds);
      let eligiblePyq = PYQ_BANK.filter(q => !excludeSet.has(q.id));
      if (eligiblePyq.length < halfPyq) {
        eligiblePyq = [...PYQ_BANK];
      }
      const selectedPyq = [...eligiblePyq].sort(() => 0.5 - Math.random()).slice(0, halfPyq);

      // Select from AI pool (up to 60 questions)
      const selectedAi = generateDynamicAiQuiz(halfAi, difficulty, seenQuestionIds);

      // Combine and shuffle
      const combined = [...selectedPyq, ...selectedAi].sort(() => 0.5 - Math.random());
      
      const newIds = combined.map(q => q.id);
      setSeenQuestionIds(prev => Array.from(new Set([...prev, ...newIds])));

      setQuestions(combined);
      setCurrentIndex(0);
      setScore(0);
      setSelectedOption(null);
      setShowExplanation(false);
      setState('playing');
      return;
    }

    if (source === 'pyq') {
      // Pick non-repeating questions from the 52-question competitive exam pool
      const excludeSet = new Set(seenQuestionIds);
      let eligible = PYQ_BANK.filter(q => !excludeSet.has(q.id));
      if (eligible.length < numQuestions) {
        // If we've seen almost all questions, reset tracking so user can practice again
        eligible = [...PYQ_BANK];
      }
      const shuffled = [...eligible].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(numQuestions, shuffled.length));
      
      const newIds = selected.map(q => q.id);
      setSeenQuestionIds(prev => Array.from(new Set([...prev, ...newIds])));

      setQuestions(selected);
      setCurrentIndex(0);
      setScore(0);
      setSelectedOption(null);
      setShowExplanation(false);
      setState('playing');
    } else {
      // Fetch fresh AI questions tailored to difficulty and avoiding seen questions
      setState('loading');
      try {
        const nonce = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const res = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            numQuestions, 
            difficulty,
            excludeIds: seenQuestionIds,
            nonce
          })
        });
        
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          const newIds = data.questions.map((q: Question) => q.id);
          setSeenQuestionIds(prev => Array.from(new Set([...prev, ...newIds])));
          
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
        console.warn('Network quiz fetch failed, seamlessly generating new local dynamic questions:', err);
        const fallback = generateDynamicAiQuiz(numQuestions, difficulty, seenQuestionIds);
        if (fallback && fallback.length > 0) {
          const newIds = fallback.map(q => q.id);
          setSeenQuestionIds(prev => Array.from(new Set([...prev, ...newIds])));
          
          setQuestions(fallback);
          setCurrentIndex(0);
          setScore(0);
          setSelectedOption(null);
          setShowExplanation(false);
          setState('playing');
        } else {
          setErrorMsg('Failed to generate AI questions. Try again or switch to PYQs.');
          setState('setup');
        }
      }
    }
  };

  const handleOptionSelect = (index: number) => {
    if (showExplanation) return; // already answered
    setSelectedOption(index);
    setShowExplanation(true);
    
    const isCorrect = index === questions[currentIndex].correctAnswerIndex;
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) {
      setScore(newScore);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizRecord({
        score,
        total: questions.length,
        percentage: Math.round((score / Math.max(1, questions.length)) * 100),
        difficulty,
        source,
        status: 'completed',
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
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

  const difficultyDetails: Record<string, { label: string; desc: string; badge: string }> = {
    All: {
      label: 'All Difficulties (Full 60-Question Pool)',
      desc: 'Complete curriculum covering Foundations, Storage & Compression, Concurrency, and Advanced SIMD / BSI Architecture.',
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    Easy: {
      label: 'Easy (Foundations)',
      desc: 'Bit representations, 0/1 row mapping, low vs high cardinality, basic AND/OR/NOT, and hardware POPCNT counting.',
      badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    Medium: {
      label: 'Medium (Internals & Systems)',
      desc: 'OLTP concurrency locks, Run-Length Encoding (RLE), Word-Aligned Hybrid (WAH), Roaring Bitmaps, and break-even thresholds.',
      badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    Hard: {
      label: 'Hard (Advanced Architecture)',
      desc: 'SIMD AVX-512 registers, Bit-Sliced Indexes (BSI) for SUM/AVG pushdown, Star Schema BJIs, and Range-Encoded bitmaps.',
      badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    }
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
            <p className="text-neutral-400">Dynamic AI question generation calibrated by difficulty.</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                type="button"
                onClick={() => handleSourceChange('ai')}
                className={`p-3.5 rounded-lg border text-left transition-colors relative ${source === 'ai' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:bg-neutral-800'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> AI Pool
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    60 Qs
                  </span>
                </div>
                <div className="text-xs opacity-80 leading-relaxed">
                  60 curated AI questions across Easy, Medium & Hard.
                </div>
              </button>
              
              <button 
                type="button"
                onClick={() => handleSourceChange('pyq')}
                className={`p-3.5 rounded-lg border text-left transition-colors relative ${source === 'pyq' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:bg-neutral-800'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-sm">Competitive PYQs</div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    52 Qs
                  </span>
                </div>
                <div className="text-xs opacity-70 leading-relaxed">
                  52 authentic questions from GATE, ISRO, NET, BARC.
                </div>
              </button>

              <button 
                type="button"
                onClick={() => handleSourceChange('combined')}
                className={`p-3.5 rounded-lg border text-left transition-colors relative ${source === 'combined' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:bg-neutral-800'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-sm">Combined Mega</div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    112 Qs
                  </span>
                </div>
                <div className="text-xs opacity-70 leading-relaxed">
                  Balanced mix combining 50+ AI questions and 50+ PYQs.
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-neutral-400">Number of Questions</label>
                <span className="text-sm text-neutral-200 font-mono font-bold bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
                  {numQuestions} Questions
                </span>
              </div>
              <input 
                type="range" 
                min="5" 
                max={source === 'pyq' ? 52 : source === 'ai' ? 60 : 50} 
                step="1"
                value={numQuestions} 
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex gap-2 mt-2.5">
                {[5, 10, 25, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNumQuestions(preset)}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                      numQuestions === preset
                        ? 'bg-blue-600/30 text-blue-300 border-blue-500 font-semibold'
                        : 'bg-neutral-800/40 text-neutral-400 border-neutral-700/60 hover:bg-neutral-800 hover:text-neutral-200'
                    }`}
                  >
                    {preset === 50 ? '50 (Full Test)' : `${preset} Qs`}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={source === 'pyq' ? 'opacity-50 pointer-events-none' : ''}>
              <label className="block text-sm font-medium text-neutral-400 mb-2">AI Difficulty</label>
              <select 
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setSeenQuestionIds([]);
                }}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Difficulties (Full 60-Question Pool)</option>
                <option value="Easy">Easy (Fundamentals)</option>
                <option value="Medium">Medium (Systems & Compression)</option>
                <option value="Hard">Hard (Advanced SIMD & Internals)</option>
              </select>
            </div>
          </div>

          {source === 'ai' ? (
            <div className="p-3.5 bg-neutral-950/60 rounded-lg border border-neutral-800">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${difficultyDetails[difficulty]?.badge || 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                  {difficulty.toUpperCase()} POOL (60 QUESTIONS AVAILABLE)
                </span>
                {seenQuestionIds.length > 0 && (
                  <span className="text-xs text-neutral-400 font-mono">
                    ({seenQuestionIds.length} explored this session)
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {difficultyDetails[difficulty]?.desc}
              </p>
            </div>
          ) : source === 'pyq' ? (
            <div className="p-3.5 bg-neutral-950/60 rounded-lg border border-neutral-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded border bg-blue-500/20 text-blue-400 border-blue-500/30">
                  COMPETITIVE EXAMS BANK (52 QUESTIONS)
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {seenQuestionIds.length > 0 ? `${seenQuestionIds.length}/52 explored` : '52 available in pool'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Authentic previous year exam questions from GATE CS/IT (18), ISRO Scientist (10), UGC NET (10), BARC (8), and NIELIT (6) covering bitmap index theory, storage calculations, WAH/Roaring compression, and engine internals.
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-neutral-950/60 rounded-lg border border-neutral-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded border bg-purple-500/20 text-purple-400 border-purple-500/30">
                  COMBINED MEGA TEST (112 TOTAL QUESTIONS IN POOL)
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  60 AI + 52 PYQs
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Comprehensive mock test pulling balanced questions from both our 60-question AI index pool and the 52 competitive exam PYQ bank.
              </p>
            </div>
          )}

          <button 
            onClick={startQuiz}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {source === 'pyq' 
              ? `Start PYQ Quiz (${numQuestions} Questions)` 
              : source === 'combined'
              ? `Start Combined Mega Quiz (${numQuestions} Questions)`
              : `Generate & Start AI Quiz (${numQuestions} Questions)`} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ---------------- LOADING VIEW ----------------
  if (state === 'loading') {
    return (
      <div className="max-w-2xl mx-auto mt-20 flex flex-col items-center justify-center">
        <div className="w-14 h-14 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-5"></div>
        <h2 className="text-xl font-bold text-neutral-200 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" /> Generating Fresh Questions...
        </h2>
        <p className="text-neutral-400 text-sm mt-2 text-center max-w-md">
          Synthesizing {numQuestions} brand new <span className="font-semibold text-white">{difficulty}</span> questions calibrated to database indexing principles.
        </p>
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
          <div className="px-3 py-1 bg-neutral-800 rounded-full text-xs text-neutral-300 border border-neutral-700 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            {q.source || `Generated by AI • ${difficulty}`}
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
          <h3 className="text-xl text-white font-medium leading-relaxed whitespace-pre-line">{q.question}</h3>
        </div>

        <div className="space-y-3">
          {q.options.map((opt, i) => {
            let btnClass = "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:bg-neutral-800";
            let icon = null;

            if (showExplanation) {
              if (i === q.correctAnswerIndex) {
                btnClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300";
                icon = <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />;
              } else if (i === selectedOption) {
                btnClass = "bg-red-500/20 border-red-500/50 text-red-300";
                icon = <XCircle className="w-5 h-5 shrink-0 text-red-400" />;
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
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${btnClass}`}
              >
                <div className="mt-0.5 flex-1 font-normal leading-relaxed">{opt}</div>
                {icon}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-6 p-6 bg-neutral-900/80 border border-neutral-800 rounded-xl animate-in fade-in slide-in-from-bottom-4">
            <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Explanation
            </h4>
            <p className="text-neutral-300 text-sm leading-relaxed">{q.explanation}</p>
            
            <button 
              onClick={nextQuestion}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2 shadow-md shadow-blue-500/20"
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
      <p className="text-neutral-400 mb-8">
        You finished the {source === 'pyq' ? 'Competitive PYQ' : source === 'combined' ? 'Combined Mega (AI + PYQ)' : `AI Generated (${difficulty})`} quiz.
      </p>

      <div className="inline-block p-6 bg-neutral-950 rounded-2xl border border-neutral-800 mb-10">
        <div className="text-6xl font-black text-white mb-2">
          {score}<span className="text-neutral-600 text-4xl">/{questions.length}</span>
        </div>
        <div className="text-sm font-bold text-blue-400 uppercase tracking-widest">
          Final Score ({Math.round((score / Math.max(1, questions.length)) * 100)}%)
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {source === 'ai' ? (
          <button 
            onClick={startQuiz}
            className="w-full sm:w-auto py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Sparkles className="w-4 h-4" /> Practice Another AI Set
          </button>
        ) : source === 'pyq' ? (
          <button 
            onClick={startQuiz}
            className="w-full sm:w-auto py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <RotateCcw className="w-4 h-4" /> Next Set of PYQ Questions
          </button>
        ) : (
          <button 
            onClick={startQuiz}
            className="w-full sm:w-auto py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <RotateCcw className="w-4 h-4" /> Take Another Mega Test
          </button>
        )}
        <button 
          onClick={resetQuiz}
          className="w-full sm:w-auto py-3 px-6 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Back to Setup
        </button>
      </div>
    </div>
  );
}
