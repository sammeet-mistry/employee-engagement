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

const saveUnavailableAssistantReply = async (req, res, session, employeeMessage) => {
  session.messages.push(employeeMessage, {
    sender: 'rag',
    text: 'The HR knowledge assistant is temporarily unavailable. Your question has been saved. You can send this conversation to HR for follow-up.',
    role: 'assistant',
    sources: [],
    retrievalStatus: 'no_reliable_source'
  });
  await session.save();
  emitSessionUpdate(req, session);
  return res.json({ ...session.toObject(), assistantAvailable: false });
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

const syncFollowUpFeedback = async (req, session, message, sender) => {
  if (!session.feedbackId) return;
  try {
    const feedback = await Feedback.findById(session.feedbackId);
    if (!feedback) return;
    feedback.messages.push({ sender: sender === 'admin' ? 'hr' : 'employee', text: message.text });
    feedback.description = session.messages
      .filter((entry) => ['employee', 'rag', 'admin'].includes(entry.sender))
      .map((entry) => `${entry.sender === 'employee' ? 'Employee' : entry.sender === 'admin' ? 'HR' : 'HR Knowledge Assistant'}: ${entry.text}`)
      .join('\n\n');
    if (sender === 'admin') feedback.status = 'Responded';
    else if (['Responded', 'AI Auto Responded', 'Resolved'].includes(feedback.status)) feedback.status = 'Under Review';
    await feedback.save();
    const io = req.app.get('io');
    if (io) io.emit('feedback:updated', { feedbackId: feedback._id });
  } catch (error) {
    console.error('Unable to sync chat message to HR follow-up:', error.code || error.name);
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
    if (session.status === 'closed') return res.status(409).json({ message: 'This conversation is closed.' });

    const employeeMessage = { sender: 'employee', text: message, role: 'user' };
    if (session.status !== 'active' || session.messages.some((entry) => entry.sender === 'admin' || entry.sender === 'hr')) {
      session.messages.push(employeeMessage);
      await session.save();
      await syncFollowUpFeedback(req, session, employeeMessage, 'employee');
      emitSessionUpdate(req, session);
      return res.json({ ...session.toObject(), deliveredToHr: true });
    }

    const scenarioResult = await categorizeMessage({
      message,
      sourceType: 'chat',
      sourceId: session._id,
      recordUnmatched: false
    });
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
        return await saveUnavailableAssistantReply(req, res, session, employeeMessage);
      }
      if (error instanceof RagAgentTimeoutError || error.code === 'RAG_AGENT_TIMEOUT') {
        console.error('HR knowledge assistant request timed out.');
        return await saveUnavailableAssistantReply(req, res, session, employeeMessage);
      }
      console.error('HR knowledge assistant request failed:', error.code || error.name, error.kind || 'unknown', error.statusCode || '', error.upstreamCode || '');
      return await saveUnavailableAssistantReply(req, res, session, employeeMessage);
    }

    if (!ragResult || typeof ragResult.answer !== 'string' || typeof ragResult.reliable !== 'boolean' || !Array.isArray(ragResult.sources)) {
      console.error('HR knowledge assistant returned an invalid response shape.');
      return await saveUnavailableAssistantReply(req, res, session, employeeMessage);
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
    res.json({ ...session.toObject(), assistantAvailable: true });
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
    await syncFollowUpFeedback(req, session, session.messages[session.messages.length - 1], 'admin');
    emitSessionUpdate(req, session);
    res.json(session);
  } catch (error) {
    console.error('Unable to add HR message:', error.code || error.name);
    res.status(500).json({ message: 'Unable to send the HR message right now.' });
  }
};

const deleteChatSession = async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Conversation not found.' });
    if (session.status !== 'active' || session.feedbackId) {
      return res.status(409).json({ message: 'Only open chats that have not been sent to HR can be deleted.' });
    }

    await session.deleteOne();
    const io = req.app.get('io');
    if (io) io.emit('chat:session-deleted', { sessionId: session._id });
    res.json({ message: 'Open chat deleted.' });
  } catch (error) {
    console.error('Unable to delete employee chat:', error.code || error.name);
    res.status(500).json({ message: 'Unable to delete this chat right now.' });
  }
};

const sendChatToHR = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ message: 'Conversation not found.' });
    if (session.feedbackId) return res.status(400).json({ message: 'This conversation has already been sent to HR.' });

    const transcript = session.messages
      .filter((entry) => ['employee', 'rag', 'admin', 'hr'].includes(entry.sender))
      .map((entry) => `${entry.sender === 'employee' ? 'Employee' : ['admin', 'hr'].includes(entry.sender) ? 'HR' : 'HR Knowledge Assistant'}: ${entry.text}`)
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

const createHrFollowUp = async (req, session) => {
  if (session.feedbackId) return Feedback.findById(session.feedbackId);
  const transcript = session.messages
    .filter((entry) => ['employee', 'rag', 'admin', 'hr'].includes(entry.sender))
    .map((entry) => `${entry.sender === 'employee' ? 'Employee' : ['admin', 'hr'].includes(entry.sender) ? 'HR' : 'HR Knowledge Assistant'}: ${entry.text}`)
    .join('\n\n');
  if (!transcript) return null;

  const category = session.messages.find((entry) => entry.sender === 'employee' && allowedCategories.includes(entry.originalCategory))?.originalCategory || 'General';
  const feedback = await Feedback.create({
    submittedBy: req.user.id,
    title: 'Employee request for HR follow-up',
    category,
    description: transcript,
    status: 'Pending',
    priority: session.priority,
    department: session.department,
    chatSession: session._id
  });
  session.feedbackId = feedback._id;
  return feedback;
};

const escalateChatSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ message: 'Conversation not found.' });

    if (!session.messages.some((entry) => entry.sender === 'employee')) {
      return res.status(400).json({ message: 'Add a question before requesting HR follow-up.' });
    }
    const feedback = await createHrFollowUp(req, session);
    if (session.status !== 'escalated') addScenarioEscalation(session);
    await session.save();
    emitSessionUpdate(req, session);
    const io = req.app.get('io');
    if (io && feedback) io.emit('feedback:created', { feedbackId: feedback._id });
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
  deleteChatSession,
  sendChatToHR,
  escalateChatSession
};
