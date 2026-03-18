import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ApiResponse, UserData } from '../types';

const VNPayReturn: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [result, setResult] = useState<ApiResponse<any> | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        
        const verifyPayment = async (): Promise<void> => {
            try {
                const params = Object.fromEntries(searchParams.entries());
                const response = await axios.get<ApiResponse<any>>(`${backendUrl}/api/vnpay/vnpay-return`, { params });

                setResult(response.data);

                // If success, update locally stored balance
                if (response.data.success) {
                    const userData: UserData = JSON.parse(localStorage.getItem('userData') || '{}');
                    if (userData.id) {
                        // Fetch latest user data
                        const userRes = await axios.get<ApiResponse<UserData>>(`${backendUrl}/api/user/profile/${userData.id}`);
                        if (userRes.data.success && userRes.data.user) {
                            const dbUser = userRes.data.user;
                            const updatedUser: UserData = { 
                                ...userData, 
                                balance: dbUser.balance 
                            };
                            localStorage.setItem('userData', JSON.stringify(updatedUser));
                        }
                    }
                }
            } catch (error) {
                console.error(error);
                setResult({ success: false, message: "Có lỗi khi xác thực giao dịch" });
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [searchParams]);

    const formatCurrency = (val: number): string => new Intl.NumberFormat('vi-VN').format(val);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-yellow-500 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <p className="text-gray-600 text-lg">Đang xác thực giao dịch...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 overflow-hidden border border-gray-50 transform animate-in fade-in zoom-in duration-500">
                {result?.success ? (
                    <>
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
                    </>
                ) : (
                    <>
                        {/* Failed State */}
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
                    </>
                )}
            </div>
        </div>
    );
};

export default VNPayReturn;
