import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ApiResponse, UserData } from '../types';

interface BookingDetail {
    _id: string;
    bookingId: string;
    roomId: {
        _id: string;
        name: string;
        roomType: string;
        thumbnail: string;
        avatar?: string;
    };
    price: number;
    roomStatus: string;
}

interface Booking {
    _id: string;
    userId: string;
    customerInfo: {
        name: string;
        email: string;
        phone: string;
    };
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    promotionCode: string;
    status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled';
    paymentStatus: 'unpaid' | 'paid' | 'deposited';
    paymentMethod: 'vnpay' | 'cash' | 'balance' | 'wallet';
    paidAmount?: number;
    checkInTime: string;
    specialRequests: string;
    details?: BookingDetail[];
    createdAt: string;
}

const MyBookings: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('userData');
        if (storedUser) {
            const user = JSON.parse(storedUser) as UserData;
            setUserData(user);
            fetchBookings(user.id || user._id!);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchBookings = async (userId: string) => {
        try {
            const response = await axios.get<ApiResponse<Booking[]>>(`${backendUrl}/api/bookings/user/${userId}`);
            if (response.data.success && response.data.data) {
                setBookings(response.data.data);
                // Update selected booking if modal is open to reflect new status
                if (isDetailOpen && selectedBooking) {
                    const updated = response.data.data.find(b => b._id === selectedBooking._id);
                    if (updated) setSelectedBooking(updated);
                }
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách đặt phòng:", error);
            toast.error("Không thể lấy danh sách đặt phòng");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này? Số tiền đã thanh toán sẽ được hoàn về Ví dư của bạn.")) return;
        
        try {
            const response = await axios.put<ApiResponse<any>>(`${backendUrl}/api/bookings/${id}/cancel`);
            if (response.data.success) {
                toast.success(response.data.message);
                if (userData) fetchBookings(userData.id || userData._id!);
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi hủy đơn hàng");
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'confirmed': 'bg-blue-100 text-blue-700 border-blue-200',
            'checked_in': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            'checked_out': 'bg-purple-100 text-purple-700 border-purple-200',
            'completed': 'bg-green-100 text-green-700 border-green-200',
            'cancelled': 'bg-red-100 text-red-700 border-red-200',
        };
        const labels: { [key: string]: string } = {
            'pending': 'Chờ xác nhận',
            'confirmed': 'Đã xác nhận',
            'checked_in': 'Đã nhận phòng',
            'checked_out': 'Đã trả phòng',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            'unpaid': 'bg-gray-100 text-gray-500',
            'paid': 'bg-green-500 text-white',
            'deposited': 'bg-orange-500 text-white',
        };
        const labels: { [key: string]: string } = {
            'unpaid': 'Chưa thanh toán',
            'paid': 'Đã thanh toán',
            'deposited': 'Đã đặt cọc',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-bookingBlue/10 border-t-bookingBlue rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-gray-400">Đang tải danh sách đặt chỗ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f5f5f5] min-h-screen py-12 px-4">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-black text-[#003580] tracking-tight mb-2">Đặt chỗ của tôi</h1>
                    <p className="text-gray-500 font-medium">Xem lại lịch sử và trạng thái các đơn đặt phòng của bạn.</p>
                </header>

                {bookings.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-gray-300 text-5xl">event_busy</span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Chưa có đơn đặt phòng nào</h3>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Bạn chưa thực hiện đặt phòng nào trên QuickStay. Hãy khám phá các phòng tuyệt vời của chúng tôi!</p>
                        <button 
                            onClick={() => navigate('/rooms')}
                            className="bg-[#006ce4] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0057b8] transition shadow-lg shadow-blue-500/20"
                        >
                            Khám phá phòng ngay
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((booking) => (
                            <div key={booking._id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                <div className="flex flex-col lg:flex-row">
                                    {/* Room Thumbnail (of the first room) */}
                                    <div className="lg:w-64 h-48 lg:h-auto overflow-hidden bg-gray-100 relative">
                                        {(booking.details && booking.details[0]?.roomId?.thumbnail) || (booking.details && (booking.details[0]?.roomId as any)?.avatar) ? (
                                            <img 
                                                src={booking.details[0].roomId.thumbnail || (booking.details[0].roomId as any).avatar} 
                                                alt="Room" 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <span className="material-symbols-outlined text-4xl">image</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            {getStatusBadge(booking.status)}
                                        </div>
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-1 p-6 md:p-8">
                                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-lg ring-1 ring-gray-100 flex items-center justify-center bg-gray-50">
                                                        {(booking.details && booking.details[0]?.roomId?.thumbnail) || (booking.details && (booking.details[0]?.roomId as any)?.avatar) ? (
                                                            <img 
                                                                src={booking.details![0].roomId.thumbnail || (booking.details![0].roomId as any).avatar} 
                                                                alt="" 
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-gray-300 text-xl">bed</span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-black text-gray-900 leading-tight">
                                                        {booking.details && booking.details[0]?.roomId?.name ? booking.details[0].roomId.name : 'Thông tin phòng đang cập nhật'}
                                                        {booking.details && booking.details.length > 1 && (
                                                            <span className="text-[#006ce4] ml-2"> (+{booking.details.length - 1} phòng khác)</span>
                                                        )}
                                                    </h3>
                                                </div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                    Mã đơn: <span className="text-gray-900">{booking._id.slice(-8).toUpperCase()}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Thanh toán</p>
                                                <p className="text-xl font-black text-[#003580]">{new Intl.NumberFormat('vi-VN').format(booking.finalAmount)}₫</p>
                                                <div className="flex flex-col items-end gap-1 mt-1">
                                                    {getPaymentStatusBadge(booking.paymentStatus)}
                                                    {booking.paymentStatus === 'deposited' && (
                                                        <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                                                            Còn lại: {new Intl.NumberFormat('vi-VN').format(booking.finalAmount - (booking.paidAmount || (booking.finalAmount * 0.3)))}₫
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#006ce4] shadow-sm">
                                                    <span className="material-symbols-outlined text-lg">calendar_today</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Ngày nhận phòng</p>
                                                    <p className="text-sm font-black text-gray-700">{new Date(booking.checkInDate).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#006ce4] shadow-sm">
                                                    <span className="material-symbols-outlined text-lg">logout</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Ngày trả phòng</p>
                                                    <p className="text-sm font-black text-gray-700">{new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-bookingYellow shadow-sm">
                                                    <span className="material-symbols-outlined text-lg">schedule</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Giờ nhận phòng</p>
                                                    <p className="text-sm font-black text-gray-700">{booking.checkInTime || 'Chưa biết'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-gray-400 text-lg">payments</span>
                                                    <p className="text-xs font-bold text-gray-500">
                                                        PTTT: <span className="text-gray-700 capitalize">{booking.paymentMethod === 'wallet' ? 'Ví QuickStay' : booking.paymentMethod}</span>
                                                    </p>
                                                </div>
                                                {booking.promotionCode && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-green-500 text-lg">loyalty</span>
                                                        <p className="text-xs font-bold text-green-600">
                                                            Đã áp dụng mã: <span className="font-black uppercase">{booking.promotionCode}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setIsDetailOpen(true);
                                                }}
                                                className="text-sm font-black text-[#006ce4] hover:text-[#0052ad] flex items-center gap-1 group/btn"
                                            >
                                                Xem chi tiết đơn
                                                <span className="material-symbols-outlined text-lg group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL CHI TIẾT ĐƠN HÀNG */}
            {isDetailOpen && selectedBooking && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsDetailOpen(false)}
                    ></div>
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-[#003580] p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black tracking-tight">Chi tiết đơn đặt phòng</h2>
                                <p className="text-xs text-white/70 font-bold uppercase tracking-widest mt-1">Mã đơn: #{selectedBooking._id.slice(-8).toUpperCase()}</p>
                            </div>
                            <button 
                                onClick={() => setIsDetailOpen(false)}
                                className="w-10 h-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto no-scrollbar">
                            {/* Khách hàng */}
                            <section className="mb-8">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                    Thông tin khách hàng
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Họ và tên</p>
                                        <p className="text-sm font-black text-gray-900">{selectedBooking.customerInfo.name}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Số điện thoại</p>
                                        <p className="text-sm font-black text-gray-900">{selectedBooking.customerInfo.phone}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl md:col-span-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Địa chỉ Email</p>
                                        <p className="text-sm font-black text-gray-900">{selectedBooking.customerInfo.email}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Phòng đặt */}
                            <section className="mb-8">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">bed</span>
                                    Thông tin phòng
                                </h3>
                                <div className="space-y-3">
                                    {selectedBooking.details?.map((detail, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                                <img src={detail.roomId?.thumbnail || ''} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-gray-900">{detail.roomId?.name || 'Phòng không tên'}</p>
                                                <p className="text-xs font-bold text-gray-400">{detail.roomId?.roomType || 'N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-[#006ce4]">{new Intl.NumberFormat('vi-VN').format(detail.price)}₫</p>
                                                <span className="text-[9px] font-black uppercase text-green-500 bg-green-50 px-1.5 py-0.5 rounded">Giá gốc</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Thời gian & Yêu cầu */}
                            <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        Thời gian & Yêu cầu
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-gray-500">Ngày nhận phòng:</span>
                                            <span className="font-black text-gray-900">{new Date(selectedBooking.checkInDate).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-gray-500">Ngày trả phòng:</span>
                                            <span className="font-black text-gray-900">{new Date(selectedBooking.checkOutDate).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-gray-500">Giờ nhận dự kiến:</span>
                                            <span className="font-black text-gray-900">{selectedBooking.checkInTime}</span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-50">
                                            <p className="text-xs font-black text-gray-400 uppercase mb-2">Yêu cầu đặc biệt:</p>
                                            <p className="text-sm font-medium text-gray-700 italic bg-blue-50/50 p-3 rounded-xl border border-blue-100/30">
                                                {selectedBooking.specialRequests || "Không có yêu cầu đặc biệt."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">payments</span>
                                        Chi tiết thanh toán
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-gray-500">Giá tạm tính:</span>
                                            <span className="font-black text-gray-900">{new Intl.NumberFormat('vi-VN').format(selectedBooking.totalAmount)}₫</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-gray-500">Giảm giá:</span>
                                            <span className="font-black text-green-600">-{new Intl.NumberFormat('vi-VN').format(selectedBooking.discountAmount)}₫</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                            <span className="font-bold text-gray-500">Số tiền đã cọc/trả:</span>
                                            <span className="font-black text-blue-600">
                                                {new Intl.NumberFormat('vi-VN').format(
                                                    selectedBooking.paidAmount || 
                                                    (selectedBooking.paymentStatus === 'paid' ? selectedBooking.finalAmount : 
                                                     selectedBooking.paymentStatus === 'deposited' ? selectedBooking.finalAmount * 0.3 : 0)
                                                )}₫
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-gray-500">Số tiền còn lại:</span>
                                            <span className="font-black text-red-500">
                                                {new Intl.NumberFormat('vi-VN').format(
                                                    Math.max(0, selectedBooking.finalAmount - (
                                                        selectedBooking.paidAmount || 
                                                        (selectedBooking.paymentStatus === 'paid' ? selectedBooking.finalAmount : 
                                                         selectedBooking.paymentStatus === 'deposited' ? selectedBooking.finalAmount * 0.3 : 0)
                                                    ))
                                                )}₫
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-gray-100 bg-gray-50 -mx-4 px-4 py-2">
                                            <span className="font-black text-gray-900 uppercase text-xs">Tổng đơn hàng:</span>
                                            <span className="text-xl font-black text-[#003580]">{new Intl.NumberFormat('vi-VN').format(selectedBooking.finalAmount)}₫</span>
                                        </div>
                                        <div className="mt-2 text-right">
                                            {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer Action */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsDetailOpen(false)}
                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-100 transition"
                            >
                                Đóng lại
                            </button>
                            
                            {/* Nút hủy đơn: Chỉ hiện nếu < 6 tiếng từ lúc đặt và trạng thái chưa hoàn thành/hủy */}
                            {['pending', 'confirmed'].includes(selectedBooking.status) && 
                             (new Date().getTime() - new Date(selectedBooking.createdAt).getTime()) <= (6 * 60 * 60 * 1000) && (
                                <button 
                                    onClick={() => handleCancelBooking(selectedBooking._id)}
                                    className="px-6 py-2.5 bg-rose-500 text-white font-black text-sm rounded-xl hover:bg-rose-600 transition shadow-lg shadow-rose-200"
                                >
                                    Hủy đơn & Hoàn tiền
                                </button>
                            )}

                            {selectedBooking.status === 'confirmed' && (
                                <button 
                                    className="px-6 py-2.5 bg-[#006ce4] text-white font-black text-sm rounded-xl hover:bg-[#0057b8] transition"
                                >
                                    Liên hệ hỗ trợ
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBookings;
