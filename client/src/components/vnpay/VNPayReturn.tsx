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

                // If success, update user profile to sync spent amount and level
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-gray-600 text-lg">Đang xác thực giao dịch...</p>
                </div>
            </div>
        );
    }

    if (result?.success && result?.type === 'booking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4ff] via-[#f5f7f8] to-[#e8f0fe] px-4 font-['Inter',_sans-serif]">
                <div className="max-w-md w-full overflow-hidden rounded-[32px] shadow-2xl shadow-blue-900/15 border border-white/60 animate-in fade-in zoom-in duration-500">
                    <div className="relative bg-gradient-to-br from-[#003580] via-[#00408f] to-[#0052b4] p-10 text-white text-center overflow-hidden">
                        <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mt-20 blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="w-28 h-28 mx-auto mb-6 relative">
                                <div className="absolute inset-0 bg-[#febb02]/20 rounded-full animate-ping"></div>
                                <div className="relative w-full h-full bg-[#febb02] rounded-full flex items-center justify-center shadow-lg shadow-[#febb02]/30">
                                    <span className="material-symbols-outlined text-[#003580] text-5xl font-black">check_circle</span>
                                </div>
                            </div>
                            <h2 className="text-3xl font-[900] mb-2 tracking-tight">Thanh toán hoàn tất!</h2>
                            <p className="text-blue-200/80 font-medium text-sm">Cảm ơn bạn đã lựa chọn QuickStay</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 space-y-6">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Số tiền thanh toán cọc</p>
                            <p className="text-3xl font-black text-emerald-600">
                                {result.amount ? formatCurrency(result.amount) : '0'}₫
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => navigate('/my-bookings')}
                                className="w-full py-4 bg-[#003580] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-[#002a6b] transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">receipt_long</span>
                                Kiểm tra đơn đặt phòng
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-4 bg-gray-50 text-slate-600 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all border border-gray-200 flex items-center justify-center gap-2"
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4 font-sans text-center">
            <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-50 animate-in fade-in zoom-in duration-500">
                <div className="bg-rose-600 p-10 text-white">
                    <div className="w-24 h-24 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-white text-5xl font-black">error</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">Thanh toán thất bại</h2>
                    <p className="text-rose-100">{result?.message || "Đã có lỗi xảy ra trong quá trình xử lý"}</p>
                </div>
                <div className="p-10 space-y-4">
                    <p className="text-sm text-gray-500 font-medium">Hệ thống không thể xác nhận giao dịch của bạn. Vui lòng kiểm tra lại đơn hàng hoặc liên hệ nhân viên khách sạn.</p>
                    <button
                        onClick={() => navigate('/my-bookings')}
                        className="w-full py-4 bg-[#003580] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-blue-900 transition-all shadow-lg"
                    >
                        Quay lại Đơn đặt phòng
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-gray-50 text-gray-600 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VNPayReturn;
