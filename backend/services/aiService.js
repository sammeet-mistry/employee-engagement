const OpenAI = require('openai');

const QUESTION_CATEGORIES = ['General', 'Work Environment', 'Management', 'Compensation', 'Benefits', 'Career Development', 'Other'];
const QUESTION_ANGLES = ['what happened', 'when it started', 'who was affected', 'impact on daily work', 'impact on wellbeing', 'impact on collaboration', 'impact on productivity', 'what has already been tried', 'what made the situation better', 'what made it worse', 'what information is missing', 'what feels most urgent', 'what outcome is needed', 'what would a fair process look like', 'what support would help', 'what resource is needed', 'what communication would help', 'what should be prioritised', 'what should stop', 'what should continue', 'what practical change is possible', 'what leadership should understand', 'what success would look like', 'what follow-up would be useful'];
const QUESTION_VARIANTS = ['Describe this in your own words.', 'What specific example best explains this?', 'What changed because of this situation?', 'What would you want someone reviewing this to understand?', 'How would you describe the effect on you or your team?', 'What detail would help HR respond constructively?', 'What would you like to happen next?'];
const QUESTION_BANK = QUESTION_CATEGORIES.flatMap((category) => QUESTION_ANGLES.flatMap((angle) => QUESTION_VARIANTS.map((variant) => `${category}: ${angle}. ${variant}`)));
const stableHash = (value) => Array.from(String(value || '')).reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 7);
const selectQuestionSet = ({ category, title, description }) => {
  const categoryQuestions = QUESTION_BANK.filter((question) => question.startsWith(`${category}:`));
  const pool = categoryQuestions.length ? categoryQuestions : QUESTION_BANK;
  const offset = stableHash(`${category}|${title}|${description}`) % pool.length;
  return Array.from({ length: 5 }, (_, index) => pool[(offset + (index * 17)) % pool.length]);
};
const detectMood = (text) => {
  const value = String(text || '').toLowerCase();
  if (/\b(unsafe|threat|harass|harassment|violence|assault|urgent|retaliat|abuse)\b/.test(value)) return { mood: 'Distressed / urgent', moodScore: -1 };
  if (/\b(frustrat|angry|unfair|disappoint|exhaust|overwork|burnout|concerned)\w*/.test(value)) return { mood: 'Frustrated / concerned', moodScore: -0.65 };
  if (/\b(happy|grateful|great|pleased|appreciate|enjoy)\w*/.test(value)) return { mood: 'Positive / appreciative', moodScore: 0.7 };
  return { mood: 'Neutral / reflective', moodScore: 0 };
};

const getApiKey = () => {
  return process.env.OPENAI_API_KEY || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
};

const getModel = () => {
  return process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
};

const getGeminiKey = () => {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const configuredKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '';
  return configuredKey.startsWith('AIza') ? configuredKey : '';
};

const createAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('AI API key is not configured. Set GEMINI_API_KEY, AI_API_KEY, or OPENAI_API_KEY.');
  }
  return new OpenAI({ apiKey });
};

const parseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw err;
  }
};

const extractText = (response) => {
  if (!response) return '';
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim();
  }

  if (Array.isArray(response.output) && response.output.length) {
    return response.output
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.content) {
          if (Array.isArray(item.content)) {
            return item.content.map((chunk) => chunk?.text || '').join('');
          }
          return item.content?.text || '';
        }
        return '';
      })
      .join('')
      .trim();
  }

  return '';
};

const aiCreate = async (prompt, options = {}) => {
  const geminiKey = getGeminiKey();
  if (geminiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: options.temperature ?? 0.7, maxOutputTokens: options.maxTokens ?? 500 } })
    });
    if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim() || '';
  }

  const openai = createAIClient();
  const response = await openai.chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 500,
  });
  return response.choices?.[0]?.message?.content?.trim() || '';
};

const buildFallbackReply = (feedback) => `Thank you for sharing your feedback about ${feedback.title || 'this workplace concern'}. We understand that this is important to you and have recorded the details for review.

The appropriate HR team will review the concern, consider the context you provided, and determine the next steps. We will avoid making assumptions or promising an outcome before that review is complete.

If there is additional context, supporting information, or an urgent safety concern that should be considered, please add it through the employee feedback portal or contact HR directly.`;

