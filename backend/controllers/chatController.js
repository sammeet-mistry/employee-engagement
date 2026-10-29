const ChatSession = require('../models/ChatSession');
const Feedback = require('../models/Feedback');
const {
  queryHrKnowledgeBase,
  RagAgentNotConfiguredError,
  RagAgentTimeoutError
} = require('../services/ragAgentService');
const { categorizeMessage, recordUnmatchedScenario } = require('../services/scenarioService');

const MAX_MESSAGE_LENGTH = 4000;
const allowedCategories = ['General', 'Work Environment', 'Management', 'Compensation', 'Benefits', 'Career Development', 'Other'];

const emitSessionUpdate = (req, session, result) => {
  const io = req.app.get('io');
  if (!io) return;
  io.emit('chat:session-updated', { sessionId: session._id });
  if (result?.unmatched) io.emit('scenario:unmatched', { unmatchedId: result.unmatched._id });
};

const addScenarioEscalation = (session) => {
  session.status = 'escalated';
  session.messages.push({
    sender: 'system',
    text: 'This conversation has been marked for HR follow-up. If there is immediate danger, contact local emergency services or your organization’s urgent support channel now.',
    role: 'system'
  });
};

const createChatSession = async (req, res) => {
  try {
    const session = await ChatSession.create({
      user: req.user.id,
      title: 'HR Knowledge Assistant',
      department: req.user.department || 'General',
      messages: []
    });
    res.status(201).json(session);
  } catch (error) {
    console.error('Unable to create HR knowledge session:', error.code || error.name);
    res.status(500).json({ message: 'Unable to start a conversation right now. Please try again.' });
  }
};

const getUserChatSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('Unable to load employee chat sessions:', error.code || error.name);
    res.status(500).json({ message: 'Unable to load your conversations right now. Please try again.' });
  }
};

const getAllChatSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find()
      .populate('user', 'name email department')
      .sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('Unable to load admin chat sessions:', error.code || error.name);
    res.status(500).json({ message: 'Unable to load conversations right now.' });
  }
};

const getChatSession = async (req, res) => {
  try {
    const query = { _id: req.params.sessionId };
    if (req.user.role !== 'admin') query.user = req.user.id;

    const session = await ChatSession.findOne(query).populate('user', 'name email department');
    if (!session) return res.status(404).json({ message: 'Conversation not found.' });
    res.json(session);
  } catch (error) {
    console.error('Unable to load chat session:', error.code || error.name);
    res.status(500).json({ message: 'Unable to load this conversation right now.' });
  }
};

