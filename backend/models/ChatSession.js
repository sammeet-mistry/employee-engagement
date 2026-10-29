const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['employee', 'ai', 'rag', 'hr', 'admin', 'system'],
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    default: 'user'
  },
  matchedScenarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scenario'
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1
  },
  wasHumanCorrected: {
    type: Boolean,
    default: false
  },
  originalCategory: {
    type: String,
    trim: true
  },
  correctedCategory: {
    type: String,
    trim: true
  },
  sources: [{
    title: { type: String, trim: true },
    section: { type: String, trim: true },
    page: { type: mongoose.Schema.Types.Mixed },
    url: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed }
  }],
  retrievalStatus: {
    type: String,
    enum: ['grounded', 'no_reliable_source'],
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    trim: true,
    default: 'HR Knowledge Assistant'
  },
  department: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['active', 'sent_to_hr', 'escalated', 'closed'],
    default: 'active'
  },
  messages: [chatMessageSchema],
  feedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  },
  aiSummary: {
    type: String,
    trim: true
  },
  aiSummaryCategory: {
    type: String,
    trim: true
  },
  aiSummaryTags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
