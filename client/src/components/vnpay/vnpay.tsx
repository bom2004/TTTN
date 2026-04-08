import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import { selectAuthUser } from '../../lib/redux/reducers/auth';
import {
    fetchVNPayHistoryThunk,
} from '../../lib/redux/reducers/vnpay';

const MembershipBenefit: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const userData = useAppSelector(selectAuthUser);
    const { history, loading: historyLoading } = useAppSelector(state => state.vnpay);

    const fetchHistory = useCallback(async () => {
        const userId = userData?.id || userData?._id;
        if (!userId) return;
        dispatch(fetchVNPayHistoryThunk(userId));
    }, [userData, dispatch]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (!userData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Bạn chưa đăng nhập</h2>
                    <p className="text-gray-500 mb-6">Vui lòng đăng nhập để xem thông tin thành viên</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 bg-[#003580] text-white rounded-lg font-semibold hover:bg-blue-800 transition"
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

    const getMembershipDetails = (totalSpent: number) => {
        if (!totalSpent || totalSpent < 5000000) return { 
            label: 'Silver', 
            color: 'text-gray-600', 
            bg: 'bg-gray-100', 
            icon: 'stars',
            next: 5000000,
            percent: Math.min((totalSpent / 5000000) * 100, 100)
        };
        if (totalSpent < 20000000) return { 
            label: 'Gold', 
            color: 'text-yellow-700', 
            bg: 'bg-yellow-50', 
            icon: 'workspace_premium',
            next: 20000000,
            percent: Math.min((totalSpent / 20000000) * 100, 100)
        };
        if (totalSpent < 100000000) return { 
            label: 'Diamond', 
            color: 'text-blue-700', 
            bg: 'bg-blue-50', 
            icon: 'diamond',
            next: 100000000,
            percent: Math.min((totalSpent / 100000000) * 100, 100)
        };
        return { 
            label: 'Platinum', 
            color: 'text-purple-700', 
            bg: 'bg-purple-50', 
            icon: 'crown',
            next: null,
            percent: 100
        };
    };

    const details = getMembershipDetails(userData.totalSpent || 0);

    return (
        <div className="min-h-screen bg-[#f5f7f9] font-sans antialiased py-16 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Information */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#003580]/10 rounded-3xl mb-6 shadow-sm">
                        <span className="material-symbols-outlined text-[#003580] text-4xl font-black">loyalty</span>
                    </div>
                    <h1 className="text-4xl font-[900] text-[#003580] tracking-tight mb-3">Chương trình Khách hàng Thân thiết</h1>
                    <p className="text-gray-500 font-medium text-lg">Tích lũy chi tiêu để nhận ưu đãi đặc quyền từ QuickStay</p>
                </div>

                {/* Membership Card */}
                <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#003580] to-[#006ce4] p-10 text-white relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        
                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center overflow-hidden border border-white/40 shadow-2xl backdrop-blur-md">
                                {userData.avatar ? (
                                    <img src={userData.avatar} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-black uppercase">{userData.full_name?.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-3xl font-black tracking-tight mb-2">{userData.full_name}</h2>
                                <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                                    <div className={`${details.bg} ${details.color} px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2`}>
                                        <span className="material-symbols-outlined text-sm">{details.icon}</span>
                                        Hạng {details.label}
                                    </div>
                                    <p className="text-white/80 font-bold ml-2">Tổng chi tiêu: {formatCurrency(userData.totalSpent || 0)}₫</p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {details.next && (
                            <div className="mt-10 relative z-10">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-3 text-white/70">
                                    <span>Tiến trình lên hạng tiếp theo</span>
                                    <span>{Math.round(details.percent)}%</span>
                                </div>
                                <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/10">
                                    <div 
                                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-1000 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                                        style={{ width: `${details.percent}%` }}
                                    ></div>
                                </div>
                                <p className="mt-3 text-xs font-medium text-white/60 italic text-center">
                                    Chi tiêu thêm {formatCurrency(details.next - (userData.totalSpent || 0))}₫ để đạt hạng kế tiếp
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Benefits Grid */}
                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">local_offer</span>
                            </div>
                            <div>
                                <h4 className="font-black text-[#003580] mb-1">Giảm giá trực tiếp</h4>
                                <p className="text-sm text-gray-500 leading-relaxed font-medium">Nhận ưu đãi giảm giá lên tới 20% tùy theo hạng thành viên cho tất cả các phòng.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">priority_high</span>
                            </div>
                            <div>
                                <h4 className="font-black text-[#003580] mb-1">Ưu tiên check-in</h4>
                                <p className="text-sm text-gray-500 leading-relaxed font-medium">Được ưu tiên làm thủ tục nhận phòng và hỗ trợ tận tình từ đội ngũ nhân viên.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Table of Levels */}
                <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-8 overflow-hidden">
                    <h3 className="text-xl font-black text-[#003580] mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined">info</span>
                        Chi tiết các hạng mức
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#f5f7f9] text-[#003580] uppercase text-[10px] font-black tracking-widest">
                                <tr>
                                    <th className="px-6 py-4 rounded-l-2xl">Hạng thẻ</th>
                                    <th className="px-6 py-4">Điều kiện (Chi tiêu)</th>
                                    <th className="px-6 py-4 rounded-r-2xl">Đặc quyền tiêu biểu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-medium text-sm text-gray-600">
                                <tr className={userData.totalSpent < 5000000 ? "bg-blue-50/50" : ""}>
                                    <td className="px-6 py-5 font-black text-gray-400">Silver</td>
                                    <td className="px-6 py-5">Mặc định</td>
                                    <td className="px-6 py-5">Tích lũy chi tiêu để thăng hạng</td>
                                </tr>
                                <tr className={userData.totalSpent >= 5000000 && userData.totalSpent < 20000000 ? "bg-yellow-50/50" : ""}>
                                    <td className="px-6 py-5 font-black text-yellow-600">Gold</td>
                                    <td className="px-6 py-5">&ge; 5,000,000₫</td>
                                    <td className="px-6 py-5">Giảm 5% giá phòng, hỗ trợ hoàn trả nhanh</td>
                                </tr>
                                <tr className={userData.totalSpent >= 20000000 && userData.totalSpent < 100000000 ? "bg-blue-50/50" : ""}>
                                    <td className="px-6 py-5 font-black text-blue-600">Diamond</td>
                                    <td className="px-6 py-5">&ge; 20,000,000₫</td>
                                    <td className="px-6 py-5">Giảm 10% giá phòng, check-out muộn 2h</td>
                                </tr>
                                <tr className={userData.totalSpent >= 100000000 ? "bg-purple-50/50" : ""}>
                                    <td className="px-6 py-5 font-black text-purple-600">Platinum</td>
                                    <td className="px-6 py-5">&ge; 100,000,000₫</td>
                                    <td className="px-6 py-5">Giảm 15% giá phòng, miễn phí bữa sáng</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Note */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
                    <span className="material-symbols-outlined text-amber-500">campaign</span>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        Lưu ý: Tổng chi tiêu được tính dựa trên số tiền của các đơn đặt phòng đã hoàn thành (đã nhận phòng và thanh toán đầy đủ). Hệ thống sẽ tự động cập nhật hạng thành viên của bạn ngay sau khi đơn hàng chuyển sang trạng thái "Hoàn thành".
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MembershipBenefit;
