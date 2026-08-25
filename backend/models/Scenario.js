const mongoose = require('mongoose');

const scenarioSchema = new mongoose.Schema({
  triggerPatterns: { type: [String], default: [] },
  category: {
    type: String,
    enum: ['workload', 'management', 'compensation', 'culture', 'tools_process', 'harassment_safety', 'other'],
    required: true
  },
  sentimentRange: {
    min: { type: Number, min: -1, max: 1, default: -1 },
    max: { type: Number, min: -1, max: 1, default: 1 }
  },
  responseTemplate: { type: String, trim: true, default: '' },
  embedding: { type: [Number], default: [] },
  escalationRequired: { type: Boolean, default: false },
  confidenceThreshold: { type: Number, min: 0, max: 1, default: 0.75 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  usageCount: { type: Number, default: 0 },
  lastMatchedAt: { type: Date },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Scenario', scenarioSchema);