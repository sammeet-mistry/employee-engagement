const crypto = require('crypto');
const OpenAI = require('openai');
const Scenario = require('../models/Scenario');
const UnmatchedScenario = require('../models/UnmatchedScenario');

const SAFETY_PATTERN = /\b(?:harass\w*|threat\w*|unsafe|violence|violent|assault\w*|discriminat\w*|retaliat\w*|abus\w*|sexual\s+misconduct|self[-\s]?harm|suicid\w*|immediate\s+danger|in\s+danger|kill(?:ing)?\s+(?:myself|me)|hurt(?:ing)?\s+(?:myself|me)|harm(?:ing)?\s+(?:myself|me)|end\s+my\s+life|want\s+to\s+die)\b/i;
const FALLBACK_DIMENSIONS = 64;
const MAX_MESSAGE_LENGTH = 4000;

const tokenize = (text) => String(text || '').toLowerCase().match(/[a-z0-9]+/g) || [];

const localEmbedding = (text) => {
  const vector = Array(FALLBACK_DIMENSIONS).fill(0);
  tokenize(text).forEach((token) => {
    const hash = crypto.createHash('sha256').update(token).digest();
    for (let index = 0; index < 4; index += 1) {
      const position = hash[index] % FALLBACK_DIMENSIONS;
      vector[position] += hash[index + 4] % 2 ? 1 : -1;
    }
  });
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return magnitude ? vector.map((value) => value / magnitude) : vector;
};

const getEmbedding = async (text) => {
  const normalizedText = String(text || '').slice(0, MAX_MESSAGE_LENGTH);
  if (!process.env.OPENAI_API_KEY) return localEmbedding(normalizedText);

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({ model: 'text-embedding-3-small', input: normalizedText });
    const embedding = response.data?.[0]?.embedding;
    return Array.isArray(embedding) && embedding.length ? embedding : localEmbedding(normalizedText);
  } catch (error) {
    console.error('Embedding unavailable; using local fallback:', error.message);
    return localEmbedding(normalizedText);
  }
};

const cosineSimilarity = (left, right) => {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || !left.length) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  left.forEach((value, index) => {
    dot += value * right[index];
    leftMagnitude += value * value;
    rightMagnitude += right[index] * right[index];
  });
  return leftMagnitude && rightMagnitude ? Math.max(0, dot / Math.sqrt(leftMagnitude * rightMagnitude)) : 0;
};

const triggerMatch = (message, patterns) => {
  const normalized = String(message || '').toLowerCase();
  return (patterns || []).some((pattern) => {
    const normalizedPattern = String(pattern || '').trim().toLowerCase();
    return normalizedPattern.length >= 2 && normalized.includes(normalizedPattern);
  }) ? 0.8 : 0;
};

const isSafetyMessage = (message) => SAFETY_PATTERN.test(message);

const recordUnmatchedScenario = async ({ rawMessage, sourceType = 'chat', sourceId, attemptedCategory, confidenceScore }) => {
  try {
    return await UnmatchedScenario.create({ rawMessage, sourceType, sourceId, attemptedCategory, confidenceScore });
  } catch (error) {
    console.error('Unable to record unmatched scenario:', error.message);
    return null;
  }
};

const categorizeMessage = async ({ message, sourceType = 'chat', sourceId, recordUnmatched = true } = {}) => {
  const normalizedMessage = String(message || '').trim().slice(0, MAX_MESSAGE_LENGTH);
  const safety = isSafetyMessage(normalizedMessage);
  if (!normalizedMessage) {
    return { scenario: null, confidence: 0, safety: false, unmatched: null };
  }

  try {
    const scenarios = await Scenario.find({ status: { $ne: 'inactive' } }).lean();
    const embedding = await getEmbedding(normalizedMessage);
    let best = null;
    scenarios.forEach((scenario) => {
      const confidence = Math.max(cosineSimilarity(embedding, scenario.embedding), triggerMatch(normalizedMessage, scenario.triggerPatterns));
      if (!best || confidence > best.confidence) best = { scenario, confidence };
    });

    const threshold = best?.scenario.confidenceThreshold ?? 0.75;
    if (!best || best.confidence < threshold) {
      const attemptedCategory = safety ? 'harassment_safety' : best?.scenario.category || 'other';
      const confidenceScore = best?.confidence || 0;
      const unmatched = recordUnmatched
        ? await recordUnmatchedScenario({ rawMessage: normalizedMessage, sourceType, sourceId, attemptedCategory, confidenceScore })
        : null;
      return { scenario: null, confidence: confidenceScore, safety, unmatched, attemptedCategory, confidenceScore };
    }

    await Scenario.updateOne({ _id: best.scenario._id }, { $inc: { usageCount: 1 }, $set: { lastMatchedAt: new Date() } });
    return { scenario: best.scenario, confidence: best.confidence, safety };
  } catch (error) {
    console.error('Scenario categorization error:', error.message);
    const attemptedCategory = safety ? 'harassment_safety' : 'other';
    const unmatched = recordUnmatched
      ? await recordUnmatchedScenario({ rawMessage: normalizedMessage, sourceType, sourceId, attemptedCategory, confidenceScore: 0 })
      : null;
    return { scenario: null, confidence: 0, safety, unmatched, attemptedCategory, confidenceScore: 0 };
  }
};

module.exports = { categorizeMessage, cosineSimilarity, getEmbedding, isSafetyMessage, localEmbedding, recordUnmatchedScenario };