import mongoose from 'mongoose';

const chatConfigSchema = new mongoose.Schema({
    botName: {
        type: String,
        default: 'AI Assistant'
    },
    primaryColor: {
        type: String,
        default: '#0050d4'
    },
    welcomeMessage: {
        type: String,
        default: 'Xin chào! Tôi là trợ lý ảo của khách sạn. Tôi có thể giúp gì cho bạn? Bạn có thể chat với tôi hoặc nhấn nút 📅 phía dưới để đặt phòng nhanh.'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Tránh lỗi overwrite model khi hot reload
const ChatConfig = mongoose.models.ChatConfig || mongoose.model('ChatConfig', chatConfigSchema);

export default ChatConfig;