const generateAIReply = async (feedback, scenarioContext) => {
  const context = scenarioContext ? `\n\nRelevant scenario guidance:\nCategory: ${scenarioContext.category}\nResponse template: ${scenarioContext.responseTemplate || 'Use supportive, practical guidance.'}` : '';
  const prompt = `You are an HR professional responding to employee feedback. Generate a professional, empathetic, and constructive response to the following feedback:\n\nTitle: ${feedback.title}\nCategory: ${feedback.category}\nDescription: ${feedback.description}\nPriority: ${feedback.priority}\nDepartment: ${feedback.department || 'Not specified'}\n\nPlease provide a response that:\n- Acknowledges the feedback\n- Shows empathy\n- Provides constructive insights or next steps\n- Maintains a professional and supportive tone\n- Is appropriate for workplace communication\n- Does not overpromise solutions\n\nResponse should be 150-400 words.`;
  try {
    const reply = await aiCreate(`${prompt}${context}`, { temperature: 0.7, maxTokens: 450 });
    return reply || buildFallbackReply(feedback);
  } catch (error) {
    console.error('AI reply unavailable; using HR fallback:', error.message);
    return buildFallbackReply(feedback);
  }
};

const analyzeSentiment = async (text) => {
  const prompt = `Analyze the sentiment of this employee feedback text and classify it as Positive, Neutral, Negative, or Urgent. Also suggest a category if possible. Return valid JSON only with the fields {"sentiment":"Positive|Neutral|Negative|Urgent","suggestedCategory":"Category or null"}.\n\nText: "${text}"`;
  try {
    const responseText = await aiCreate(prompt, { temperature: 0.2, maxTokens: 140 });
    return parseJSON(responseText);
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    return { sentiment: 'Neutral', suggestedCategory: null };
  }
};

const generateAIQuestions = async ({ category, title, description, priority, department }) => {
  const selectedCategory = QUESTION_CATEGORIES.includes(category) ? category : 'General';
  const selectedQuestions = selectQuestionSet({ category: selectedCategory, title, description });
  const prompt = `You are an HR assistant that creates helpful questionnaire prompts for employees preparing feedback. Based on the draft details below, return valid JSON only with the keys {"intro":"text","questions":["question1","question2", ...]}.\n\nDraft:\nTitle: ${title || 'No title provided'}\nCategory: ${category || 'General'}\nPriority: ${priority || 'Medium'}\nDepartment: ${department || 'Not specified'}\nDescription: ${description || 'No draft description yet'}`;
  try {
    const responseText = await aiCreate(prompt, { temperature: 0.5, maxTokens: 260 });
    const parsed = parseJSON(responseText);
    return {
      intro: parsed.intro || 'Answer these questions to refine your feedback.',
      questions: selectedQuestions
    };
  } catch (error) {
    console.error('AI Questionnaire Generation Error:', error);
    return {
      intro: 'Answer the questions below to improve your feedback.',
      questions: selectedQuestions
    };
  }
};

const refineFeedbackDraft = async ({ category, title, answers, priority, department }) => {
  const answerText = Object.entries(answers || {}).map(([question, answer]) => `Q: ${question}\nA: ${answer}`).join('\n\n');
  const prompt = `You are an HR assistant helping an employee turn questionnaire answers into a polished feedback submission. Current feedback title: ${title || 'Draft feedback'}\nCategory: ${category || 'General'}\nPriority: ${priority || 'Medium'}\nDepartment: ${department || 'Not specified'}\n\nUse the employee's answers below to create a polished feedback draft. Return valid JSON only with {"suggestedTitle":"short title","suggestedCategory":"category","improvedDescription":"full feedback description","feedbackTips":"a short list of guidance for the employee"}.\n\n${answerText}`;
  try {
    const responseText = await aiCreate(prompt, { temperature: 0.65, maxTokens: 500 });
    const parsed = parseJSON(responseText);
    return {
      improvedTitle: parsed.suggestedTitle || title || 'Suggested feedback title',
      improvedCategory: parsed.suggestedCategory || category || 'General',
      improvedDescription: parsed.improvedDescription || '',
      feedbackTips: parsed.feedbackTips || 'Review your answers and submit the most important points clearly.'
    };
  } catch (error) {
    console.error('AI Feedback Refinement Error:', error);
    return {
      improvedTitle: title || 'Suggested feedback title',
      improvedCategory: category || 'General',
      improvedDescription: answerText,
      feedbackTips: 'Review your answers and submit the most important points clearly.'
    };
  }
};

