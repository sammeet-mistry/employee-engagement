const ChatSession = require('../models/ChatSession');
const Feedback = require('../models/Feedback');
const { generateChatResponse, summarizeChatSession } = require('../services/aiService');

const createChatSession = async (req, res) => {
  console.log('createChatSession called with:', req.body);
  console.log('User:', req.user);

  const { initialMessage, title, department, priority } = req.body;

  if (!initialMessage || initialMessage.trim().length === 0) {
    return res.status(400).json({ message: 'Please provide a message to start the chat.' });
  }

  const session = new ChatSession({
    user: req.user.id,
    title: title || 'HR Chat Assistant',
    department: department || 'General',
    priority: priority || 'Medium',
    messages: [{ sender: 'employee', text: initialMessage, role: 'user' }]
  });

  const aiResponse = await generateChatResponse(initialMessage, session.messages);
  session.messages.push({ sender: 'ai', text: aiResponse, role: 'assistant' });

  await session.save();
  res.json(session);
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

  session.messages.push({ sender: 'employee', text: message, role: 'user' });
  const aiResponse = await generateChatResponse(message, session.messages);
  session.messages.push({ sender: 'ai', text: aiResponse, role: 'assistant' });

  await session.save();
  res.json(session);
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
    user: req.user.id,
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
