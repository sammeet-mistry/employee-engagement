const ChatSession = require('../models/ChatSession');
const Feedback = require('../models/Feedback');
const { generateChatResponse, summarizeChatSession } = require('../services/aiService');
const { categorizeMessage } = require('../services/scenarioService');

const applyScenarioToMessage = async (message, sourceId) => {
  const result = await categorizeMessage({ message, sourceType: 'chat', sourceId });
  const annotation = {
    matchedScenarioId: result.scenario?._id,
    confidenceScore: result.confidence,
    originalCategory: result.scenario?.category || result.unmatched?.attemptedCategory
  };
  return { result, annotation };
};

const addScenarioEscalation = (session, result) => {
  if (!result.safety && !result.scenario?.escalationRequired) return;
  session.status = 'escalated';
  session.messages.push({ sender: 'system', text: 'Your message has been flagged for additional HR support. You are not alone, and an HR representative will help review this carefully.', role: 'system' });
};

const emitChatEvents = (req, session, result) => {
  const io = req.app.get('io');
  if (!io) return;
  io.emit('chat:session-updated', { sessionId: session._id });
  if (result.unmatched) io.emit('scenario:unmatched', { unmatchedId: result.unmatched._id });
};

const createChatSession = async (req, res) => {
  const { initialMessage, title, department, priority } = req.body;

  if (!initialMessage || initialMessage.trim().length === 0) {
    return res.status(400).json({ message: 'Please provide a message to start the chat.' });
  }

  const session = new ChatSession({
    user: req.user.id,
    title: title || 'HR Chat Assistant',
    department: department || 'General',
    priority: priority || 'Medium',
    messages: []
  });

  try {
    const { result, annotation } = await applyScenarioToMessage(initialMessage, session._id);
    session.messages.push({ sender: 'employee', text: initialMessage.trim(), role: 'user', ...annotation });
    addScenarioEscalation(session, result);
    const aiResponse = await generateChatResponse(initialMessage.trim(), session.messages, result.scenario);
    session.messages.push({ sender: 'ai', text: aiResponse, role: 'assistant' });

    await session.save();
    emitChatEvents(req, session, result);
    res.json(session);
  } catch (error) {
    console.error('Chat session creation error:', error.message);
    res.status(500).json({ message: 'Unable to start the chat right now. Please try again.' });
  }
};

const getUserChatSessions = async (req, res) => {
  const sessions = await ChatSession.find({ user: req.user.id }).sort({ updatedAt: -1 });
  res.json(sessions);
};

const getAllChatSessions = async (req, res) => {
  const sessions = await ChatSession.find()
    .populate('user', 'name email department')
    .sort({ updatedAt: -1 });
  res.json(sessions);
};

const getChatSession = async (req, res) => {
  const query = { _id: req.params.sessionId };
  if (req.user.role !== 'admin') {
    query.user = req.user.id;
  }

  const session = await ChatSession.findOne(query).populate('user', 'name email department');
  if (!session) {
    return res.status(404).json({ message: 'Chat session not found.' });
  }
  res.json(session);
};

const addChatMessage = async (req, res) => {
  const { message } = req.body;
  const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.user.id });

  if (!session) {
    return res.status(404).json({ message: 'Chat session not found.' });
  }

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ message: 'Message cannot be empty.' });
  }

  try {
    const { result, annotation } = await applyScenarioToMessage(message, session._id);
    session.messages.push({ sender: 'employee', text: message.trim(), role: 'user', ...annotation });
    addScenarioEscalation(session, result);
    const aiResponse = await generateChatResponse(message.trim(), session.messages, result.scenario);
    session.messages.push({ sender: 'ai', text: aiResponse, role: 'assistant' });

    await session.save();
    emitChatEvents(req, session, result);
    res.json(session);
  } catch (error) {
    console.error('Chat message error:', error.message);
    res.status(500).json({ message: 'Unable to send your message right now. Please try again.' });
  }
};

const addAdminMessage = async (req, res) => {
  const { message } = req.body;
  const session = await ChatSession.findById(req.params.sessionId);

  if (!session) {
    return res.status(404).json({ message: 'Chat session not found.' });
  }

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ message: 'Message cannot be empty.' });
  }

  session.messages.push({ sender: 'admin', text: message, role: 'assistant' });
  await session.save();
  const io = req.app.get('io');
  if (io) io.emit('chat:session-updated', { sessionId: session._id });
  res.json(session);
};

const sendChatToHR = async (req, res) => {
  const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.user.id });
  if (!session) {
    return res.status(404).json({ message: 'Chat session not found.' });
  }

  if (session.feedbackId) {
    return res.status(400).json({ message: 'This chat has already been sent to HR.' });
  }

  const summary = await summarizeChatSession(session.messages);
  session.aiSummary = summary.aiSummary;
  session.aiSummaryCategory = summary.aiSummaryCategory;
  session.aiSummaryTags = summary.aiSummaryTags;
  session.status = 'sent_to_hr';

  const allowedCategories = ['General', 'Work Environment', 'Management', 'Compensation', 'Benefits', 'Career Development', 'Other'];
  const feedbackCategory = allowedCategories.includes(summary.aiSummaryCategory)
    ? summary.aiSummaryCategory
    : 'General';

  const feedback = new Feedback({
    submittedBy: req.user.id,
    title: `${feedbackCategory} summary`,
    category: feedbackCategory,
    description: summary.aiSummary || session.messages.filter(msg => msg.sender === 'employee').map(msg => msg.text).join('\n\n'),
    status: 'Pending',
    aiSummary: summary.aiSummary,
    aiSummaryCategory: summary.aiSummaryCategory,
    aiSummaryTags: summary.aiSummaryTags,
    chatSession: session._id
  });

  await feedback.save();
  session.feedbackId = feedback._id;
  await session.save();

  const io = req.app.get('io');
  if (io) {
    io.emit('chat:session-updated', { sessionId: session._id });
    io.emit('feedback:created', { feedbackId: feedback._id });
  }

  res.json({ session, feedback });
};

const escalateChatSession = async (req, res) => {
  const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.user.id });
  if (!session) {
    return res.status(404).json({ message: 'Chat session not found.' });
  }

  session.status = 'escalated';
  session.messages.push({ sender: 'system', text: 'Employee requested an HR agent to assist with this issue.', role: 'system' });
  await session.save();
  const io = req.app.get('io');
  if (io) io.emit('chat:session-updated', { sessionId: session._id });
  res.json(session);
};

module.exports = {
  createChatSession,
  getUserChatSessions,
  getAllChatSessions,
  getChatSession,
  addChatMessage,
  addAdminMessage,
  sendChatToHR,
  escalateChatSession
};
