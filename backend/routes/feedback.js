const express = require('express');
const {
  submitFeedback,
  getMyFeedback,
  getFeedbackWithReplies,
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  generateAIQuestions,
  refineAIFeedback
} = require('../controllers/feedbackController');
const { auth, adminOnly } = require('../middleware/auth');
const { validateFeedback } = require('../validators/validation');

const router = express.Router();

// Employee routes
router.post('/', auth, validateFeedback, submitFeedback);
router.post('/ai-questions', auth, generateAIQuestions);
router.post('/ai-refine', auth, refineAIFeedback);
router.get('/my', auth, getMyFeedback);
router.get('/my-with-replies', auth, getFeedbackWithReplies);

// Admin routes
router.get('/', auth, adminOnly, getAllFeedback);
router.patch('/:id/status', auth, adminOnly, updateFeedbackStatus);
router.delete('/:id', auth, adminOnly, deleteFeedback);

module.exports = router;