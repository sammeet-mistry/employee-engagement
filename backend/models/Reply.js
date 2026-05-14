const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  feedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
    required: true
  },
  generatedByAI: {
    type: Boolean,
    default: false
  },
  aiDraft: {
    type: String,
    trim: true
  },
  finalReply: {
    type: String,
    required: true,
    trim: true
  },
  approvedByAdmin: {
    type: Boolean,
    default: false
  },
  sentToEmployee: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reply', replySchema);