const summarizeQuestionnaire = async ({ category, title, description, priority, department, answers }) => {
  const answerText = Object.entries(answers || {}).map(([question, answer]) => `Q: ${question}\nA: ${answer}`).join('\n\n');
  const prompt = `You are an enterprise HR analyst. Summarize all employee questionnaire responses into a concise factual summary, choose the most appropriate category, identify the employee's expressed mood without diagnosing them, and suggest up to 5 short tags. Return valid JSON only with {"summary":"brief summary","summaryCategory":"category","summaryTags":["tag1","tag2","tag3"],"mood":"short descriptive mood","moodScore":-1}. moodScore must be between -1 and 1.\n\nEmployee draft title: ${title || 'No title'}\nCategory: ${category || 'General'}\nPriority: ${priority || 'Medium'}\nDepartment: ${department || 'Not specified'}\nDescription: ${description || 'No description provided'}\n\nQuestionnaire answers:\n${answerText}`;
  try {
    const responseText = await aiCreate(prompt, { temperature: 0.5, maxTokens: 260 });
    const parsed = parseJSON(responseText);
    const mood = detectMood(`${description || ''}\n${answerText}`);
    return {
      aiSummary: parsed.summary || description || 'Summary not available.',
      aiSummaryCategory: parsed.summaryCategory || category || 'General',
      aiSummaryTags: Array.isArray(parsed.summaryTags) ? parsed.summaryTags : [],
      mood: parsed.mood || mood.mood,
      moodScore: typeof parsed.moodScore === 'number' ? parsed.moodScore : mood.moodScore
    };
  } catch (error) {
    console.error('AI Summary Generation Error:', error);
    const mood = detectMood(`${description || ''}\n${answerText}`);
    return {
      aiSummary: description || 'Summary not available.',
      aiSummaryCategory: category || 'General',
      aiSummaryTags: [],
      mood: mood.mood,
      moodScore: mood.moodScore
    };
  }
};

const buildChatHistoryText = (messages) => {
  return messages.map((message) => {
    const label = message.sender === 'employee' ? 'Employee' : message.sender === 'ai' ? 'HR AI' : message.sender === 'system' ? 'System' : message.sender;
    return `${label}: ${message.text}`;
  }).join('\n');
};

const generateChatResponse = async (message, messages, scenarioContext) => {
  try {
    const history = buildChatHistoryText(messages);
    const context = scenarioContext ? `\n\nRelevant scenario guidance:\nCategory: ${scenarioContext.category}\nResponse template: ${scenarioContext.responseTemplate || 'Use supportive, practical guidance.'}` : '';
    const prompt = `You are an empathetic HR chatbot assistant. Use the employee's conversation history and latest question to respond with supportive workplace guidance, a constructive draft for HR, and a preview tone appropriate for a senior HR review. Keep the reply professional, concise, and formatted for the employee to read or send as a draft to HR.${context}\n\nConversation history:\n${history}\n\nEmployee: ${message}\nAssistant:`;
    return await aiCreate(prompt, { temperature: 0.75, maxTokens: 450 });
  } catch (error) {
    console.error('AI Response Generation Error:', error.message);
    // Fallback response when AI is not available
    return `Thank you for reaching out. I've noted your concern about: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}". 

This appears to be a workplace matter that would benefit from HR review. Here's a suggested draft you could send to HR:

---

Dear HR Team,

I wanted to bring to your attention: ${message}

I would appreciate your guidance on how to address this situation.

Best regards,
[Your Name]

---

Please review this draft before sending it to HR. If you'd like to modify it or discuss further, feel free to continue our conversation.`;
  }
};

const summarizeChatSession = async (messages) => {
  const history = buildChatHistoryText(messages);
  const prompt = `You are an enterprise HR analyst. Summarize the employee's chat session with the HR assistant into a short issue summary, choose the most appropriate summary category, and suggest up to 5 tags. Return valid JSON only with {"aiSummary":"...","aiSummaryCategory":"...","aiSummaryTags":["tag1","tag2","tag3"]}.\n\nChat transcript:\n${history}`;
  try {
    const responseText = await aiCreate(prompt, { temperature: 0.4, maxTokens: 260 });
    const parsed = parseJSON(responseText);
    return {
      aiSummary: parsed.aiSummary || 'Summary not available.',
      aiSummaryCategory: parsed.aiSummaryCategory || 'General',
      aiSummaryTags: Array.isArray(parsed.aiSummaryTags) ? parsed.aiSummaryTags : []
    };
  } catch (error) {
    console.error('Chat Summary Generation Error:', error);
    return {
      aiSummary: 'Summary not available.',
      aiSummaryCategory: 'General',
      aiSummaryTags: []
    };
  }
};

module.exports = {
  QUESTION_BANK,
  selectQuestionSet,
  generateAIReply,
  analyzeSentiment,
  generateAIQuestions,
  refineFeedbackDraft,
  summarizeQuestionnaire,
  generateChatResponse,
  summarizeChatSession
};