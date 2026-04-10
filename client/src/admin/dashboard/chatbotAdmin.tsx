import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../lib/redux/api/axiosInstance';

interface ChatStats {
    allTime: { totalBookings: number; totalRevenue: number };
    period: { totalBookings: number; totalRevenue: number };
    selectedPeriod: { month: number; year: number };
}

const ChatbotAdmin: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'appearance'>('dashboard');
    
    // Appearance States
    const [primaryColor, setPrimaryColor] = useState<string>('#0050d4');
    const [botName, setBotName] = useState<string>('AI Assistant');
    const [welcomeMessage, setWelcomeMessage] = useState<string>('');

    // Filter States
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // Stats State
    const [stats, setStats] = useState<ChatStats | null>(null);
    const [loadingStats, setLoadingStats] = useState<boolean>(false);

    useEffect(() => {
        fetchConfig();
        fetchStats();
    }, []);

    // Fetch stats when filters change
    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchStats();
        }
    }, [selectedMonth, selectedYear]);

    const fetchConfig = async () => {
        try {
            const res = await axiosInstance.get('/api/chat/config');
            if (res.data) {
                setPrimaryColor(res.data.primaryColor);
                setBotName(res.data.botName);
                setWelcomeMessage(res.data.welcomeMessage);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await axiosInstance.get(`/api/chat/stats?month=${selectedMonth}&year=${selectedYear}`);
            setStats(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleSaveConfig = async () => {
        try {
            await axiosInstance.put('/api/chat/config', {
                primaryColor, botName, welcomeMessage
            });
            toast.success("Đã cập nhật cấu hình chatbot!");
        } catch (error) {
            toast.error("Lỗi khi lưu cấu hình");
        }
    };

    const handleExport = () => {
        if (!stats) return;

        const csvContent = [
            ["BAO CAO HIEU QUA CHATBOT AI"],
            [`Thoi gian: Thang ${selectedMonth}/${selectedYear}`],
            [""],
            ["Chi so", "Gia tri"],
            ["Tong don hang (Thang)", stats.period.totalBookings],
            ["Tong doanh thu (Thang)", `${stats.period.totalRevenue} VND`],
            ["Tong don hang (Tat ca)", stats.allTime.totalBookings],
            ["Tong doanh thu (Tat ca)", `${stats.allTime.totalRevenue} VND`],
            [""],
            [`Ngay xuat bao cao: ${new Date().toLocaleString('vi-VN')}`]
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Bao_cao_Chatbot_${selectedMonth}_${selectedYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.info("Đã tải xuống báo cáo!");
    };

    return (
        <div className="p-6 bg-[#f5f7f9] dark:bg-slate-900 min-h-screen font-['Manrope',sans-serif]">
            <div className="w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-[#2c2f31] dark:text-slate-100">Quản trị Chatbot AI</h2>
                        <p className="text-[#595c5e] dark:text-slate-400 mt-1">Quản lý giao diện và theo dõi hiệu suất của trợ lý ảo.</p>
                    </div>
                    {activeTab === 'dashboard' && (
                        <button 
                            onClick={handleExport}
                            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <span className="material-symbols-outlined">download</span>
                            Xuất báo cáo (CSV)
                        </button>
                    )}
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 w-fit mb-8 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">analytics</span>
                        Thống kê
                    </button>
                    <button 
                        onClick={() => setActiveTab('appearance')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'appearance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">palette</span>
                        Giao diện
                    </button>
                </div>

                {activeTab === 'dashboard' && (
                    <div className="animate-in fade-in duration-500">
                        {/* Filters */}
                        <div className="flex items-center gap-4 mb-8 bg-white dark:bg-slate-800 p-4 rounded-[24px] border border-slate-100 dark:border-slate-700 w-fit shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400">calendar_month</span>
                                <select 
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="bg-transparent font-black text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                            <select 
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-transparent font-black text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                            >
                                {[2023, 2024, 2025, 2026].map(y => (
                                    <option key={y} value={y}>Năm {y}</option>
                                ))}
                            </select>
                            {loadingStats && <span className="material-symbols-outlined animate-spin text-blue-500">sync</span>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 flex flex-col gap-3 shadow-sm border-l-8 border-l-blue-500">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn hàng (Tháng này)</span>
                                <p className="text-4xl font-extrabold text-slate-800 dark:text-white">{stats?.period?.totalBookings || 0}</p>
                                <p className="text-xs text-slate-500 font-bold">Tháng {selectedMonth}/{selectedYear}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 flex flex-col gap-3 shadow-sm border-l-8 border-l-emerald-500">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doanh thu (Tháng này)</span>
                                <p className="text-2xl font-extrabold text-emerald-600">{new Intl.NumberFormat('vi-VN').format(stats?.period?.totalRevenue || 0)}đ</p>
                                <p className="text-xs text-slate-500 font-bold">Hiệu suất tháng được chọn</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 flex flex-col gap-3 shadow-sm border-l-8 border-l-amber-500">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn hàng (Tất cả)</span>
                                <p className="text-4xl font-extrabold text-slate-800 dark:text-white">{stats?.allTime?.totalBookings || 0}</p>
                                <p className="text-xs text-slate-500 font-bold">Từ lúc bắt đầu sử dụng AI</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 flex flex-col gap-3 shadow-sm border-l-8 border-l-purple-500">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doanh thu (Tất cả)</span>
                                <p className="text-2xl font-extrabold text-purple-600">{new Intl.NumberFormat('vi-VN').format(stats?.allTime?.totalRevenue || 0)}đ</p>
                                <p className="text-xs text-slate-500 font-bold">Tổng doanh thu tích lũy</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <span className="material-symbols-outlined text-8xl">smart_toy</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4">Sức mạnh của AI Chatbot</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                                Hệ thống đang lọc dữ liệu cho **Tháng {selectedMonth} Năm {selectedYear}**. 
                                Bạn có thể xuất báo cáo này ra tệp Excel/CSV để phục vụ cho các buổi họp quản trị định kỳ.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'appearance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right-8 duration-500">
                        {/* Settings Form */}
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-8">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-500">palette</span>
                                    Tùy chọn màu sắc
                                </h3>
                                <div className="space-y-4">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Màu chủ đạo</label>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <input 
                                            type="color" 
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="w-16 h-16 rounded-xl cursor-pointer border-none bg-transparent"
                                        />
                                        <input 
                                            type="text" 
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="w-full bg-transparent border-none text-xl font-black font-mono focus:outline-none dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-500">edit_square</span>
                                    Nội dung
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tên của Bot</label>
                                        <input 
                                            type="text" 
                                            value={botName}
                                            onChange={(e) => setBotName(e.target.value)}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Lời chào mừng</label>
                                        <textarea 
                                            rows={4}
                                            value={welcomeMessage}
                                            onChange={(e) => setWelcomeMessage(e.target.value)}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-medium dark:text-slate-300 focus:outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={handleSaveConfig}
                                className="w-full py-4 text-white font-black rounded-2xl shadow-xl hover:brightness-90 hover:scale-[1.01] transition-all"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Lưu cấu hình hệ thống
                            </button>
                        </div>

                        {/* Live Preview */}
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-200/20 dark:bg-slate-800/20 rounded-[48px] border-4 border-dashed border-slate-200 dark:border-slate-800 min-h-[600px]">
                            {/* Cửa sổ chat mẫu */}
                            <div className="w-[380px] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-100">
                                <div className="p-6 text-white" style={{ backgroundColor: primaryColor }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                            <span className="material-symbols-outlined text-2xl">robot_2</span>
                                        </div>
                                        <h3 className="font-black text-lg">{botName}</h3>
                                    </div>
                                </div>
                                <div className="h-[250px] p-6 bg-slate-50/50 space-y-4 overflow-hidden">
                                    <div className="max-w-[85%] p-4 bg-white rounded-3xl text-sm rounded-tl-none border border-slate-100 whitespace-pre-wrap">
                                        {welcomeMessage || 'Bản xem trước lời chào...'}
                                    </div>
                                    <div className="max-w-[80%] p-4 text-white text-sm rounded-3xl rounded-tr-none ml-auto" style={{ backgroundColor: primaryColor }}>
                                        Tôi muốn hỏi chính sách nhận phòng.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatbotAdmin;
