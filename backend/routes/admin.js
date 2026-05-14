const express = require('express');
const {
  generateAIReply,
  approveAndSendReply,
  getRepliesForFeedback,
  getFeedbackStats
} = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/generate-ai-reply/:feedbackId', auth, adminOnly, generateAIReply);
router.post('/approve-reply/:replyId', auth, adminOnly, approveAndSendReply);
router.get('/replies/:feedbackId', auth, adminOnly, getRepliesForFeedback);
router.get('/stats', auth, adminOnly, getFeedbackStats);

module.exports = router;