const express = require('express');
const { getConversations } = require('../controllers/conversationController');

const router = express.Router();

// Routes for conversations
router.get('/:userId', getConversations);

module.exports = router;
