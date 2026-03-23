import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { IPromotion, ApiResponse, UserData } from '../types';

const PromotionHistory: React.FC = () => {
    const [history, setHistory] = useState<IPromotion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [token] = useState<string | null>(localStorage.getItem("token"));
    const backendUrl = "http://localhost:3000";
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            const storedUser = localStorage.getItem('userData');
            if (token && storedUser) {
                try {
                    const parsed = JSON.parse(storedUser) as UserData;
                    const userId = parsed.id || parsed._id;
                    const res = await axios.get<ApiResponse<IPromotion[]>>(`${backendUrl}/api/promotions/user-history/${userId}`);
                    if (res.data.success && res.data.data) {
                        setHistory(res.data.data);
                    }
                } catch (error) {
                    console.error("Lỗi khi tải lịch sử khuyến mãi:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                navigate('/login');
            }
        };

        fetchHistory();
    }, [token, navigate]);

    return (
        <div className="bg-[#f8f6f6] min-h-screen py-12 px-4 md:px-10 lg:px-40">
            <div className="max-w-[1200px] mx-auto">
                {/* Header section */}
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <nav aria-label="Breadcrumb" className="flex text-sm mb-4 opacity-60">
                            <ol className="flex list-none p-0">
                                <li className="flex items-center">
                                    <span className="hover:underline cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
                                    <span className="material-symbols-outlined text-sm mx-2">chevron_right</span>
                                </li>
                                <li className="flex items-center">
                                    <span className="hover:underline cursor-pointer" onClick={() => navigate('/promotions')}>Ưu đãi</span>
                                    <span className="material-symbols-outlined text-sm mx-2">chevron_right</span>
                                </li>
                                <li className="font-bold text-[#003580]">Lịch sử</li>
                            </ol>
                        </nav>
                        <h1 className="text-3xl md:text-4xl font-black text-[#003580] tracking-tight">Mã đã sử dụng</h1>
                        <p className="text-gray-500 font-medium mt-2">Xem lại các ưu đãi bạn đã áp dụng cho những chuyến đi trước.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/promotions')}
                        className="text-sm font-black text-[#006ce4] hover:text-[#0052ad] flex items-center gap-2 group/back"
                    >
                        <span className="material-symbols-outlined transition-transform group-hover/back:-translate-x-1">arrow_back</span>
                        Quay lại trang ưu đãi
                    </button>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-lg shadow-gray-200/50 border border-gray-100">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-gray-300 text-5xl">inventory_2</span>
                        </div>
                        <h3 className="text-xl font-[900] text-gray-900 mb-2">Chưa có lịch sử sử dụng mã</h3>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Bạn chưa sử dụng mã khuyến mãi nào. Hãy bắt đầu hành trình và tận hưởng ưu đãi cùng QuickStay!</p>
                        <button 
                            onClick={() => navigate('/promotions')}
                            className="bg-[#003580] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#002a6b] transition shadow-xl shadow-blue-500/10"
                        >
                            Xem mã đang có
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {history.map((promo) => (
                            <div key={promo._id} className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-gray-200/50 border border-gray-100 group">
                                <div className="relative h-40 bg-gray-100">
                                    {promo.image ? (
                                        <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-200">
                                            <span className="material-symbols-outlined text-5xl">confirmation_number</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest text-[#003580]">
                                            Đã áp dụng
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                            SUCCESS
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-black text-[10px] rounded border border-amber-200 uppercase tracking-widest">
                                            {promo.code}
                                        </span>
                                        <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded uppercase">- {promo.discountPercent}%</span>
                                    </div>
                                    <h3 className="font-black text-gray-900 leading-tight mb-2 group-hover:text-[#003580] transition-colors line-clamp-1">{promo.title}</h3>
                                    
                                    <div className="space-y-3 pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                            <span className="material-symbols-outlined text-sm">event</span>
                                            Dùng vào: {new Date(promo.updatedAt).toLocaleDateString('vi-VN')}
                                        </div>
                                        {promo.minOrderValue > 0 && (
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                                <span className="material-symbols-outlined text-sm">payments</span>
                                                Dành cho đơn {new Intl.NumberFormat('vi-VN').format(promo.minOrderValue)}đ
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromotionHistory;
