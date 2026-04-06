import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import { selectAuthUser, getProfileThunk } from '../../lib/redux/reducers/auth';
import { verifyVNPayReturnThunk } from '../../lib/redux/reducers/vnpay';

const VNPayReturn: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const userData = useAppSelector(selectAuthUser);

    const [result, setResult] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const verifyPayment = async (): Promise<void> => {
            try {
                const params = Object.fromEntries(searchParams.entries());
                const res = await dispatch(verifyVNPayReturnThunk(params)).unwrap();

                setResult(res);

                // If success, update user profile to sync balance
                if (res.success && userData) {
                    const userId = userData.id || userData._id;
                    if (userId) {
                        dispatch(getProfileThunk(userId));
                    }
                }
            } catch (error: any) {
                console.error(error);
                setResult({ success: false, message: error || "Có lỗi khi xác thực giao dịch" });
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [searchParams, dispatch, userData]);

    const formatCurrency = (val: number): string => new Intl.NumberFormat('vi-VN').format(val);

    // ==================== LOADING STATE ====================
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-yellow-500 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-gray-600 text-lg">Đang xác thực giao dịch...</p>
                </div>
            </div>
        );
    }

    // ==================== BOOKING PAYMENT SUCCESS ====================
    if (result?.success && result?.type === 'booking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4ff] via-[#f5f7f8] to-[#e8f0fe] px-4 font-['Inter',_sans-serif]">
                <div className="max-w-md w-full overflow-hidden rounded-[32px] shadow-2xl shadow-blue-900/15 border border-white/60 animate-in fade-in zoom-in duration-500">
                    
                    {/* Header - Booking Success */}
                    <div className="relative bg-gradient-to-br from-[#003580] via-[#00408f] to-[#0052b4] p-10 text-white text-center overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mt-20 blur-2xl"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#febb02]/10 rounded-full -mr-16 -mb-16 blur-xl"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full"></div>
                        
                        {/* Success Icon with animation */}
                        <div className="relative z-10">
                            <div className="w-28 h-28 mx-auto mb-6 relative">
                                <div className="absolute inset-0 bg-[#febb02]/20 rounded-full animate-ping"></div>
                                <div className="relative w-full h-full bg-gradient-to-br from-[#febb02] to-[#f5a623] rounded-full flex items-center justify-center shadow-lg shadow-[#febb02]/30">
                                    <span className="material-symbols-outlined text-[#003580] text-5xl font-black">hotel</span>
                                </div>
                            </div>
                            <h2 className="text-3xl font-[900] mb-2 tracking-tight">Thanh toán thành công!</h2>
                            <p className="text-blue-200/80 font-medium text-sm">Đơn đặt phòng của bạn đã được ghi nhận</p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="bg-white p-8 space-y-6">
                        
                        {/* Booking Status Card */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/50 rounded-full -mr-10 -mt-10"></div>
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="w-12 h-12 bg-[#003580] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200">
                                    <span className="material-symbols-outlined text-white text-xl">pending_actions</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] mb-1">Trạng thái đơn hàng</p>
                                    <p className="text-lg font-[900] text-[#003580]">Chờ xác nhận & gán phòng</p>
                                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                                        Nhân viên khách sạn sẽ xác nhận và gán số phòng cụ thể cho bạn trong thời gian sớm nhất.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="border-2 border-dashed border-emerald-200 rounded-2xl p-5 bg-emerald-50/30">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                                </div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Đã thanh toán qua VNPay</p>
                            </div>
                            {result.amount && (
                                <p className="text-3xl font-[900] text-emerald-600 pl-11">
                                    {formatCurrency(result.amount)}₫
                                </p>
                            )}
                        </div>

                        {/* Timeline Steps */}
                        <div className="bg-slate-50 rounded-2xl p-5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Quy trình tiếp theo</p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="material-symbols-outlined text-white text-xs">check</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Thanh toán thành công</p>
                                        <p className="text-[10px] text-slate-400">Vừa hoàn tất</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-[#febb02] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
                                        <span className="material-symbols-outlined text-[#003580] text-xs">more_horiz</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Nhân viên xác nhận & gán phòng</p>
                                        <p className="text-[10px] text-slate-400">Đang chờ xử lý</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="material-symbols-outlined text-slate-400 text-xs">email</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400">Nhận email xác nhận kèm số phòng</p>
                                        <p className="text-[10px] text-slate-300">Sắp tới</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => navigate('/my-bookings')}
                                className="w-full py-4 bg-[#003580] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-[#002a6b] transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                <span className="material-symbols-outlined text-lg">receipt_long</span>
                                Xem đơn đặt phòng
                            </button>
                            <button
                                onClick={() => { navigate('/'); window.location.reload(); }}
                                className="w-full py-4 bg-slate-50 text-slate-600 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">home</span>
                                Về trang chủ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== DEPOSIT (WALLET TOP-UP) SUCCESS ====================
    if (result?.success && result?.type === 'deposit') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4 font-sans">
                <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 overflow-hidden border border-gray-50 transform animate-in fade-in zoom-in duration-500">
                    {/* Success State */}
                    <div className="bg-[#008009] p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                        <div className="w-24 h-24 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-6 backdrop-blur-md border border-white/30">
                            <span className="material-symbols-outlined text-white text-5xl font-black">check_circle</span>
                        </div>
                        <h2 className="text-3xl font-[900] mb-2 tracking-tight">Thành công!</h2>
                        <p className="text-green-50/80 font-medium italic">Giao dịch đã được xử lý hoàn tất</p>
                    </div>

                    <div className="p-10 text-center space-y-8">
                        <div className="bg-[#008009]/[0.02] border-2 border-dashed border-[#008009]/20 rounded-3xl p-8">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Số tiền đã nạp vào ví</p>
                            <p className="text-4xl font-black text-[#008009]">
                                +{result.amount ? formatCurrency(result.amount) : '0'}₫
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => { navigate('/'); window.location.reload(); }}
                                className="w-full py-4 bg-[#003580] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-[#002a6b] transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">home</span>
                                Về trang chủ
                            </button>
                            <button
                                onClick={() => navigate('/topup')}
                                className="w-full py-4 bg-gray-50 text-[#003580] font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all border border-gray-100 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">add_card</span>
                                Nạp thêm tiền
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== GENERIC SUCCESS (fallback) ====================
    if (result?.success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4 font-sans">
                <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 overflow-hidden border border-gray-50 transform animate-in fade-in zoom-in duration-500">
                    <div className="bg-[#008009] p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                        <div className="w-24 h-24 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-6 backdrop-blur-md border border-white/30">
                            <span className="material-symbols-outlined text-white text-5xl font-black">check_circle</span>
                        </div>
                        <h2 className="text-3xl font-[900] mb-2 tracking-tight">Thành công!</h2>
                        <p className="text-green-50/80 font-medium italic">{result.message || "Giao dịch đã hoàn tất"}</p>
                    </div>

                    <div className="p-10 text-center space-y-8">
                        <div className="space-y-3">
                            <button
                                onClick={() => { navigate('/'); window.location.reload(); }}
                                className="w-full py-4 bg-[#003580] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-[#002a6b] transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">home</span>
                                Về trang chủ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== FAILED STATE ====================
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 overflow-hidden border border-gray-50 transform animate-in fade-in zoom-in duration-500">
                <div className="bg-[#d4111e] p-10 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                    <div className="w-24 h-24 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-6 backdrop-blur-md border border-white/30">
                        <span className="material-symbols-outlined text-white text-5xl font-black">error</span>
                    </div>
                    <h2 className="text-3xl font-[900] mb-2 tracking-tight">Thanh toán lỗi</h2>
                    <p className="text-red-50/80 font-medium">{result?.message || "Giao dịch không thể hoàn tất"}</p>
                </div>

                <div className="p-10 text-center space-y-8">
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">
                        Đừng lo lắng! Nếu tiền đã bị trừ khỏi tài khoản, vui lòng liên hệ bộ phận hỗ trợ để được xử lý thủ công.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/topup')}
                            className="w-full py-4 bg-[#d4111e] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-[#b00e19] transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">refresh</span>
                            Thử lại ngay
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-gray-50 text-gray-500 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all border border-gray-100 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">support_agent</span>
                            Liên hệ hỗ trợ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VNPayReturn;
