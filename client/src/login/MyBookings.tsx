import React, { useEffect, useState, useMemo } from 'react';
import { exportInvoice } from '../utils/exportInvoice';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../lib/redux/store';
import {
    fetchMyBookingsThunk,
    cancelMyBookingThunk,
    selectAllBookings,
    selectBookingLoading,
} from '../lib/redux/reducers/booking';
import { selectAuthUser, selectIsLoggedIn } from '../lib/redux/reducers/auth/selectors';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../lib/redux/api/axiosInstance';

const ReviewModal: React.FC<{ booking: any; onClose: () => void; onSaved: () => void }> = ({ booking, onClose, onSaved }) => {
    const [rating, setRating] = useState<number>(5);
    const [comment, setComment] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const user = useAppSelector(selectAuthUser);

    const handleSubmit = async () => {
        if (!comment.trim()) {
            toast.warn("Vui lòng nhập nội dung đánh giá");
            return;
        }
        try {
            setLoading(true);
            const userId = user?.id || (user as any)?._id;
            const res = await axiosInstance.post("/api/comments/add", {
                userId,
                roomTypeId: booking.roomTypeId?._id || booking.roomTypeInfo?._id || booking.roomTypeId,
                bookingId: booking._id,
                rating,
                comment
            });

            if (res.data.success) {
                toast.success("Cảm ơn bạn đã đánh giá!");
                onSaved();
                onClose();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi gửi đánh giá");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto shadow-2xl">
            <div className="bg-white w-full max-w-md rounded-[40px] overflow-hidden animate-in fade-in zoom-in duration-300 shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#006ce4]">rate_review</span>
                        Đánh giá kỳ nghỉ
                    </h3>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-8">
                    <div className="flex flex-col items-center mb-8">
                        <p className="text-gray-500 font-bold mb-4 text-center">Trải nghiệm của bạn tại phòng<br /><span className="text-[#006ce4] font-black">{booking.roomTypeId?.name || booking.roomTypeInfo?.name}</span> thế nào?</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setRating(s)}
                                    className="transition-all hover:scale-125 active:scale-95"
                                >
                                    <span className={`material-symbols-outlined text-5xl ${s <= rating ? "text-[#febb02]" : "text-gray-200"}`}
                                        style={{ fontVariationSettings: s <= rating ? "'FILL' 1" : "'FILL' 0" }}
                                    >
                                        star
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="mt-4 px-4 py-1 rounded-full bg-[#febb02]/10 text-xs font-black text-[#febb02] uppercase tracking-widest border border-[#febb02]/20">
                            {rating === 5 ? "Xuất sắc" : rating === 4 ? "Rất tốt" : rating === 3 ? "Hài lòng" : rating === 2 ? "Kém" : "Tệ"}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Lời bình của bạn</label>
                            <textarea
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl p-5 text-sm font-medium focus:border-[#006ce4] focus:bg-white outline-none transition-all resize-none h-32 focus:ring-4 focus:ring-blue-50"
                                placeholder="Hãy chia sẻ trải nghiệm thực tế của bạn để giúp mọi người chọn được phòng tốt nhất..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            ></textarea>
                        </div>

                        <button
                            disabled={loading}
                            onClick={handleSubmit}
                            className="w-full bg-[#006ce4] text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-[#1a1a1a] transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 mb-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Gửi đánh giá ngay</span>
                                    <span className="material-symbols-outlined text-lg">send</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailModal: React.FC<{ booking: any; onClose: () => void; isCancellable: boolean; onCancel: (id: string) => void }> = ({ booking, onClose, isCancellable, onCancel }) => {
    if (!booking) return null;
    const nights = Math.ceil(
        (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const formatPaymentMethod = (method: string) => {
        const methods: Record<string, string> = {
            cash: 'Tiền mặt',
            bank_transfer: 'Chuyển khoản',
            credit_card: 'Thẻ tín dụng',
            momo: 'Ví MoMo',
            zalopay: 'ZaloPay',
            vnpay: 'VNPay'
        };
        return methods[method] || 'Chưa xác định';
    };

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
                {/* Modern Header */}
                <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-xl font-bold text-white">Chi tiết đặt phòng</h2>
                            <p className="text-white/60 text-sm mt-1 font-mono">#{booking._id?.slice(-8).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/50 text-xs uppercase tracking-wider">Ngày đặt</p>
                            <p className="text-white/90 text-sm font-medium">{new Date(booking.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {/* Customer & Stay Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khách hàng</span>
                            </div>
                            <p className="font-semibold text-slate-900">{booking.customerInfo?.name}</p>
                            <p className="text-sm text-slate-600 mt-1">{booking.customerInfo?.phone}</p>
                            <p className="text-sm text-slate-600">{booking.customerInfo?.email}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lịch trình</span>
                            </div>
                            <p className="font-semibold text-slate-900">
                                {new Date(booking.checkInDate).toLocaleDateString('vi-VN')} — {new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">{nights} ngày • {booking.roomQuantity} phòng</p>
                            <p className="text-sm text-indigo-600 font-semibold mt-1">Check-in: {booking.checkInTime || '14:00'}</p>
                        </div>
                    </div>

                    {/* Room Info */}
                    <div className="bg-slate-50 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thông tin phòng</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                                <img
                                    src={booking.roomTypeId?.image || booking.roomTypeInfo?.images?.[0] || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=200&h=200&fit=crop'}
                                    className="w-full h-full object-cover"
                                    alt=""
                                />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900">{booking.roomTypeId?.name || booking.roomTypeInfo?.name || 'Deluxe Room'}</p>
                                <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                    {booking.roomTypeId?.description || 'Trải nghiệm không gian sang trọng với đầy đủ tiện nghi'}
                                </p>
                                {booking.details && booking.details.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {booking.details.map((d: any, idx: number) => (
                                            <span key={idx} className="text-xs font-medium text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                                                🚪 Phòng {d.roomId?.roomNumber || d.roomId?.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Special Requests */}
                    {booking.specialRequests && (
                        <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200">
                            <div className="flex items-start gap-3">
                                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Yêu cầu đặc biệt</span>
                                    <p className="text-sm text-amber-800 mt-1">{booking.specialRequests}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Details */}
                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chi tiết thanh toán</span>
                        </div>
                        <div className="space-y-2.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Giá phòng ({nights} ngày)</span>
                                <span className="text-slate-900 font-medium">{new Intl.NumberFormat('vi-VN').format(booking.totalAmount)}₫</span>
                            </div>
                            {booking.discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>🎉 Giảm giá ({booking.promotionCode})</span>
                                    <span className="font-semibold">-{new Intl.NumberFormat('vi-VN').format(booking.discountAmount)}₫</span>
                                </div>
                            )}
                            {booking.totalServiceAmount > 0 && (
                                <div className="flex justify-between text-sm text-purple-600">
                                    <span>🛎️ Dịch vụ đã dùng (gộp)</span>
                                    <span className="font-semibold">+{new Intl.NumberFormat('vi-VN').format(booking.totalServiceAmount)}₫</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-3 border-t border-slate-200">
                                <span className="font-bold text-slate-900">Tổng tiền phòng</span>
                                <span className="font-bold text-xl text-indigo-600">{new Intl.NumberFormat('vi-VN').format(booking.finalAmount)}₫</span>
                            </div>
                            {booking.totalServiceAmount > 0 && (
                                <div className="flex justify-between mt-1 px-3 py-2 bg-purple-50 rounded-xl">
                                    <span className="font-black text-slate-900 text-sm">Tổng phải trả (phòng + DV)</span>
                                    <span className="font-black text-lg text-purple-700">{new Intl.NumberFormat('vi-VN').format(booking.finalAmount + booking.totalServiceAmount)}₫</span>
                                </div>
                            )}
                            {booking.paidAmount > 0 && booking.paymentStatus !== 'paid' && (
                                <>
                                    <div className="flex justify-between text-sm text-blue-600">
                                        <span>💰 Đã đặt cọc</span>
                                        <span className="font-medium">-{new Intl.NumberFormat('vi-VN').format(booking.paidAmount)}₫</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-1">
                                        <span className="font-semibold text-rose-600">💳 Còn lại</span>
                                        <span className="font-bold text-rose-600">{new Intl.NumberFormat('vi-VN').format(booking.finalAmount - booking.paidAmount)}₫</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">{formatPaymentMethod(booking.paymentMethod)}</span>
                            </div>
                            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${booking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {booking.paymentStatus === 'paid' ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                            </span>
                        </div>
                    </div>

                    {/* Service Orders Section */}
                    {booking.serviceOrders && booking.serviceOrders.length > 0 && (
                        <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <span className="material-symbols-outlined text-purple-600" style={{ fontSize: '14px' }}>room_service</span>
                                </div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dịch vụ đã đặt ({booking.serviceOrders.length} đơn)</span>
                            </div>
                            <div className="space-y-2">
                                {booking.serviceOrders.map((order: any, idx: number) => {
                                    const statusMap: Record<string, { label: string; color: string }> = {
                                        pending: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700' },
                                        confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
                                        preparing: { label: 'Đang chuẩn bị', color: 'bg-indigo-100 text-indigo-700' },
                                        delivering: { label: 'Đang giao', color: 'bg-cyan-100 text-cyan-700' },
                                        completed: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700' },
                                        cancelled: { label: 'Đã hủy', color: 'bg-rose-100 text-rose-700' },
                                    };
                                    const sc = statusMap[order.status] || { label: order.status, color: 'bg-slate-100 text-slate-700' };
                                    return (
                                        <div key={idx} className="bg-white rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                                                    <span className="text-xs text-slate-500">{order.items.length} món</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {order.items.slice(0, 3).map((item: any, i: number) => (
                                                        <span key={i} className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                                            {item.serviceId?.name || 'Dịch vụ'} x{item.quantity}
                                                        </span>
                                                    ))}
                                                    {order.items.length > 3 && (
                                                        <span className="text-xs text-slate-400">+{order.items.length - 3} món</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-purple-700 text-sm">{new Intl.NumberFormat('vi-VN').format(order.totalAmount)}₫</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {order.paymentStatus === 'charged_to_room' ? '📋 Gộp vào phòng' : '💵 Trả riêng'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        {isCancellable && (
                            <button
                                onClick={() => onCancel(booking._id)}
                                className="flex-1 py-3 border-2 border-rose-200 text-rose-600 rounded-xl font-semibold text-sm hover:bg-rose-50 hover:border-rose-300 transition-all"
                            >
                                Hủy đặt phòng
                            </button>
                        )}
                        {(booking.status === 'completed' || booking.paymentStatus === 'paid') && (
                            <button
                                onClick={() => exportInvoice(booking)}
                                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md"
                            >
                                📄 Tải hóa đơn
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyBookings: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector(selectAuthUser);
    const isLoggedIn = useAppSelector(selectIsLoggedIn);
    const bookings = useAppSelector(selectAllBookings) as any[];
    const loading = useAppSelector(selectBookingLoading);

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
    const [reviewingBooking, setReviewingBooking] = useState<any>(null);

    const userId = useMemo(() => {
        if (!currentUser) return null;
        return (currentUser.id || (currentUser as any)._id)?.toString() || null;
    }, [currentUser]);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        if (userId) {
            dispatch(fetchMyBookingsThunk(userId)).unwrap().catch(() => { });
        }
    }, [dispatch, userId, isLoggedIn, navigate]);

    const handleCancelBooking = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn đặt phòng này không?")) return;
        try {
            await dispatch(cancelMyBookingThunk(id)).unwrap();
            toast.success("Đã hủy đơn đặt phòng thành công");
            if (userId) {
                dispatch(fetchMyBookingsThunk(userId));
            }
        } catch (error: any) {
            toast.error(error?.message || error || "Lỗi khi hủy đơn hàng");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'confirmed': return 'bg-indigo-100 text-indigo-700';
            case 'checked_in': return 'bg-emerald-100 text-emerald-700';
            case 'checked_out': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-teal-100 text-teal-700';
            case 'cancelled': return 'bg-rose-100 text-rose-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: '⏳ Chờ duyệt',
            confirmed: '✓ Đã xác nhận',
            checked_in: '🏠 Đã nhận phòng',
            checked_out: '🚪 Đã trả phòng',
            completed: '✨ Hoàn tất',
            cancelled: '✕ Đã hủy'
        };
        return labels[status] || status;
    };

    const isCancellable = (booking: any) => {
        if (!booking) return false;
        if (booking.status !== 'pending' && booking.status !== 'confirmed') return false;

        const now = new Date();
        const checkInDate = new Date(booking.checkInDate);
        if (booking.status === 'pending') return true;

        const diffInHours = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffInHours > 24;
    };

    const filteredBookings = bookings.filter(b => statusFilter === 'all' || b.status === statusFilter);
    const selectedBooking = bookings.find(b => b._id === selectedBookingId) || null;

    const stats = {
        total: bookings.length,
        upcoming: bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length,
        completed: bookings.filter(b => b.status === 'completed').length,
    };

    if (!isLoggedIn || !currentUser) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-24 pb-16 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Hero Header */}
                <div className="relative mb-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-purple-600/5 to-pink-600/5 rounded-3xl blur-3xl"></div>
                    <div className="relative">
                        <nav className="flex items-center gap-2 pb-6 text-sm">
                            <Link to="/" className="text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1">
                                <span className="material-symbols-outlined text-lg">home</span>
                                Trang chủ
                            </Link>
                            <span className="material-symbols-outlined text-gray-300 text-sm">chevron_right</span>
                            <span className="text-indigo-600 font-bold">Đặt phòng của tôi</span>
                        </nav>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Đặt phòng của tôi
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            Chào mừng trở lại, <span className="font-semibold text-slate-700">{currentUser.full_name}</span>
                        </p>
                    </div>
                </div>

                {/* Modern Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-indigo-500/0 rounded-2xl group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Tổng đơn</p>
                                <p className="text-4xl font-bold text-slate-900 mt-2">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Sắp tới</p>
                                <p className="text-4xl font-bold text-indigo-600 mt-2">{stats.upcoming}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Đã hoàn thành</p>
                                <p className="text-4xl font-bold text-teal-600 mt-2">{stats.completed}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modern Filters */}
                <div className="flex flex-wrap gap-3 mb-10">
                    {[
                        { label: '📋 Tất cả', value: 'all' },
                        { label: '⏳ Chờ duyệt', value: 'pending' },
                        { label: '✓ Đã xác nhận', value: 'confirmed' },
                        { label: '🏠 Đã nhận phòng', value: 'checked_in' },
                        { label: '🚪 Đã trả phòng', value: 'checked_out' },
                        { label: '✨ Hoàn tất', value: 'completed' },
                        { label: '✕ Đã hủy', value: 'cancelled' }
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setStatusFilter(opt.value)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${statusFilter === opt.value
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                {loading ? (
                    <div className="grid grid-cols-1 gap-5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-40 animate-pulse shadow-sm"></div>
                        ))}
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center shadow-sm">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Chưa có đặt phòng nào</h3>
                        <p className="text-slate-500 mb-8">Bắt đầu hành trình khám phá của bạn ngay hôm nay</p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md"
                        >
                            🔍 Tìm phòng ngay
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5">
                        {filteredBookings.map((booking) => {
                            const nights = Math.ceil(
                                (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
                            );
                            return (
                                <div
                                    key={booking._id}
                                    className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                                >
                                    <div className="p-6">
                                        <div className="flex flex-wrap gap-6">
                                            {/* Image */}
                                            <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                                                <img
                                                    src={booking.roomTypeId?.image || booking.roomTypeInfo?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop'}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    alt=""
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap justify-between gap-4">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusStyle(booking.status)}`}>
                                                                {getStatusLabel(booking.status)}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-lg">
                                                                #{booking._id?.slice(-8).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-bold text-xl text-slate-900">
                                                            {booking.roomTypeId?.name || booking.roomTypeInfo?.name || 'Deluxe Room'}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                                            <div className="flex items-center gap-1.5">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <span>{new Date(booking.checkInDate).toLocaleDateString('vi-VN')}</span>
                                                            </div>
                                                            <span className="text-slate-300">→</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                                </svg>
                                                                <span>{nights} ngày</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                                </svg>
                                                                <span>{booking.roomQuantity} phòng</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-slate-500 font-medium">Tổng tiền</p>
                                                        <p className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                                            {new Intl.NumberFormat('vi-VN').format(booking.finalAmount)}₫
                                                        </p>
                                                        <div className="flex gap-2 mt-3">
                                                            <button
                                                                onClick={() => { setSelectedBookingId(booking._id); setIsDetailOpen(true); }}
                                                                className="px-4 py-2 text-sm text-indigo-600 font-semibold hover:bg-indigo-50 rounded-xl transition-colors"
                                                            >
                                                                Chi tiết
                                                            </button>
                                                            {['checked_out', 'completed'].includes(booking.status) && (
                                                                <button
                                                                    onClick={() => setReviewingBooking(booking)}
                                                                    className="px-4 py-2 text-sm text-emerald-600 font-black hover:bg-emerald-50 rounded-xl transition-all border border-emerald-100 shadow-sm hover:shadow-md flex items-center gap-1"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">star</span>
                                                                    Đánh giá
                                                                </button>
                                                            )}
                                                            {isCancellable(booking) && (
                                                                <button
                                                                    onClick={() => handleCancelBooking(booking._id)}
                                                                    className="px-4 py-2 text-sm text-rose-600 font-semibold hover:bg-rose-50 rounded-xl transition-colors"
                                                                >
                                                                    Hủy
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isDetailOpen && selectedBooking && (
                <DetailModal
                    booking={selectedBooking}
                    onClose={() => setIsDetailOpen(false)}
                    isCancellable={isCancellable(selectedBooking)}
                    onCancel={handleCancelBooking}
                />
            )}

            {/* Review Modal */}
            {reviewingBooking && (
                <ReviewModal
                    booking={reviewingBooking}
                    onClose={() => setReviewingBooking(null)}
                    onSaved={() => {
                        if (userId) dispatch(fetchMyBookingsThunk(userId));
                    }}
                />
            )}
        </div>
    );
};

export default MyBookings;