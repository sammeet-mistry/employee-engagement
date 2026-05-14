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
    enum: ['Pending', 'Under Review', 'AI Draft Generated', 'Responded', 'Resolved'],
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
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);