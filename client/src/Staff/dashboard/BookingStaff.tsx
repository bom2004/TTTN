import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse } from '../../types';

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
    userId: {
        _id: string;
        full_name: string;
        email: string;
    };
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

const BookingStaff: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            // In a real app, we might want a specific admin/staff endpoint that populates everything
            // For now, let's use the getAllBookings and then fetch details for each if needed, 
            // but let's see if getAllBookings is already good enough.
            const response = await axios.get<ApiResponse<Booking[]>>(`${backendUrl}/api/bookings`);
            if (response.data.success && response.data.data) {
                // Enrich each booking with its details
                const enriched = await Promise.all(response.data.data.map(async (b) => {
                    try {
                        const detailRes = await axios.get<ApiResponse<any>>(`${backendUrl}/api/bookings/${b._id}`);
                        return detailRes.data.success ? detailRes.data.data : b;
                    } catch (err) {
                        return b;
                    }
                }));
                setBookings(enriched);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách đặt phòng");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string, newPaymentStatus?: string) => {
        setIsUpdating(true);
        try {
            const response = await axios.put(`${backendUrl}/api/bookings/${id}/status`, {
                status: newStatus,
                paymentStatus: newPaymentStatus || selectedBooking?.paymentStatus
            });
            if (response.data.success) {
                toast.success("Cập nhật trạng thái thành công");
                fetchBookings();
                setIsDetailOpen(false);
            }
        } catch (error) {
            toast.error("Lỗi khi cập nhật trạng thái");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteBooking = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn XÓA VĨNH VIỄN đơn đặt phòng này không? Hành động này không thể hoàn tác!")) {
            return;
        }
        setIsUpdating(true);
        try {
            const response = await axios.delete(`${backendUrl}/api/bookings/${id}`);
            if (response.data.success) {
                toast.success("Xóa đơn đặt phòng thành công");
                fetchBookings();
                setIsDetailOpen(false);
            }
        } catch (error) {
            toast.error("Lỗi khi xóa đơn đặt phòng");
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'checked_in': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'checked_out': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getPaymentStatusStyle = (status: string) => {
        switch (status) {
            case 'unpaid': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'deposited': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch = 
            b._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.customerInfo.phone.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8 bg-[#f8fafc] min-h-screen font-sans">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-[#003580] tracking-tight mb-2">Quản lý Đặt phòng</h1>
                    <p className="text-slate-500 font-medium">Theo dõi, xác nhận và cập nhật trạng thái đặt phòng của khách hàng.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchBookings}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                        <span className="text-sm font-bold">Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Filters & Tools */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-6 items-center">
                <div className="relative flex-1 w-full">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                        type="text"
                        placeholder="Tìm theo Mã đơn, Tên khách hoặc SĐT..."
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-100 focus:bg-white outline-none transition-all font-bold text-slate-900"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all
                                ${statusFilter === status 
                                    ? 'bg-[#003580] text-white shadow-xl shadow-blue-900/10' 
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                }`}
                        >
                            {status === 'all' ? 'Tất cả' : 
                             status === 'pending' ? 'Chờ duyệt' : 
                             status === 'confirmed' ? 'Xác nhận' : 
                             status === 'checked_in' ? 'Đã Check-in' :
                             status === 'checked_out' ? 'Đã Check-out' :
                             status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bookings List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40">
                    <div className="w-16 h-16 border-8 border-blue-100 border-t-[#003580] rounded-full animate-spin mb-6"></div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Đang tải dữ liệu...</p>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="bg-white rounded-[40px] p-24 text-center border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-slate-300 text-5xl">event_busy</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Không tìm thấy đơn đặt phòng</h3>
                    <p className="text-slate-400 font-medium">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {/* PC View: Table-like structure */}
                    <div className="hidden lg:grid grid-cols-7 gap-4 px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <div className="col-span-2">Khách hàng & Đơn hàng</div>
                        <div>Ngày nhận/trả</div>
                        <div>Tổng tiền</div>
                        <div>PTTT</div>
                        <div>Trạng thái</div>
                        <div className="text-right">Thao tác</div>
                    </div>

                    {filteredBookings.map((booking) => (
                        <div key={booking._id} className="bg-white rounded-[32px] p-6 border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group relative overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-center relative z-10">
                                {/* Customer & ID */}
                                <div className="col-span-2 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-[#003580] group-hover:bg-[#003580] group-hover:text-white transition-all">
                                        <span className="material-symbols-outlined text-[28px]">account_circle</span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 leading-tight mb-1">{booking.customerInfo.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{booking._id.slice(-8).toUpperCase()}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                            <span className="text-[10px] font-bold text-[#006ce4]">{booking.customerInfo.phone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="text-sm">
                                    <p className="font-black text-slate-700">{new Date(booking.checkInDate).toLocaleDateString('vi-VN')}</p>
                                    <span className="material-symbols-outlined text-slate-300 text-[16px] transform rotate-90 my-0.5">height</span>
                                    <p className="font-black text-slate-700">{new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}</p>
                                </div>

                                {/* Price */}
                                <div className="lg:text-center">
                                    <p className="text-lg font-black text-[#003580] mb-1">{new Intl.NumberFormat('vi-VN').format(booking.finalAmount)}₫</p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${getPaymentStatusStyle(booking.paymentStatus)}`}>
                                        {booking.paymentStatus === 'paid' ? 'Đã trả' : booking.paymentStatus === 'deposited' ? 'Đã cọc' : 'Chưa trả'}
                                    </span>
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-[18px]">payments</span>
                                        <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{booking.paymentMethod === 'wallet' ? 'Ví QuickStay' : booking.paymentMethod}</span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(booking.status)}`}>
                                        {booking.status === 'pending' ? 'Chờ duyệt' : 
                                         booking.status === 'confirmed' ? 'Đã xác nhận' : 
                                         booking.status === 'checked_in' ? 'Đã Check-in' :
                                         booking.status === 'checked_out' ? 'Đã Check-out' :
                                         booking.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                                    </span>
                                </div>

                                {/* Action */}
                                <div className="text-right">
                                    <button 
                                        onClick={() => {
                                            setSelectedBooking(booking);
                                            setIsDetailOpen(true);
                                        }}
                                        className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-[#003580] hover:text-white transition-all shrink-0"
                                    >
                                        <span className="material-symbols-outlined font-black">visibility</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* DETAIL MODAL */}
            {isDetailOpen && selectedBooking && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-8">
                    <div className="absolute inset-0 bg-[#003580]/60 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)}></div>
                    <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200 border border-white/20">
                        {/* Modal Header */}
                        <div className="bg-[#003580] p-8 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                    <span className="material-symbols-outlined text-4xl">receipt_long</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">Chi tiết đơn đặt phòng</h2>
                                    <div className="flex items-center gap-3 mt-1 opacity-70">
                                        <p className="text-xs font-black uppercase tracking-[0.2em]">#{selectedBooking._id.slice(-8).toUpperCase()}</p>
                                        <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                                        <p className="text-xs font-bold">{new Date(selectedBooking.createdAt).toLocaleString('vi-VN')}</p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsDetailOpen(false)}
                                className="w-12 h-12 rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center border border-white/10"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 no-scrollbar scroll-smooth">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Left Side: Details */}
                                <div className="space-y-10">
                                    {/* Customer Info */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#003580]">
                                                <span className="material-symbols-outlined text-[18px]">person</span>
                                            </div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">Thông tin khách hàng</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Họ và tên</p>
                                                <p className="font-black text-slate-900 text-sm leading-tight">{selectedBooking.customerInfo.name}</p>
                                            </div>
                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Số điện thoại</p>
                                                <p className="font-black text-slate-900 text-sm leading-tight">{selectedBooking.customerInfo.phone}</p>
                                            </div>
                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 col-span-2 transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Email Address</p>
                                                <p className="font-black text-slate-900 text-sm leading-tight">{selectedBooking.customerInfo.email}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Room Detail */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#003580]">
                                                <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                                            </div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">Phòng và thời lưu trú</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {selectedBooking.details?.map((detail, idx) => (
                                                <div key={idx} className="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                                                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-sm border border-white">
                                                        <img src={detail.roomId?.thumbnail || (detail.roomId as any)?.avatar || ''} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h5 className="font-black text-slate-900 truncate pr-4">{detail.roomId?.name}</h5>
                                                            <span className="text-xs font-black text-[#006ce4] leading-none">{new Intl.NumberFormat('vi-VN').format(detail.price)}₫</span>
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-2">{detail.roomId?.roomType}</p>
                                                        <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Phòng #{idx + 1}</span>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="grid grid-cols-2 gap-4 mt-6">
                                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/30">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-blue-500 text-[18px]">login</span>
                                                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Check-In</p>
                                                    </div>
                                                    <p className="font-black text-slate-900">{new Date(selectedBooking.checkInDate).toLocaleDateString('vi-VN')}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 italic">Dự kiến: {selectedBooking.checkInTime}</p>
                                                </div>
                                                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/30">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-amber-500 text-[18px]">logout</span>
                                                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Check-Out</p>
                                                    </div>
                                                    <p className="font-black text-slate-900">{new Date(selectedBooking.checkOutDate).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Right Side: Summary and Actions */}
                                <div className="space-y-10">
                                    {/* Payment Section */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#003580]">
                                                <span className="material-symbols-outlined text-[18px]">payments</span>
                                            </div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">Thanh toán & Yêu cầu</h3>
                                        </div>
                                        <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-bold text-slate-500">Giá phòng (gốc):</span>
                                                    <span className="font-black text-slate-900">{new Intl.NumberFormat('vi-VN').format(selectedBooking.totalAmount)}₫</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-bold text-slate-500">Mã giảm giá ({selectedBooking.promotionCode || 'N/A'}):</span>
                                                    <span className="font-black text-emerald-600">-{new Intl.NumberFormat('vi-VN').format(selectedBooking.discountAmount)}₫</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                                                    <span className="text-lg font-black text-slate-900">Tổng cộng:</span>
                                                    <span className="text-2xl font-black text-[#003580]">{new Intl.NumberFormat('vi-VN').format(selectedBooking.finalAmount)}₫</span>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-6 border-t border-slate-200 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-black text-slate-400 uppercase">Hình thức thanh toán:</span>
                                                    <span className="text-xs font-black text-[#003580] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                                                        {selectedBooking.paymentMethod}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-black text-slate-400 uppercase">Đã thanh toán:</span>
                                                    <p className="text-sm font-black text-emerald-600">
                                                        {new Intl.NumberFormat('vi-VN').format(selectedBooking.paidAmount || (selectedBooking.paymentStatus === 'paid' ? selectedBooking.finalAmount : selectedBooking.finalAmount * 0.3))}₫
                                                    </p>
                                                </div>
                                                <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100">
                                                    <span className="text-xs font-black text-rose-500 uppercase">Cần thu thêm:</span>
                                                    <p className="text-xl font-black text-rose-600">
                                                        {new Intl.NumberFormat('vi-VN').format(Math.max(0, selectedBooking.finalAmount - (selectedBooking.paidAmount || (selectedBooking.paymentStatus === 'paid' ? selectedBooking.finalAmount : selectedBooking.finalAmount * 0.3))))}₫
                                                    </p>
                                                </div>
                                            </div>

                                            {selectedBooking.specialRequests && (
                                                <div className="bg-white/50 p-5 rounded-2xl border border-slate-200/50 mt-6">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Yêu cầu đặc biệt</p>
                                                    <p className="text-sm text-slate-600 italic leading-relaxed">"{selectedBooking.specialRequests}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Action Area */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#003580]">
                                                <span className="material-symbols-outlined text-[18px]">verified</span>
                                            </div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">Cập nhật trạng thái</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedBooking.status === 'pending' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(selectedBooking._id, 'confirmed')}
                                                        disabled={isUpdating}
                                                        className="col-span-2 bg-[#006ce4] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                                                    >
                                                        {isUpdating ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Xác nhận Đơn đặt (Confirm)'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(selectedBooking._id, 'cancelled')}
                                                        disabled={isUpdating}
                                                        className="bg-rose-50 text-rose-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition border border-rose-100"
                                                    >
                                                        Hủy đơn hàng
                                                    </button>
                                                </>
                                            )}
                                            
                                            {selectedBooking.status === 'confirmed' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(selectedBooking._id, 'checked_in')}
                                                        disabled={isUpdating}
                                                        className="col-span-2 bg-[#003580] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-900 transition shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3"
                                                    >
                                                        Thực hiện Check-in
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(selectedBooking._id, 'cancelled')}
                                                        disabled={isUpdating}
                                                        className="bg-rose-50 text-rose-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition border border-rose-100"
                                                    >
                                                        Hủy đơn
                                                    </button>
                                                </>
                                            )}

                                            {selectedBooking.status === 'checked_in' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedBooking._id, 'completed', 'paid')}
                                                    disabled={isUpdating}
                                                    className="col-span-2 bg-[#003580] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-900 transition shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                                                >
                                                    {isUpdating ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Thực hiện Check-out & Hoàn tất'}
                                                </button>
                                            )}

                                            {selectedBooking.status === 'completed' && (
                                                <div className="col-span-2 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center gap-3">
                                                    <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                                                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Đơn hàng đã hoàn thành - Phòng đã mở</span>
                                                </div>
                                            )}

                                            {selectedBooking.status === 'cancelled' && (
                                                <div className="col-span-2 p-5 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-center gap-3">
                                                    <span className="material-symbols-outlined text-rose-600">cancel</span>
                                                    <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Đơn hàng đã bị hủy</span>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center gap-3 shrink-0">
                            <button 
                                onClick={() => handleDeleteBooking(selectedBooking._id)}
                                disabled={isUpdating}
                                className="px-6 py-3.5 bg-rose-50 text-rose-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-rose-100 transition border border-rose-100 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                Xóa vĩnh viễn
                            </button>
                            <button 
                                onClick={() => setIsDetailOpen(false)}
                                className="px-8 py-3.5 bg-white border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition"
                            >
                                Đóng lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingStaff;
