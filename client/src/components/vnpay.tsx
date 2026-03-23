import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { UserData, ApiResponse } from '../types';

const presetAmounts: number[] = [50000, 100000, 200000, 500000, 1000000, 2000000];

const VNPayTopup: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const navigate = useNavigate();
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);


    const [history, setHistory] = useState<any[]>([]);

    const userData: UserData = JSON.parse(localStorage.getItem('userData') || '{}');

    const fetchHistory = React.useCallback(async () => {
        if (!userData?.id) return;
        try {
            const response = await axios.get(`${backendUrl}/api/vnpay/history/${userData.id}`);
            if (response.data.success) {
                setHistory(response.data.history);
            }
        } catch (error) {
            console.error("Lỗi lấy lịch sử nạp:", error);
        }
    }, [userData?.id]);

    React.useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (!userData?.id) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Bạn chưa đăng nhập</h2>
                    <p className="text-gray-500 mb-6">Vui lòng đăng nhập để nạp tiền vào tài khoản</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition"
                    >
                        Đến trang đăng nhập
                    </button>
                </div>
            </div>
        );
    }

    const formatCurrency = (val: number): string => {
        return new Intl.NumberFormat('vi-VN').format(val);
    };
    // tinh cap genius theo ls napj tien
    const calculateGeniusLevel = (total: number): number => {
        if (!total || total < 100000) return 0;
        if (total < 500000) return 1;
        const level = Math.floor(total / 500000) + 1;
        return Math.min(level, 10);
    };

    const handleTopup = async (): Promise<void> => {
        const numAmount = parseInt(amount);
        if (!numAmount || numAmount < 10000) {
            toast.warning("Vui lòng nhập số tiền tối thiểu 10,000 VNĐ");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/vnpay/create-payment`, {
                amount: numAmount,
                userId: userData.id
            });

            if (response.data.success && response.data.paymentUrl) {
                window.location.href = response.data.paymentUrl;
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Lỗi khi tạo giao dịch");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteHistory = async (id: string): Promise<void> => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa lịch sử giao dịch này?")) return;
        try {
            const res = await axios.delete(`${backendUrl}/api/vnpay/history/${id}`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchHistory();
            } else {
                toast.error(res.data.message);
            }
        } catch (err) {
            toast.error("Lỗi khi xóa lịch sử");
        }
        setActiveMenu(null);
    };


    return (
        <div className="min-h-screen bg-[#f5f5f5] font-sans antialiased py-16 px-4">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Header Information (Always on top for mobile, left side for desktop eventually) */}
                <div className="lg:col-span-5 text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#003580]/5 rounded-3xl mb-6 shadow-sm">
                        <span className="material-symbols-outlined text-[#003580] text-4xl font-black">account_balance_wallet</span>
                    </div>
                    <h1 className="text-4xl font-[900] text-[#003580] tracking-tight mb-3">Ví tiền QuickStay</h1>
                    <p className="text-gray-500 font-medium text-lg">Nạp tiền an toàn và theo dõi hạng thành viên Genius</p>
                </div>

                {/* Left Side: Payment Form */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 border border-gray-100 overflow-hidden">
                        {/* User Summary Header */}
                        <div className="bg-[#003580] p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border border-white/20 shadow-xl backdrop-blur-md">
                                    {userData.avatar ? (
                                        <img src={userData.avatar} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-black uppercase">{userData.full_name?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-black tracking-tight">{userData.full_name}</h2>
                                        <div className="bg-bookingYellow text-bookingText px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                            Genius Level {calculateGeniusLevel(userData.totalRecharged || 0)}
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-white/70">{userData.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Stats Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Số dư hiện tại</p>
                                    <p className="text-xl font-black text-[#003580]">{formatCurrency(userData.balance || 0)}₫</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng tích lũy (Genius)</p>
                                    <p className="text-xl font-black text-[#006ce4]">{formatCurrency(userData.totalRecharged || 0)}₫</p>
                                </div>
                            </div>

                            {/* Quick Selection */}
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Chọn nhanh mệnh giá</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {presetAmounts.map((preset) => (
                                        <button
                                            key={preset}
                                            onClick={() => setAmount(preset.toString())}
                                            className={`py-4 px-2 rounded-xl text-xs font-black border-2 transition-all duration-300
                                                ${parseInt(amount) === preset
                                                    ? 'border-[#006ce4] bg-blue-50 text-[#006ce4]'
                                                    : 'border-gray-50 bg-gray-50 text-gray-500 hover:border-blue-200 hover:bg-white hover:text-[#006ce4]'
                                                }`}
                                        >
                                            {formatCurrency(preset)}₫
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Input */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Hoặc nhập số tiền khác</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="10000"
                                        value={amount}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                                        placeholder="Tối thiểu 10,000"
                                        className="w-full pl-6 pr-16 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-2xl font-black text-[#003580] outline-none transition-all"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-gray-300">VNĐ</span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleTopup}
                                disabled={loading || !amount || parseInt(amount) < 10000}
                                className="w-full py-5 bg-[#006ce4] text-white font-black text-lg rounded-2xl hover:bg-[#0057b8] transition-all shadow-xl shadow-blue-500/10 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        <span>Xác nhận Nạp tiền</span>
                                        <span className="material-symbols-outlined font-black">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Recharge History */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 border border-gray-100 p-8 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#006ce4] font-black">history</span>
                                <h3 className="text-xl font-black text-[#003580] tracking-tight">Lịch sử ví</h3>
                            </div>
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase text-gray-500">{history.length} GD</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar max-h-[600px]">
                            {history.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-gray-300 text-3xl">receipt_long</span>
                                    </div>
                                    <p className="text-gray-400 font-bold text-sm">Chưa có giao dịch nào</p>
                                </div>
                            ) : (
                                history.map((item, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        {item.amount > 0 ? 'add_card' : 'shopping_bag'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-black ${item.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}₫
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                        {item.txnRef.startsWith('BOOKING_') ? 'Thanh toán phòng' : item.txnRef}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 pr-6">
                                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${item.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                                    item.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-rose-50 text-rose-600'
                                                    }`}>
                                                    {item.status === 'success' ? 'Thành công' :
                                                        item.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                                                </span>
                                                {item.status === 'pending' && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const res = await axios.get(`${backendUrl}/api/vnpay/continue-payment/${item._id || item.id}`);
                                                                if (res.data.success && res.data.paymentUrl) {
                                                                    window.location.href = res.data.paymentUrl;
                                                                } else {
                                                                    toast.error(res.data.message);
                                                                }
                                                            } catch (err) {
                                                                toast.error("Lỗi khi tiếp tục thanh toán");
                                                            }
                                                        }}
                                                        className="text-[10px] font-black text-[#006ce4] hover:underline flex items-center gap-1"
                                                    >
                                                        Tiếp tục
                                                        <span className="material-symbols-outlined text-[12px]">payments</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Three dots menu icon */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === item._id ? null : item._id);
                                                }}
                                                className="absolute top-4 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeMenu === item._id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setActiveMenu(null)}
                                                    ></div>
                                                    <div className="absolute top-10 right-2 z-20 bg-white shadow-xl rounded-xl border border-gray-100 py-2 w-32 animate-in fade-in zoom-in duration-200">
                                                        <button
                                                            onClick={() => handleDeleteHistory(item._id)}
                                                            className="w-full text-left px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-gray-400">
                                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                            {new Date(item.createdAt).toLocaleDateString('vi-VN')} {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>


                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VNPayTopup;
