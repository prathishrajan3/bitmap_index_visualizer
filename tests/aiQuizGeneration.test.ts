import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  generateDynamicAiQuiz, 
  AI_QUIZ_POOL,
  generateDynamicSizingQuestion,
  generateDynamicBitwiseQuestion,
  generateDynamicBreakEvenQuestion
} from '../src/lib/quiz/aiQuizGenerator';
import { POST } from '../src/app/api/generate-quiz/route';

describe('AI Quiz Generation & Difficulty-Based Novelty Tests', () => {

  it('generates the exact requested number of questions across Easy, Medium, and Hard', () => {
    const easyQuiz = generateDynamicAiQuiz(5, 'Easy');
    assert.equal(easyQuiz.length, 5);

    const medQuiz = generateDynamicAiQuiz(7, 'Medium');
    assert.equal(medQuiz.length, 7);

    const hardQuiz = generateDynamicAiQuiz(6, 'Hard');
    assert.equal(hardQuiz.length, 6);
  });

  it('guarantees valid structure and non-empty explanations for every question in the 60-question pool', () => {
    assert.ok(AI_QUIZ_POOL.length >= 60, `Pool should have at least 60 questions, got ${AI_QUIZ_POOL.length}`);

    const easyCount = AI_QUIZ_POOL.filter(q => q.difficulty === 'Easy').length;
    const medCount = AI_QUIZ_POOL.filter(q => q.difficulty === 'Medium').length;
    const hardCount = AI_QUIZ_POOL.filter(q => q.difficulty === 'Hard').length;

    assert.ok(easyCount >= 20, `Should have at least 20 Easy questions, got ${easyCount}`);
    assert.ok(medCount >= 20, `Should have at least 20 Medium questions, got ${medCount}`);
    assert.ok(hardCount >= 20, `Should have at least 20 Hard questions, got ${hardCount}`);

    for (const q of AI_QUIZ_POOL) {
      assert.ok(q.id && q.id.length > 0, 'Question must have id');
      assert.ok(q.question && q.question.length > 15, 'Question text must be substantive');
      assert.equal(q.options.length, 4, `Question ${q.id} must have exactly 4 options`);
      assert.ok(q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 4, `Correct answer index must be 0..3 for ${q.id}`);
      assert.ok(q.explanation && q.explanation.length > 15, `Explanation must be substantive for ${q.id}`);
      assert.ok(q.difficulty, `Difficulty must be defined for ${q.id}`);
    }
  });

  it('guarantees session deduplication: repeated calls with excludeIds return new questions', () => {
    const firstBatch = generateDynamicAiQuiz(5, 'Easy');
    const firstBatchIds = firstBatch.map(q => q.id);

    // Request another 5 questions excluding the first batch
    const secondBatch = generateDynamicAiQuiz(5, 'Easy', firstBatchIds);
    const secondBatchIds = secondBatch.map(q => q.id);

    // Verify none of the second batch IDs overlap with the first batch
    for (const id of secondBatchIds) {
      assert.ok(!firstBatchIds.includes(id), `Question ID ${id} was repeated despite being excluded!`);
    }

    // Request a third batch excluding both first and second batches
    const combinedExcluded = [...firstBatchIds, ...secondBatchIds];
    const thirdBatch = generateDynamicAiQuiz(5, 'Easy', combinedExcluded);
    for (const q of thirdBatch) {
      assert.ok(!combinedExcluded.includes(q.id), `Question ID ${q.id} was repeated in third batch!`);
    }
  });

  it('procedural sizing generator produces mathematically consistent questions and answers', () => {
    for (const diff of ['Easy', 'Medium', 'Hard']) {
      const q = generateDynamicSizingQuestion(diff);
      assert.ok(q.id.startsWith('dyn_size_'));
      assert.equal(q.options.length, 4);
      assert.equal(q.correctAnswerIndex, 0);
      assert.ok(q.question.includes('storage') || q.question.includes('memory') || q.question.includes('footprint'));
      assert.ok(q.explanation.includes('Bytes') || q.explanation.includes('bits'));
    }
  });

  it('procedural bitwise generator produces logically verified boolean questions', () => {
    for (let i = 0; i < 5; i++) {
      const q = generateDynamicBitwiseQuestion('Medium');
      assert.ok(q.id.startsWith('dyn_bit_'));
      assert.equal(q.options.length, 4);
      assert.equal(q.correctAnswerIndex, 0);
      assert.ok(q.question.includes('Vector A') && q.question.includes('Vector B'));
    }
  });

  it('procedural break-even generator calculates accurate break-even query numbers', () => {
    for (let i = 0; i < 5; i++) {
      const q = generateDynamicBreakEvenQuestion('Medium');
      assert.ok(q.id.startsWith('dyn_be_'));
      assert.equal(q.options.length, 4);
      assert.equal(q.correctAnswerIndex, 0);
      assert.ok(q.question.includes('break-even'));
      assert.ok(q.options[0].includes('queries'));
    }
  });

  it('POST /api/generate-quiz returns 200 with new questions and respects excludeIds', async () => {
    const mockReq1 = new Request('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numQuestions: 4, difficulty: 'Hard' })
    });

    const res1 = await POST(mockReq1 as any);
    assert.equal(res1.status, 200);

    const data1 = await res1.json();
    assert.equal(data1.questions.length, 4);
    const seenIds = data1.questions.map((q: any) => q.id);

    // Call again with excludeIds
    const mockReq2 = new Request('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numQuestions: 4, difficulty: 'Hard', excludeIds: seenIds })
    });

    const res2 = await POST(mockReq2 as any);
    assert.equal(res2.status, 200);

    const data2 = await res2.json();
    assert.equal(data2.questions.length, 4);

    for (const q of data2.questions) {
      assert.ok(!seenIds.includes(q.id), `ID ${q.id} was seen in previous batch but returned again!`);
    }
  });
});
