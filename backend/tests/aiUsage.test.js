const test = require('node:test');
const assert = require('node:assert/strict');
const { generateAIQuestions, summarizeQuestionnaire } = require('../services/aiService');

test('guided feedback questions are generated without calling an AI provider', () => {
  const result = generateAIQuestions({ category: 'Benefits', title: 'Leave policy' });
  assert.equal(result.questions.length, 5);
  assert.match(result.intro, /useful context/i);
});

test('questionnaire summary skips provider usage when there are no answers', async () => {
  const previousProvider = process.env.AI_PROVIDER;
  const previousGeminiKey = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;
  let providerCalls = 0;
  process.env.AI_PROVIDER = 'gemini';
  process.env.GEMINI_API_KEY = 'test-key';
  global.fetch = async () => {
    providerCalls += 1;
    throw new Error('Unexpected provider request');
  };

  try {
    const result = await summarizeQuestionnaire({
      category: 'Management',
      description: 'Communication has been unclear.'
    });

    assert.equal(result.aiSummary, 'Communication has been unclear.');
    assert.equal(result.aiSummaryCategory, 'Management');
    assert.deepEqual(result.aiSummaryTags, []);
    assert.equal(providerCalls, 0);
  } finally {
    if (previousProvider === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = previousProvider;
    if (previousGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousGeminiKey;
    global.fetch = originalFetch;
  }
});
