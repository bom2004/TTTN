import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import { selectAuthUser } from '../../lib/redux/reducers/auth';
import { toast } from 'react-toastify';
import axiosInstance from '../../lib/redux/api/axiosInstance';
import ConfirmModal from '../../admin/components/ConfirmModal';

const Orderpayment: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { room, customerInfo, checkIn, checkOut, numNights, totalAmount, finalAmount, discountInfo, promotionCode, priceUnit, specialRequests, paymentType: initialPaymentType, checkInTime, roomQuantity = 1 } = location.state || {};

    const userData = useAppSelector(selectAuthUser);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Mặc định cho quy trình mới: Chỉ đặt cọc và thanh toán qua VNPay
    const paymentType = 'deposit';
    const paymentGateway = 'vnpay';

    useEffect(() => {
        const userId = userData?.id || userData?._id;
        if (!room || !userId) {
            navigate('/rooms');
        }
    }, [room, userData, navigate]);

    if (!room) return null;

    const depositAmount = Math.round(finalAmount * 0.3);
    const requiredAmount = depositAmount;

    const handleCreateBooking = async () => {
        setIsProcessing(true);
        try {
            const bookingData = {
                userId: userData?.id || userData?._id,
                roomTypeId: room._id,
                roomQuantity,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                customerInfo,
                specialRequests,
                promotionCode,
                paymentMethod: paymentGateway,
                paymentStatus: 'unpaid', // Sẽ được cập nhật sau khi thanh toán thành công
                paymentType: paymentType,
                paidAmount: requiredAmount,
                checkInTime
            };

            const response = await axiosInstance.post('/api/bookings', bookingData);

            if (response.data.success) {
                if (response.data.paymentUrl) {
                    window.location.href = response.data.paymentUrl;
                } else {
                    toast.success("Đơn đặt phòng đã được tạo thành công!");
                    navigate('/my-bookings');
                }
            } else {
                throw new Error(response.data.message || "Lỗi tạo đơn đặt phòng");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message);
            setIsProcessing(false);
            setShowConfirmModal(false);
        }
    };

    return (
        <div className="bg-[#f5f7f8] min-h-screen font-['Inter',_sans-serif] text-slate-900 pb-20">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[#003580] font-black hover:gap-3 transition-all mb-4 group"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            Quay lại bước trước
                        </button>
                        <h1 className="text-4xl font-[900] tracking-tighter text-[#003580]">
                            Thanh toán & Xác nhận
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">Vui lòng kiểm tra lại thông tin và tiến hành đặt cọc</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Selected Room Summary */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8">
                            <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shadow-inner shrink-0">
                                <img src={room.images?.[0] || 'https://via.placeholder.com/300'} alt={room.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-black text-[#003580] leading-none mb-2">{room.name}</h2>
                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">groups</span> {room.capacity} Người</span>
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">bed</span> {room.bedType}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian</p>
                                        <p className="font-black text-[#ec5b13]">{numNights} ngày</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Nhận phòng</p>
                                        <p className="font-bold text-sm">{new Date(checkIn).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Trả phòng</p>
                                        <p className="font-bold text-sm">{new Date(checkOut).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information Summary */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <span className="material-symbols-outlined text-8xl">contact_page</span>
                            </div>
                            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-[#003580]">
                                <span className="material-symbols-outlined">person</span>
                                Thông tin khách hàng
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Họ và tên</p>
                                        <p className="font-bold text-slate-800">{customerInfo?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                                        <p className="font-bold text-slate-800">{customerInfo?.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số điện thoại</p>
                                        <p className="font-bold text-slate-800">{customerInfo?.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Giờ nhận dự kiến</p>
                                        <p className="font-bold text-[#ec5b13]">{checkInTime}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Information (Deposit Only) */}
                        <div className="bg-white p-8 rounded-3xl border-2 border-emerald-500 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-50"></div>

                            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-emerald-700">
                                <span className="material-symbols-outlined">payments</span>
                                Quy định thanh toán
                            </h2>

                            <div className="flex items-center gap-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                                    <span className="material-symbols-outlined text-3xl">savings</span>
                                </div>
                                <div>
                                    <p className="font-black text-emerald-800 text-lg">Đặt cọc 30% để giữ chỗ</p>
                                    <p className="text-sm font-bold text-emerald-600 mt-1">
                                        Số tiền: {new Intl.NumberFormat('vi-VN').format(depositAmount)}₫
                                    </p>
                                    <p className="text-[10px] text-emerald-500 mt-2 italic font-medium">
                                        * Phần tiền còn lại ({new Intl.NumberFormat('vi-VN').format(finalAmount - depositAmount)}₫) sẽ thanh toán trực tiếp khi khách nhận phòng.
                                    </p>
                                </div>
                                <span className="ml-auto material-symbols-outlined text-emerald-500 text-3xl">verified</span>
                            </div>
                        </div>

                        {/* Payment Gateway Selection */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all mb-8">
                            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-[#003580]">
                                <span className="material-symbols-outlined">account_balance</span>
                                Cổng thanh toán
                            </h2>

                            <div className="space-y-4">
                                <div className="relative p-6 rounded-2xl border-2 border-[#003580] bg-blue-50/50 ring-2 ring-blue-100 flex items-center gap-4">
                                    <div className="w-14 h-14 bg-[#003580] text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                        <span className="material-symbols-outlined text-3xl">qr_code_2</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-lg text-[#003580]">Trực tuyến qua VNPay</p>
                                            <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest animate-pulse">Ổn định nhất</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium mt-1">Hỗ trợ QR Code, Thẻ nội địa, Thẻ quốc tế</p>
                                    </div>
                                    <span className="material-symbols-outlined text-[#003580] text-2xl">check_circle</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Confirmation */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-[#003580] to-blue-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>

                            <h3 className="text-sm font-black uppercase tracking-widest text-blue-200 mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">payment</span>
                                Chi tiết thanh toán
                            </h3>

                            <div className="space-y-4 pt-6 border-t border-white/10">
                                <div className="flex justify-between text-base font-bold">
                                    <span className="text-blue-300">Tiền đặt cọc ngay</span>
                                    <span className="text-[#febb02] text-xl">{new Intl.NumberFormat('vi-VN').format(requiredAmount)}₫</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold border-t border-white/5 pt-4">
                                    <span className="text-blue-300">Phải trả tại KS</span>
                                    <span className="text-emerald-400">
                                        {new Intl.NumberFormat('vi-VN').format(finalAmount - requiredAmount)}₫
                                    </span>
                                </div>
                            </div>

                            <button
                                disabled={isProcessing}
                                onClick={() => setShowConfirmModal(true)}
                                className="w-full mt-8 py-5 bg-[#febb02] text-[#003580] rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
                                ) : (
                                    <>
                                        Thanh toán qua VNPay
                                        <span className="material-symbols-outlined">double_arrow</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex gap-4 items-start">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">security</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-[#003580]">Thanh toán an toàn</h4>
                                <p className="text-[10px] text-slate-500 font-medium mt-1">Thông tin thanh toán của bạn được mã hóa theo tiêu chuẩn quốc tế</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <ConfirmModal
                isOpen={showConfirmModal}
                onCancel={() => setShowConfirmModal(false)}
                onConfirm={handleCreateBooking}
                title="Xác nhận thanh toán đặt cọc?"
                message={`Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay để nộp số tiền đặt cọc ${new Intl.NumberFormat('vi-VN').format(requiredAmount)}₫. Bạn có chắc chắn muốn tiếp tục không?`}
                confirmLabel="Tiến hành thanh toán"
                cancelLabel="Đóng và quay lại"
                type="warning"
            />
        </div>
    );
};

export default Orderpayment;
