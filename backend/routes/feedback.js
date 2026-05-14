const express = require('express');
const {
  submitFeedback,
  getMyFeedback,
  getFeedbackWithReplies,
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback
} = require('../controllers/feedbackController');
const { auth, adminOnly } = require('../middleware/auth');
const { validateFeedback } = require('../validators/validation');

const router = express.Router();

// Employee routes
router.post('/', auth, validateFeedback, submitFeedback);
router.get('/my', auth, getMyFeedback);
router.get('/my-with-replies', auth, getFeedbackWithReplies);

// Admin routes
router.get('/', auth, adminOnly, getAllFeedback);
router.patch('/:id/status', auth, adminOnly, updateFeedbackStatus);
router.delete('/:id', auth, adminOnly, deleteFeedback);

module.exports = router;