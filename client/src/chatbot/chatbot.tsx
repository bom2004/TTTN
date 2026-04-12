import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../lib/redux/api/axiosInstance';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Load Settings from Backend (Database)
    const [config, setConfig] = useState({
        primaryColor: '#0050d4',
        botName: 'AI Assistant',
        welcomeMessage: 'Xin chào! Tôi là trợ lý ảo của khách sạn. Tôi có thể giúp gì cho bạn?'
    });

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [roomTypes, setRoomTypes] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Fetch
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axiosInstance.get('/api/chat/config');
                if (res.data) {
                    setConfig({
                        primaryColor: res.data.primaryColor || '#0050d4',
                        botName: res.data.botName || 'AI Assistant',
                        welcomeMessage: res.data.welcomeMessage || 'Xin chào!...'
                    });
                    
                    // Khởi tạo tin nhắn chào mừng từ backend
                    setMessages([
                        {
                            id: 'welcome',
                            text: res.data.welcomeMessage || 'Xin chào! Tôi là trợ lý ảo...',
                            sender: 'ai',
                            timestamp: new Date()
                        }
                    ]);
                }
            } catch (err) {
                console.error("Lỗi lấy cấu hình chat:", err);
                // Fallback welcome message
                setMessages([{ id: '1', text: config.welcomeMessage, sender: 'ai', timestamp: new Date() }]);
            }
        };

        const fetchRoomTypes = async () => {
            try {
                const res = await axiosInstance.get('/api/room-types');
                if (res.data && Array.isArray(res.data.data)) {
                    setRoomTypes(res.data.data);
                } else if (Array.isArray(res.data)) {
                    setRoomTypes(res.data);
                }
            } catch (err) {
                console.error("Lỗi lấy loại phòng:", err);
            }
        };

        fetchConfig();
        fetchRoomTypes();
    }, []);

    const PRIMARY_COLOR = config.primaryColor;
    const BOT_NAME = config.botName;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    const handleSend = async (customText?: string) => {
        const textToSend = customText || inputValue;
        if (!textToSend.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: textToSend,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!customText) setInputValue('');
        setIsTyping(true);

        try {
            const response = await axiosInstance.post('/api/chat/ask', { prompt: textToSend });

            const aiMsg: Message = {
                id: Date.now().toString(),
                text: response.data.message || 'Xin lỗi, tôi gặp chút trục trặc khi xử lý câu hỏi này.',
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            console.error("Chatbot error:", error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Hệ thống đang bận, vui lòng thử lại sau giây lát.';
            const errorMsg: Message = {
                id: Date.now().toString(),
                text: errorMessage,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-['Manrope',sans-serif]">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 transform ${isOpen ? 'rotate-90 bg-slate-800 scale-90' : 'hover:scale-110 active:scale-95'
                    }`}
                style={{ backgroundColor: isOpen ? undefined : PRIMARY_COLOR }}
            >
                <span className="material-symbols-outlined text-white text-3xl">
                    {isOpen ? 'close' : 'smart_toy'}
                </span>
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                    </span>
                )}
            </button>

            {/* Chat Window */}
            <div
                className={`absolute bottom-20 right-0 w-[380px] sm:w-[420px] bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-500 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
                    }`}
            >
                {/* Header */}
                <div className="p-6 text-white relative overflow-hidden" style={{ backgroundColor: PRIMARY_COLOR }}>

                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <span className="material-symbols-outlined text-2xl">robot_2</span>
                            </div>
                            <div>
                                <h3 className="font-black text-lg tracking-tight">{BOT_NAME}</h3>

                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-[10px] uppercase font-black tracking-widest opacity-80">Trực tuyến</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="h-[450px] overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar relative">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div
                                    className={`max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                        ? 'text-white rounded-tr-none'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none font-medium'
                                        }`}
                                    style={{ backgroundColor: msg.sender === 'user' ? PRIMARY_COLOR : undefined }}
                                >
                                    {msg.text.split('\n').map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line.includes('](') ? (
                                                line.split(/(\[.*?\]\(.*?\))/g).map((part, j) => {
                                                    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                                                    if (linkMatch) {
                                                        return (
                                                            <a
                                                                key={j}
                                                                href={linkMatch[2]}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg mt-2 mb-1 hover:brightness-90 transition-all no-underline font-bold animate-pulse"
                                                                style={{ backgroundColor: PRIMARY_COLOR }}
                                                            >
                                                                <span className="material-symbols-outlined text-sm">payments</span>
                                                                {linkMatch[1]}
                                                            </a>

                                                        );
                                                    }
                                                    return part;
                                                })
                                            ) : (
                                                line
                                            )}
                                            <br />
                                        </React.Fragment>
                                    ))}
                                    <div className={`text-[9px] mt-1.5 opacity-50 font-black uppercase ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                        {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl rounded-tl-none shadow-sm flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all focus-within:ring-4" style={{ borderColor: `${PRIMARY_COLOR}33` }}>
                        <input
                            type="text"
                            placeholder="Hãy nhập câu hỏi..."
                            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none dark:text-slate-200 placeholder-slate-400 font-medium"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!inputValue.trim()}
                            className="w-10 h-10 rounded-xl text-white flex items-center justify-center transition-all hover:brightness-90 disabled:opacity-30 disabled:grayscale"
                            style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                            <span className="material-symbols-outlined text-xl">send</span>
                        </button>
                    </div>
                    <p className="text-[9px] text-center text-slate-400 mt-3 font-bold uppercase tracking-widest opacity-60">
                        Hệ thống đặt phòng AI thông minh 4.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
