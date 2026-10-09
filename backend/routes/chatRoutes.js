const express = require('express');
const router = express.Router({ mergeParams: true }); // needed so :projectId from the mount path is visible here
const {
  getGroupMessages,
  sendGroupMessage,
  getConversations,
  getDirectMessages,
  sendDirectMessage,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect); // membership itself is checked per-route inside the controller (loadAccessibleProject)

router.route('/group').get(getGroupMessages).post(sendGroupMessage);
router.get('/conversations', getConversations);
router.route('/direct/:otherUserId').get(getDirectMessages).post(sendDirectMessage);

module.exports = router;
