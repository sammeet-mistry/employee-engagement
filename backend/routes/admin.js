const express = require('express');
const {
  generateAIReply,
  approveAndSendReply,
  getRepliesForFeedback,
  getFeedbackStats
} = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');
const {
  getScenarios,
  updateScenario,
  deleteScenario,
  getUnmatchedScenarios,
  createScenarioFromUnmatched
} = require('../controllers/scenarioController');

const router = express.Router();

router.post('/generate-ai-reply/:feedbackId', auth, adminOnly, generateAIReply);
router.post('/approve-reply/:replyId', auth, adminOnly, approveAndSendReply);
router.get('/replies/:feedbackId', auth, adminOnly, getRepliesForFeedback);
router.get('/stats', auth, adminOnly, getFeedbackStats);
router.get('/scenarios', auth, adminOnly, getScenarios);
router.patch('/scenarios/:id', auth, adminOnly, updateScenario);
router.delete('/scenarios/:id', auth, adminOnly, deleteScenario);
router.get('/unmatched-scenarios', auth, adminOnly, getUnmatchedScenarios);
router.post('/scenarios/from-unmatched/:unmatchedId', auth, adminOnly, createScenarioFromUnmatched);

module.exports = router;