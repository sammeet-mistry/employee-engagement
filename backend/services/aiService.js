const OpenAI = require('openai');

const generateAIReply = async (feedback) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const prompt = `You are an HR professional responding to employee feedback. Generate a professional, empathetic, and constructive response to the following feedback:

Title: ${feedback.title}
Category: ${feedback.category}
Description: ${feedback.description}
Priority: ${feedback.priority}
Department: ${feedback.department || 'Not specified'}

Please provide a response that:
- Acknowledges the feedback
- Shows empathy
- Provides constructive insights or next steps
- Maintains a professional and supportive tone
- Is appropriate for workplace communication
- Does not overpromise solutions

Response should be 150-400 words.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI Reply Generation Error:', error);
    throw new Error('Failed to generate AI reply');
  }
};

const analyzeSentiment = async (text) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const prompt = `Analyze the sentiment of this employee feedback text and classify it as Positive, Neutral, Negative, or Urgent. Also suggest a category if possible.

Text: "${text}"

Respond in JSON format: {"sentiment": "Positive/Neutral/Negative/Urgent", "suggestedCategory": "suggested category or null"}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content.trim());
    return result;
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    return { sentiment: 'Neutral', suggestedCategory: null };
  }
};

module.exports = {
  generateAIReply,
  analyzeSentiment
};