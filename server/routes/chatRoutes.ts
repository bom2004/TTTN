import express from 'express';
import { askAI } from '../controllers/chatController';
import {
    getChatConfig, updateChatConfig,
    getChatbotStats
} from '../controllers/chatConfigController';

const router = express.Router();

router.post('/ask', askAI);

// Config
router.get('/config', getChatConfig);
router.put('/config', updateChatConfig);

// Stats
router.get('/stats', getChatbotStats);

export default router;
