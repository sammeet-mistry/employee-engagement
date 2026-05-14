const OpenAI = require('openai');

const getApiKey = () => {
  return process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
};

const getModel = () => {
  return process.env.AI_MODEL || process.env.GEMINI_MODEL || 'gpt-4o-mini';
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
  const openai = createAIClient();
  const model = getModel();
  const response = await openai.responses.create({
    model,
    input: prompt,
    temperature: options.temperature ?? 0.7,
    max_output_tokens: options.maxTokens ?? 500,
  });
  return extractText(response);
};

const generateAIReply = async (feedback) => {
  const prompt = `You are an HR professional responding to employee feedback. Generate a professional, empathetic, and constructive response to the following feedback:\n\nTitle: ${feedback.title}\nCategory: ${feedback.category}\nDescription: ${feedback.description}\nPriority: ${feedback.priority}\nDepartment: ${feedback.department || 'Not specified'}\n\nPlease provide a response that:\n- Acknowledges the feedback\n- Shows empathy\n- Provides constructive insights or next steps\n- Maintains a professional and supportive tone\n- Is appropriate for workplace communication\n- Does not overpromise solutions\n\nResponse should be 150-400 words.`;
  return aiCreate(prompt, { temperature: 0.7, maxTokens: 450 });
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
  const prompt = `You are an HR assistant that creates helpful questionnaire prompts for employees preparing feedback. Based on the draft details below, return valid JSON only with the keys {"intro":"text","questions":["question1","question2", ...]}.\n\nDraft:\nTitle: ${title || 'No title provided'}\nCategory: ${category || 'General'}\nPriority: ${priority || 'Medium'}\nDepartment: ${department || 'Not specified'}\nDescription: ${description || 'No draft description yet'}`;
  try {
    const responseText = await aiCreate(prompt, { temperature: 0.5, maxTokens: 260 });
    const parsed = parseJSON(responseText);
    return {
      intro: parsed.intro || 'Answer these questions to refine your feedback.',
      questions: Array.isArray(parsed.questions) ? parsed.questions : []
    };
  } catch (error) {
    console.error('AI Questionnaire Generation Error:', error);
    return {
      intro: 'Answer the questions below to improve your feedback.',
      questions: [
        'What happened and why is this important?',
        'How did this affect your work or team?',
        'What outcome would you like to see?',
        'What positive or constructive idea would you recommend?'
      ]
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
  const prompt = `You are an enterprise HR analyst. Summarize the employee's questionnaire responses into a concise summary and choose the most appropriate category. Also suggest up to 5 short tags that describe the topic areas. Return valid JSON only with {"summary":"brief summary","summaryCategory":"category","summaryTags":["tag1","tag2","tag3"]}.\n\nEmployee draft title: ${title || 'No title'}\nCategory: ${category || 'General'}\nPriority: ${priority || 'Medium'}\nDepartment: ${department || 'Not specified'}\nDescription: ${description || 'No description provided'}\n\nQuestionnaire answers:\n${answerText}`;
  try {
    const responseText = await aiCreate(prompt, { temperature: 0.5, maxTokens: 260 });
    const parsed = parseJSON(responseText);
    return {
      aiSummary: parsed.summary || description || 'Summary not available.',
      aiSummaryCategory: parsed.summaryCategory || category || 'General',
      aiSummaryTags: Array.isArray(parsed.summaryTags) ? parsed.summaryTags : []
    };
  } catch (error) {
    console.error('AI Summary Generation Error:', error);
    return {
      aiSummary: description || 'Summary not available.',
      aiSummaryCategory: category || 'General',
      aiSummaryTags: []
    };
  }
};

const buildChatHistoryText = (messages) => {
  return messages.map((message) => {
    const label = message.sender === 'employee' ? 'Employee' : message.sender === 'ai' ? 'HR AI' : message.sender === 'system' ? 'System' : message.sender;
    return `${label}: ${message.text}`;
  }).join('\n');
};

const generateChatResponse = async (message, messages) => {
  try {
    const history = buildChatHistoryText(messages);
    const prompt = `You are an empathetic HR chatbot assistant. Use the employee's conversation history and latest question to respond with supportive workplace guidance, a constructive draft for HR, and a preview tone appropriate for a senior HR review. Keep the reply professional, concise, and formatted for the employee to read or send as a draft to HR.\n\nConversation history:\n${history}\n\nEmployee: ${message}\nAssistant:`;
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
  generateAIReply,
  analyzeSentiment,
  generateAIQuestions,
  refineFeedbackDraft,
  summarizeQuestionnaire,
  generateChatResponse,
  summarizeChatSession
};