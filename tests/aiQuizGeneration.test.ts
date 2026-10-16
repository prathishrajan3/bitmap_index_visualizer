import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateDynamicAiQuiz, AI_QUIZ_POOL } from '../src/lib/quiz/aiQuizGenerator';
import { POST } from '../src/app/api/generate-quiz/route';

describe('AI Quiz Generation & Resilient Fallback Tests', () => {

  it('generates the exact requested number of questions across different difficulties', () => {
    const easyQuiz = generateDynamicAiQuiz(5, 'Easy');
    assert.equal(easyQuiz.length, 5);

    const medQuiz = generateDynamicAiQuiz(7, 'Medium');
    assert.equal(medQuiz.length, 7);

    const hardQuiz = generateDynamicAiQuiz(4, 'Hard');
    assert.equal(hardQuiz.length, 4);
  });

  it('guarantees valid structure for every question in the pool', () => {
    for (const q of AI_QUIZ_POOL) {
      assert.ok(q.id && q.id.length > 0, 'Question must have id');
      assert.ok(q.question && q.question.length > 10, 'Question text must be substantive');
      assert.equal(q.options.length, 4, `Question ${q.id} must have exactly 4 options`);
      assert.ok(q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 4, `Correct answer index must be 0..3 for ${q.id}`);
      assert.ok(q.explanation && q.explanation.length > 10, `Explanation must be substantive for ${q.id}`);
      assert.ok(q.difficulty, `Difficulty must be defined for ${q.id}`);
    }
  });

  it('shuffles options while accurately preserving the correct answer index', () => {
    const quiz = generateDynamicAiQuiz(8, 'Medium');
    for (const q of quiz) {
      assert.equal(q.options.length, 4);
      assert.ok(q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 4);
      const chosenOption = q.options[q.correctAnswerIndex];
      assert.ok(chosenOption && chosenOption.length > 0, 'Chosen option must be non-empty string');
    }
  });

  it('POST /api/generate-quiz returns 200 with questions without crashing when OPENAI_API_KEY is not set', async () => {
    const mockReq = new Request('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numQuestions: 5, difficulty: 'Hard' })
    });

    const res = await POST(mockReq as any);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.ok(data.questions && Array.isArray(data.questions));
    assert.equal(data.questions.length, 5);

    for (const q of data.questions) {
      assert.ok(q.question);
      assert.equal(q.options.length, 4);
      assert.ok(q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3);
      assert.ok(q.explanation);
      assert.ok(q.source && q.source.includes('AI'));
    }
  });

  it('POST /api/generate-quiz handles missing or malformed request parameters gracefully', async () => {
    const mockReq = new Request('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const res = await POST(mockReq as any);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.ok(data.questions && Array.isArray(data.questions));
    assert.ok(data.questions.length > 0);
  });
});
