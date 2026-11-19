const Feedback = require("../models/Feedback");
const Reply = require("../models/Reply");
const User = require('../models/User');
const { generateAIReply } = require("../services/aiService");
const { categorizeMessage } = require('../services/scenarioService');
const { emitFeedbackEvent } = require('../utils/realtime');
const AuditLog = require('../models/AuditLog');
const { recordAudit } = require('../utils/audit');
const { parsePagination, createPagination } = require('../utils/pagination');

exports.generateAIReply = async (req, res) => {
  const { feedbackId } = req.params;

  try {
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    const scenarioResult = await categorizeMessage({
      message: `${feedback.title}\n${feedback.description}`,
      sourceType: 'feedback',
      sourceId: feedback._id
    });
    const aiReply = await generateAIReply(feedback, scenarioResult.scenario);

    // Save AI draft
    const reply = new Reply({
      feedbackId,
      generatedByAI: true,
      aiDraft: aiReply,
      finalReply: aiReply, // Initially same as draft
      approvedByAdmin: false,
      sentToEmployee: false,
      createdBy: req.user.id
    });

    await reply.save();

    // Update feedback status
    await Feedback.findByIdAndUpdate(feedbackId, { status: "AI Draft Generated" });
    await recordAudit(req, {
      action: 'reply.ai_draft_generated',
      resourceType: 'feedback',
      resourceId: feedback._id
    });

    const io = req.app.get('io');
    if (io) emitFeedbackEvent(io, 'feedback:updated', feedback);

    res.json({ reply: aiReply, replyId: reply._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate AI reply" });
  }
};

exports.approveAndSendReply = async (req, res) => {
  const { replyId } = req.params;
  const { finalReply } = req.body;

  try {
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    reply.finalReply = finalReply;
    reply.approvedByAdmin = true;
    reply.sentToEmployee = true;
    await reply.save();

    // Update feedback status
    const feedback = await Feedback.findByIdAndUpdate(
      reply.feedbackId,
      { status: "Responded" },
      { new: true }
    );

    const io = req.app.get('io');
    if (io && feedback) emitFeedbackEvent(io, 'feedback:updated', feedback);
    await recordAudit(req, {
      action: 'reply.approved_and_sent',
      resourceType: 'reply',
      resourceId: reply._id,
      details: { feedbackId: reply.feedbackId.toString() }
    });

    res.json({ message: "Reply sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRepliesForFeedback = async (req, res) => {
  const { feedbackId } = req.params;

  try {
    const replies = await Reply.find({ feedbackId })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json(replies);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getFeedbackStats = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    const statsObj = {
      total,
      ...stats.reduce((acc, stat) => {
        acc[stat._id.toLowerCase().replace(" ", "")] = stat.count;
        return acc;
      }, {})
    };

    res.json(statsObj);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, 20);
    const query = {};
    if (typeof req.query.action === 'string' && req.query.action.trim()) {
      query.action = req.query.action.trim();
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query)
    ]);

    res.json({ items: logs, pagination: createPagination(page, limit, total) });
  } catch (error) {
    console.error('Unable to load admin audit history:', error.code || error.name);
    res.status(500).json({ message: 'Unable to load audit history right now.' });
  }
};

exports.getAssignableAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('name')
      .sort({ name: 1 })
      .lean();
    res.json(admins);
  } catch (error) {
    console.error('Unable to load HR administrators:', error.code || error.name);
    res.status(500).json({ message: 'Unable to load the HR assignment list.' });
  }
};

exports.getAssignedFeedbackCount = async (req, res) => {
  try {
    const count = await Feedback.countDocuments({
      assignedTo: req.user.id,
      status: { $nin: ['Responded', 'Resolved', 'AI Auto Responded'] }
    });
    res.json({ count });
  } catch (error) {
    console.error('Unable to load assigned feedback count:', error.code || error.name);
    res.status(500).json({ message: 'Unable to load your assigned feedback count.' });
  }
};
