const mongoose = require('mongoose');

const unmatchedScenarioSchema = new mongoose.Schema({
  rawMessage: { type: String, required: true, trim: true },
  sourceType: { type: String, enum: ['chat', 'feedback'], required: true },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: function refPath() {
      return this.sourceType === 'chat' ? 'ChatSession' : 'Feedback';
    }
  },
  attemptedCategory: { type: String, trim: true },
  confidenceScore: { type: Number, min: 0, max: 1 },
  status: {
    type: String,
    enum: ['pending_review', 'converted_to_scenario', 'dismissed'],
    default: 'pending_review'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('UnmatchedScenario', unmatchedScenarioSchema);