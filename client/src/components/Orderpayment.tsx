import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Room, UserData, ApiResponse } from '../types';

const Orderpayment: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const backendUrl = "http://localhost:3000";

    const { room, customerInfo, checkIn, checkOut, numNights, totalAmount, finalAmount, discountInfo, promotionCode, priceUnit, specialRequests, paymentType: initialPaymentType, checkInTime } = location.state || {};

    const [userData, setUserData] = useState<UserData | null>(null);
    const [paymentType, setPaymentType] = useState<'full' | 'deposit'>(initialPaymentType || 'full');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const storedUser = localStorage.getItem('userData');
            if (storedUser) {
                const user = JSON.parse(storedUser) as UserData;
                const userId = user.id || user._id;
                try {
                    const res = await axios.get<ApiResponse<UserData>>(`${backendUrl}/api/user/profile/${userId}`);
                    const dbUser = res.data.data || res.data.user;
                    if (res.data.success && dbUser) {
                        setUserData(dbUser);
                        localStorage.setItem('userData', JSON.stringify(dbUser));
                    }
                } catch (error) {
                    setUserData(user);
                }
            }
        };
        fetchUserData();
    }, []);

    if (!room || !customerInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">error_outline</span>
                    <h2 className="text-2xl font-black text-gray-800 mb-4">Thiếu thông tin thanh toán</h2>
                    <button onClick={() => navigate('/rooms')} className="bg-[#003580] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900 transition-all">
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        );
    }

    const depositAmount = finalAmount * 0.3;
    const requiredAmount = paymentType === 'full' ? finalAmount : depositAmount;
    const hasEnoughBalance = (userData?.balance || 0) >= requiredAmount;

    const handleConfirmPayment = async () => {
        if (!hasEnoughBalance) {
            toast.error("Số dư ví không đủ. Vui lòng nạp thêm tiền.");
            return;
        }

        setIsProcessing(true);
        try {
            const bookingData = {
                userId: userData?.id || userData?._id,
                customerInfo,
                checkInDate: new Date(checkIn),
                checkOutDate: new Date(checkOut),
                rooms: [{
                    roomId: room?._id,
                    price: room?.price
                }],
                promotionCode: discountInfo?.amount > 0 ? promotionCode : "",
                specialRequests,
                checkInTime,
                paymentMethod: 'wallet',
                paymentStatus: paymentType === 'full' ? 'paid' : 'deposited',
                paidAmount: requiredAmount,
                totalAmount: finalAmount,
                status: 'confirmed'
            };

            const response = await axios.post(`${backendUrl}/api/bookings`, bookingData);

            if (response.data.success) {
                // Update local balance
                const updatedUser = { ...userData!, balance: (userData?.balance || 0) - requiredAmount };
                setUserData(updatedUser);
                localStorage.setItem('userData', JSON.stringify(updatedUser));

                toast.success(paymentType === 'full' ? "Thanh toán thành công!" : "Đặt cọc thành công!");

                // Show success modal or redirect
                setTimeout(() => {
                    navigate('/profile');
                }, 2000);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Giao dịch thất bại");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-[#f5f7f8] min-h-screen font-['Inter',_sans-serif] text-slate-900 pb-20">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/payment', { state: location.state })}
                    className="flex items-center gap-2 text-[#003580] font-black hover:text-[#002a6b] transition-all mb-6 group bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow-md"
                >
                    <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1 text-xl">arrow_back</span>
                    Quay lại chọn hình thức
                </button>

                {/* Progress Stepper */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#003580]">Bước 4: Xác nhận và Hoàn tất</span>
                        <span className="text-sm font-medium text-emerald-600">Sẵn sàng 100%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-full"></div>
                    </div>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-black text-[#003580] mb-2">Xác nhận thanh toán</h1>
                    <p className="text-slate-500 font-medium">Vui lòng kiểm tra lại thông tin và xác nhận trừ tiền trong ví.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Order Info & Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Summary Section */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

                            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-[#003580]">
                                <span className="material-symbols-outlined">receipt_long</span>
                                Tóm tắt đặt phòng
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between pb-3 border-b border-dashed border-slate-100">
                                    <span className="text-slate-500">Phòng đã chọn</span>
                                    <span className="font-bold">{room.name}</span>
                                </div>
                                <div className="flex justify-between pb-3 border-b border-dashed border-slate-100">
                                    <span className="text-slate-500">Thời gian</span>
                                    <span className="font-bold">{new Date(checkIn).toLocaleDateString('vi-VN')} - {new Date(checkOut).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex justify-between pb-3 border-b border-dashed border-slate-100 text-xs italic">
                                    <span className="text-slate-400">Giờ nhận phòng dự kiến:</span>
                                    <span className="font-bold text-[#003580]">{checkInTime !== 'Tôi chưa biết' ? `${checkInTime}, ngày ${new Date(checkIn).toLocaleDateString('vi-VN')}` : 'Tôi chưa biết'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Tổng tiền phòng</span>
                                    <span className="font-bold">{new Intl.NumberFormat('vi-VN').format(finalAmount)}₫</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Selection */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-[#003580]">
                                <span className="material-symbols-outlined">payments</span>
                                Hình thức thanh toán
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label
                                    className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-3 ${paymentType === 'deposit'
                                            ? 'border-[#003580] bg-blue-50 ring-2 ring-blue-100'
                                            : 'border-slate-100 hover:border-slate-300 bg-white'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentType"
                                        className="hidden"
                                        checked={paymentType === 'deposit'}
                                        onChange={() => setPaymentType('deposit')}
                                    />
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentType === 'deposit' ? 'bg-[#003580] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <span className="material-symbols-outlined">savings</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-sm">Đặt cọc 30%</p>
                                        <p className="text-xs font-bold text-slate-500">{new Intl.NumberFormat('vi-VN').format(depositAmount)}₫</p>
                                    </div>
                                    {paymentType === 'deposit' && <span className="absolute top-3 right-3 material-symbols-outlined text-[#003580]">check_circle</span>}
                                </label>

                                <label
                                    className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-3 ${paymentType === 'full'
                                            ? 'border-[#003580] bg-blue-50 ring-2 ring-blue-100'
                                            : 'border-slate-100 hover:border-slate-300 bg-white'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentType"
                                        className="hidden"
                                        checked={paymentType === 'full'}
                                        onChange={() => setPaymentType('full')}
                                    />
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentType === 'full' ? 'bg-[#003580] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <span className="material-symbols-outlined">account_balance_wallet</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-sm">Toàn bộ 100%</p>
                                        <p className="text-xs font-bold text-slate-500">{new Intl.NumberFormat('vi-VN').format(finalAmount)}₫</p>
                                    </div>
                                    {paymentType === 'full' && <span className="absolute top-3 right-3 material-symbols-outlined text-[#003580]">check_circle</span>}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right: Wallet & Confirmation */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-[#003580] to-blue-900 p-8 rounded-3xl text-white shadow-xl">
                            <h3 className="text-sm font-black uppercase tracking-widest text-blue-200 mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">wallet</span>
                                Ví dư của bạn
                            </h3>
                            <div className="mb-8">
                                <p className="text-3xl font-black tracking-tight">{new Intl.NumberFormat('vi-VN').format(userData?.balance || 0)}₫</p>
                                <p className="text-xs text-blue-300 font-medium mt-1 italic">Tự động cập nhật từ hệ thống</p>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-white/10">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-blue-300">Cần thanh toán ngay</span>
                                    <span className="text-[#febb02]">{new Intl.NumberFormat('vi-VN').format(requiredAmount)}₫</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold border-t border-white/5 pt-3">
                                    <span className="text-blue-300">Còn lại phải trả (tại KS)</span>
                                    <span className="text-emerald-400">
                                        {new Intl.NumberFormat('vi-VN').format(finalAmount - requiredAmount)}₫
                                    </span>
                                </div>
                            </div>

                            <button
                                disabled={!hasEnoughBalance || isProcessing}
                                onClick={() => setShowConfirmModal(true)}
                                className={`w-full mt-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${hasEnoughBalance && !isProcessing
                                        ? 'bg-[#febb02] text-[#003580] hover:bg-[#ffc83d] shadow-orange-900/40'
                                        : 'bg-white/10 text-white/40 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                {isProcessing ? (
                                    <span className="material-symbols-outlined animate-spin">sync</span>
                                ) : (
                                    <>
                                        Xác nhận thanh toán
                                        <span className="material-symbols-outlined text-sm">lock</span>
                                    </>
                                )}
                            </button>

                            {!hasEnoughBalance && (
                                <p className="text-[10px] text-center mt-4 text-rose-300 font-bold bg-rose-500/20 py-2 rounded-lg border border-rose-500/30">
                                    Số dự không đủ. Vui lòng nạp thêm tiền.
                                </p>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex gap-4 items-start">
                            <div className="bg-orange-50 p-2 rounded-full text-orange-500">
                                <span className="material-symbols-outlined text-lg">shield_check</span>
                            </div>
                            <div>
                                <h4 className="font-black text-xs text-slate-800">Thanh toán bảo mật</h4>
                                <p className="text-[10px] text-slate-500 font-medium mt-1 italic">
                                    Tiền sẽ được tạm giữ và chỉ chuyển đi khi đơn hàng hoàn tất.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-300">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 text-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl">verified_user</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">Xác nhận thanh toán?</h3>
                            <p className="text-slate-500 font-medium mt-2">Bạn có chắc chắn muốn thực hiện giao dịch này từ ví cá nhân?</p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6 mb-8 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Hình thức</span>
                                <span className="font-bold text-[#003580]">{paymentType === 'full' ? 'Thanh toán 100%' : 'Đặt cọc 30%'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Giờ nhận phòng</span>
                                <span className="font-bold text-[#003580]">{checkInTime !== 'Tôi chưa biết' ? `${checkInTime}, ngày ${new Date(checkIn).toLocaleDateString('vi-VN')}` : 'Tôi chưa biết'}</span>
                            </div>
                            <div className="flex justify-between text-lg font-black pt-3 border-t border-slate-200">
                                <span className="text-slate-800">Số tiền trừ</span>
                                <span className="text-[#ec5b13]">{new Intl.NumberFormat('vi-VN').format(requiredAmount)}₫</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    handleConfirmPayment();
                                }}
                                className="w-full bg-[#003580] text-white font-black py-4 rounded-2xl hover:bg-blue-900 transition-all shadow-lg active:scale-95"
                            >
                                Đồng ý và Thanh toán
                            </button>
                            <button 
                                onClick={() => setShowConfirmModal(false)}
                                className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                Hủy giao dịch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orderpayment;
