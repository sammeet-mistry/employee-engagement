const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const {
  createChatSession,
  getUserChatSessions,
  getAllChatSessions,
  getChatSession,
  addChatMessage,
  addAdminMessage,
  sendChatToHR,
  escalateChatSession
} = require('../controllers/chatController');

console.log('Chat routes loaded');

router.use(auth);
router.get('/sessions/my', getUserChatSessions);
router.get('/sessions/all', adminOnly, getAllChatSessions);
router.get('/session/:sessionId', getChatSession);
router.post('/session', createChatSession);
router.post('/session/:sessionId/message', addChatMessage);
router.post('/session/:sessionId/admin-message', adminOnly, addAdminMessage);
router.post('/session/:sessionId/send-to-hr', sendChatToHR);
router.post('/session/:sessionId/escalate', escalateChatSession);

module.exports = router;