const addChatMessage = async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!message) return res.status(400).json({ message: 'Write a question before sending.' });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ message: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
  }

  try {
    const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ message: 'Conversation not found.' });
    if (session.status !== 'active') return res.status(409).json({ message: 'This conversation is no longer active.' });

    const scenarioResult = await categorizeMessage({
      message,
      sourceType: 'chat',
      sourceId: session._id,
      recordUnmatched: false
    });
    const employeeMessage = { sender: 'employee', text: message, role: 'user' };

    if (scenarioResult.scenario) {
      employeeMessage.matchedScenarioId = scenarioResult.scenario._id;
      employeeMessage.confidenceScore = scenarioResult.confidence;
      employeeMessage.originalCategory = scenarioResult.scenario.category;
    } else if (scenarioResult.attemptedCategory) {
      employeeMessage.originalCategory = scenarioResult.attemptedCategory;
    }

    if (scenarioResult.safety || scenarioResult.scenario?.escalationRequired) {
      session.messages.push(employeeMessage);
      addScenarioEscalation(session);
      if (!scenarioResult.scenario && scenarioResult.attemptedCategory) {
        scenarioResult.unmatched = await recordUnmatchedScenario({
          rawMessage: message,
          sourceType: 'chat',
          sourceId: session._id,
          attemptedCategory: scenarioResult.attemptedCategory,
          confidenceScore: scenarioResult.confidenceScore
        });
      }
      await session.save();
      emitSessionUpdate(req, session, scenarioResult);
      return res.json(session);
    }

    let ragResult;
    try {
      ragResult = await queryHrKnowledgeBase({ question: message });
    } catch (error) {
      if (error instanceof RagAgentNotConfiguredError || error.code === 'RAG_AGENT_NOT_CONFIGURED') {
        return res.status(503).json({
          message: 'The HR knowledge assistant is not configured. Your question was not sent to it. Try again later or use HR follow-up.'
        });
      }
      if (error instanceof RagAgentTimeoutError || error.code === 'RAG_AGENT_TIMEOUT') {
        console.error('HR knowledge assistant request timed out.');
        return res.status(504).json({
          message: 'The HR knowledge assistant timed out. Please retry or use HR follow-up.'
        });
      }
      console.error('HR knowledge assistant request failed:', error.code || error.name);
      return res.status(502).json({
        message: 'The HR knowledge assistant is temporarily unavailable. Please retry or use HR follow-up.'
      });
    }

    if (!ragResult || typeof ragResult.answer !== 'string' || typeof ragResult.reliable !== 'boolean' || !Array.isArray(ragResult.sources)) {
      console.error('HR knowledge assistant returned an invalid response shape.');
      return res.status(502).json({
        message: 'The HR knowledge assistant returned an invalid response. Please retry or use HR follow-up.'
      });
    }

    const sources = ragResult.sources
      .filter((source) => source && typeof source.title === 'string' && source.title.trim())
      .map((source) => ({
        title: source.title.trim().slice(0, 300),
        ...(typeof source.section === 'string' && source.section.trim() ? { section: source.section.trim().slice(0, 200) } : {}),
        ...(typeof source.page === 'number' ? { page: source.page } : typeof source.page === 'string' && source.page.trim() ? { page: source.page.trim().slice(0, 80) } : {}),
        ...(typeof source.url === 'string' && source.url.length <= 2048 && /^https?:\/\//i.test(source.url) ? { url: source.url } : {})
      }));
    const isReliable = ragResult.reliable && sources.length > 0 && ragResult.answer.trim().length > 0;
    const answer = isReliable
      ? ragResult.answer.trim()
      : 'The approved HR knowledge base did not provide a reliable answer to this question, so I don’t want to guess about company policy. You can send this conversation to HR for follow-up.';

    session.messages.push(
      employeeMessage,
      {
        sender: 'rag',
        text: answer || 'The approved HR knowledge base did not provide a reliable answer. You can send this conversation to HR for follow-up.',
        role: 'assistant',
        sources,
        retrievalStatus: isReliable ? 'grounded' : 'no_reliable_source'
      }
    );
    if (!scenarioResult.scenario && scenarioResult.attemptedCategory) {
      scenarioResult.unmatched = await recordUnmatchedScenario({
        rawMessage: message,
        sourceType: 'chat',
        sourceId: session._id,
        attemptedCategory: scenarioResult.attemptedCategory,
        confidenceScore: scenarioResult.confidenceScore
      });
    }
    await session.save();
    emitSessionUpdate(req, session, scenarioResult);
    res.json(session);
  } catch (error) {
    console.error('Unable to send employee message:', error.code || error.name);
    res.status(500).json({ message: 'Unable to send your question right now. Please try again.' });
  }
};

const addAdminMessage = async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!message) return res.status(400).json({ message: 'Message cannot be empty.' });

  try {
    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Conversation not found.' });
    session.messages.push({ sender: 'admin', text: message, role: 'assistant' });
    await session.save();
    emitSessionUpdate(req, session);
    res.json(session);
  } catch (error) {
    console.error('Unable to add HR message:', error.code || error.name);
    res.status(500).json({ message: 'Unable to send the HR message right now.' });
  }
};

const sendChatToHR = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ message: 'Conversation not found.' });
    if (session.feedbackId) return res.status(400).json({ message: 'This conversation has already been sent to HR.' });

    const transcript = session.messages
      .filter((entry) => ['employee', 'rag'].includes(entry.sender))
      .map((entry) => `${entry.sender === 'employee' ? 'Employee' : 'HR Knowledge Assistant'}: ${entry.text}`)
      .join('\n\n');
    if (!transcript) return res.status(400).json({ message: 'Add a message before sending this conversation to HR.' });

    const category = session.messages.find((entry) => entry.sender === 'employee' && allowedCategories.includes(entry.originalCategory))?.originalCategory || 'General';
    const feedback = new Feedback({
      submittedBy: req.user.id,
      title: 'Employee request for HR follow-up',
      category,
      description: transcript,
      status: 'Pending',
      priority: session.priority,
      department: session.department,
      chatSession: session._id
    });
    await feedback.save();

    session.feedbackId = feedback._id;
    session.status = 'sent_to_hr';
    await session.save();
    emitSessionUpdate(req, session);

    const io = req.app.get('io');
    if (io) io.emit('feedback:created', { feedbackId: feedback._id });
    res.json({ session, feedback });
  } catch (error) {
    console.error('Unable to send conversation to HR:', error.code || error.name);
    res.status(500).json({ message: 'Unable to send this conversation to HR right now. Please try again.' });
  }
};

const escalateChatSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ message: 'Conversation not found.' });

    if (session.status !== 'escalated') {
      addScenarioEscalation(session);
      await session.save();
      emitSessionUpdate(req, session);
    }
    res.json(session);
  } catch (error) {
    console.error('Unable to request HR follow-up:', error.code || error.name);
    res.status(500).json({ message: 'Unable to request HR follow-up right now. Please try again.' });
  }
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
