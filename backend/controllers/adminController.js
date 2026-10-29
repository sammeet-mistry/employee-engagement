const Feedback = require("../models/Feedback");
const Reply = require("../models/Reply");
const { generateAIReply } = require("../services/aiService");
const { categorizeMessage } = require('../services/scenarioService');

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

    const io = req.app.get('io');
    if (io) io.emit('feedback:updated', { feedbackId: feedback._id });

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
    await Feedback.findByIdAndUpdate(reply.feedbackId, { status: "Responded" });

    const io = req.app.get('io');
    if (io) io.emit('feedback:updated', { feedbackId: reply.feedbackId });

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
