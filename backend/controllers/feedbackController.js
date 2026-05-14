const Feedback = require("../models/Feedback");
const Reply = require("../models/Reply");
const { analyzeSentiment } = require("../services/aiService");
const { validationResult } = require("express-validator");

exports.submitFeedback = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, category, description, anonymous, priority, department } = req.body;

  try {
    // Analyze sentiment
    const analysis = await analyzeSentiment(description);
    
    const feedback = new Feedback({
      title,
      category: category || analysis.suggestedCategory || "General",
      description,
      anonymous: anonymous || false,
      priority: priority || "Medium",
      department,
      sentiment: analysis.sentiment,
      aiSuggestedCategory: analysis.suggestedCategory,
      submittedBy: req.user.id
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ submittedBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getFeedbackWithReplies = async (req, res) => {
  try {
    const feedback = await Feedback.find({ submittedBy: req.user.id })
      .sort({ createdAt: -1 });

    const feedbackWithReplies = await Promise.all(
      feedback.map(async (fb) => {
        const reply = await Reply.findOne({ 
          feedbackId: fb._id, 
          sentToEmployee: true 
        }).sort({ createdAt: -1 });
        return {
          ...fb.toObject(),
          reply: reply ? reply.finalReply : null,
          replyDate: reply ? reply.createdAt : null
        };
      })
    );

    res.json(feedbackWithReplies);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const { category, priority, status, department, anonymous, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    let query = {};

    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (department) query.department = department;
    if (anonymous !== undefined) query.anonymous = anonymous === "true";
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const feedback = await Feedback.find(query)
      .populate("submittedBy", "name email department")
      .sort(sortOptions);

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateFeedbackStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteFeedback = async (req, res) => {
  const { id } = req.params;

  try {
    await Feedback.findByIdAndDelete(id);
    await Reply.deleteMany({ feedbackId: id });
    res.json({ message: "Feedback deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
