const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['General', 'Work Environment', 'Management', 'Compensation', 'Benefits', 'Career Development', 'Other'],
    default: 'General'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  department: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'AI Draft Generated', 'AI Auto Responded', 'Responded', 'Resolved'],
    default: 'Pending'
  },
  sentiment: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative', 'Urgent'],
    default: 'Neutral'
  },
  aiSuggestedCategory: {
    type: String,
    trim: true
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
  },
  questionAnswers: {
    type: Map,
    of: String,
    default: {}
  },
  questionCount: {
    type: Number,
    default: 0
  },
  mood: {
    type: String,
    trim: true
  },
  moodScore: {
    type: Number,
    min: -1,
    max: 1
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chatSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);