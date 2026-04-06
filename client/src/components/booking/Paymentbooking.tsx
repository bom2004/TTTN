import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Room } from '../../types';
import { useAppSelector } from '../../lib/redux/store';
import { selectAuthUser } from '../../lib/redux/reducers/auth';

const PaymentBooking: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { room, customerInfo, checkIn, checkOut, numNights, totalAmount, finalAmount, discountInfo, promotionCode, priceUnit, specialRequests, checkInTime, roomQuantity = 1 } = location.state || {};
    const userData = useAppSelector(selectAuthUser);

    if (!room) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy thông tin thanh toán</h2>
                    <button onClick={() => navigate('/rooms')} className="bg-[#003580] text-white px-6 py-2 rounded-lg font-bold">
                        Quay lại tìm phòng
                    </button>
                </div>
            </div>
        );
    }

    const handlePayment = (type: 'full' | 'deposit') => {
        navigate('/order-payment', { 
            state: { 
                ...location.state, 
                paymentType: type,
                roomQuantity
            } 
        });
    };

    return (
        <div className="bg-[#f5f7f8] min-h-screen font-['Inter',_sans-serif] text-slate-900 pb-20">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/booking', { state: location.state })}
                    className="flex items-center gap-2 text-[#003580] font-black hover:text-[#002a6b] transition-all mb-6 group bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow-md"
                >
                    <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1 text-xl">arrow_back</span>
                    Quay lại thông tin khách hàng
                </button>

                {/* Progress Stepper */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#003580]">Bước 3: Chọn hình thức thanh toán</span>
                        <span className="text-sm font-medium text-slate-500">Hoàn thành 85%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#003580] h-full w-[85%]"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Summary & Payment Options */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Booking Summary Card */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-[#003580]">
                                <span className="material-symbols-outlined text-3xl">receipt_long</span>
                                Chi tiết đơn đặt phòng
                            </h2>

                            <div className="space-y-4 border-b border-slate-100 pb-6 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Khách hàng:</span>
                                    <span className="font-bold text-slate-900">{customerInfo?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Số điện thoại:</span>
                                    <span className="font-bold text-slate-900">{customerInfo?.phone}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Email:</span>
                                    <span className="font-bold text-slate-900">{customerInfo?.email}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Phòng:</span>
                                    <span className="font-bold text-[#003580]">{room.name} (x{roomQuantity})</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Thời gian:</span>
                                    <span className="font-bold text-slate-900">{new Date(checkIn).toLocaleDateString('vi-VN')} - {new Date(checkOut).toLocaleDateString('vi-VN')} ({numNights} {priceUnit})</span>
                                </div>
                                <div className="flex justify-between items-center text-sm italic">
                                    <span className="text-slate-500 font-medium">Giờ nhận phòng dự kiến:</span>
                                    <span className="font-bold text-[#ec5b13]">{checkInTime !== 'Tôi chưa biết' ? `${checkInTime}, ngày ${new Date(checkIn).toLocaleDateString('vi-VN')}` : 'Tôi chưa biết'}</span>
                                </div>
                                {specialRequests && (
                                    <div className="flex flex-col gap-1 pt-2">
                                        <span className="text-slate-500 font-medium">Yêu cầu đặc biệt:</span>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 italic text-sm text-slate-600">
                                            "{specialRequests}"
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Giá gốc:</span>
                                    <span className="font-bold">{new Intl.NumberFormat('vi-VN').format(totalAmount)}₫</span>
                                </div>
                                {discountInfo?.amount > 0 && (
                                    <div className="flex justify-between items-center text-emerald-600">
                                        <span className="font-medium">Giảm giá ({discountInfo.percent}%):</span>
                                        <span className="font-bold">-{new Intl.NumberFormat('vi-VN').format(discountInfo.amount)}₫</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                    <span className="text-lg font-black text-[#003580]">Tổng cộng thanh toán:</span>
                                    <span className="text-2xl font-black text-[#ec5b13]">{new Intl.NumberFormat('vi-VN').format(finalAmount)}₫</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Actions */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-[#003580]">
                                <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                                Chọn phương thức thanh toán
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handlePayment('deposit')}
                                    className="p-6 border-2 border-slate-100 rounded-2xl flex flex-col items-center gap-3 hover:border-[#003580] hover:bg-blue-50/50 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-[#003580] group-hover:bg-[#003580] group-hover:text-white transition-all">
                                        <span className="material-symbols-outlined">payments</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-slate-900">Đặt cọc trước (30%)</p>
                                        <p className="text-sm text-slate-500 font-medium">{new Intl.NumberFormat('vi-VN').format(finalAmount * 0.3)}₫</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handlePayment('full')}
                                    className="p-6 border-2 border-[#003580] bg-blue-50/30 rounded-2xl flex flex-col items-center gap-3 hover:bg-blue-50 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-[#003580] rounded-full flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">check_circle</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-slate-900">Thanh toán toàn bộ</p>
                                        <p className="text-sm text-[#ec5b13] font-black">{new Intl.NumberFormat('vi-VN').format(finalAmount)}₫</p>
                                    </div>
                                </button>
                            </div>

                            <p className="mt-6 text-xs text-slate-400 italic text-center">
                                * Lưu ý: Trạng thái phòng sẽ được cập nhật chính thức sau khi bạn hoàn tất một trong hai lựa chọn thanh toán trên.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Tips/Policies */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-black text-sm mb-4 flex items-center gap-2 text-[#003580]">
                                <span className="material-symbols-outlined text-blue-500">info</span>
                                Tại sao nên thanh toán?
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <span className="material-symbols-outlined text-emerald-500 text-sm">security</span>
                                    <p className="text-xs text-slate-500 leading-relaxed">Đảm bảo giữ phòng 100% trong mùa cao điểm.</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="material-symbols-outlined text-emerald-500 text-sm">speed</span>
                                    <p className="text-xs text-slate-500 leading-relaxed">Nhận phòng nhanh hơn mà không cần làm thủ tục tiền nong tại quầy.</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="material-symbols-outlined text-emerald-500 text-sm">verified_user</span>
                                    <p className="text-xs text-slate-500 leading-relaxed">Áp dụng đầy đủ các chương trình khuyến mãi Genius hiện có.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-[#003580] to-blue-900 p-6 rounded-2xl text-white shadow-lg">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined">help</span>
                                <span className="font-black text-sm">Hỗ trợ 24/7</span>
                            </div>
                            <p className="text-xs text-blue-100 font-medium mb-4 leading-relaxed">
                                Nếu gặp vấn đề khi thanh toán, vui lòng liên hệ hotline:
                            </p>
                            <p className="text-lg font-black tracking-widest text-[#febb02]">1900 1234 56</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PaymentBooking;
