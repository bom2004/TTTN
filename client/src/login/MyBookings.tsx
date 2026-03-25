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
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 3;

    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, searchTerm]);

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
                setIsDetailOpen(false);
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi hủy đơn hàng");
        }
    };

    const handleContactSupport = (booking: Booking) => {
        const supportMessage = `Xin chào, tôi cần hỗ trợ về đơn đặt phòng #${booking._id.slice(-8).toUpperCase()}. Mã phòng: ${booking.details?.[0]?.roomId?.name || 'N/A'}`;
        window.open(`https://zalo.me/your-support-phone?text=${encodeURIComponent(supportMessage)}`, '_blank');
    };

    const handleViewInvoice = (booking: Booking) => {
        navigate(`/invoice/${booking._id}`);
    };

    const getStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            'pending': 'bg-amber-100 text-amber-800 border-amber-200',
            'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
            'checked_in': 'bg-cyan-100 text-cyan-800 border-cyan-200',
            'checked_out': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
            'cancelled': 'bg-rose-100 text-rose-800 border-rose-200',
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
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            'unpaid': 'bg-gray-100 text-gray-700',
            'paid': 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
            'deposited': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
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

    const getTotalNights = (checkIn: string, checkOut: string) => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            'all': 'Tất cả đơn hàng',
            'pending': 'Chờ xác nhận',
            'confirmed': 'Đã xác nhận',
            'checked_in': 'Đã nhận phòng',
            'checked_out': 'Đã trả phòng',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy',
        };
        return labels[status] || 'Tất cả';
    };

    const statusOptions = [
        { value: 'all', label: 'Tất cả đơn hàng', icon: 'list', color: 'text-blue-600' },
        { value: 'pending', label: 'Chờ xác nhận', icon: 'schedule', color: 'text-amber-600' },
        { value: 'confirmed', label: 'Đã xác nhận', icon: 'check_circle', color: 'text-blue-600' },
        { value: 'checked_in', label: 'Đã nhận phòng', icon: 'meeting_room', color: 'text-cyan-600' },
        { value: 'checked_out', label: 'Đã trả phòng', icon: 'logout', color: 'text-indigo-600' },
        { value: 'completed', label: 'Hoàn thành', icon: 'done_all', color: 'text-emerald-600' },
        { value: 'cancelled', label: 'Đã hủy', icon: 'cancel', color: 'text-rose-600' },
    ];

    const filteredBookings = bookings.filter(booking => {
        const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
        const matchesSearch = searchTerm === '' ||
            booking._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.details?.[0]?.roomId?.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-blue-600/70">Đang tải danh sách đặt chỗ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 py-12 px-4">
            {/* Animated Wave Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-blue-200/30 to-transparent"></div>
                <svg className="absolute bottom-0 left-0 w-full h-48" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="rgba(59, 130, 246, 0.1)" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-cyan-700 bg-clip-text text-transparent tracking-tight mb-2">
                        Đặt chỗ của tôi
                    </h1>
                    <p className="text-blue-500/80 font-medium">Xem lại lịch sử và trạng thái các đơn đặt phòng của bạn</p>
                </header>

                {/* Search and Filter Section */}
                <div className="mb-8 flex flex-col md:flex-row gap-4">
                    {/* Search Bar - Extended */}
                    <div className="flex-1 relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 text-2xl">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mã đơn, tên khách hàng, email, tên phòng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-5 py-4 bg-white/90 backdrop-blur-sm border-2 border-blue-100 rounded-2xl focus:border-blue-400 focus:ring-4 focus:ring-blue-200 transition-all outline-none text-slate-700 placeholder:text-slate-400 text-base shadow-lg"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="px-6 py-4 bg-white/90 backdrop-blur-sm border-2 border-blue-100 rounded-2xl hover:border-blue-400 transition-all shadow-lg flex items-center gap-3 min-w-[200px] justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-500">
                                    {statusOptions.find(opt => opt.value === filterStatus)?.icon || 'filter_list'}
                                </span>
                                <span className="font-semibold text-slate-700">
                                    {getStatusLabel(filterStatus)}
                                </span>
                            </div>
                            <span className="material-symbols-outlined text-blue-400">
                                {isDropdownOpen ? 'expand_less' : 'expand_more'}
                            </span>
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsDropdownOpen(false)}
                                ></div>
                                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-blue-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {statusOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setFilterStatus(option.value);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full px-4 py-3 flex items-center gap-3 transition-all hover:bg-blue-50 group ${filterStatus === option.value ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                                }`}
                                        >
                                            <span className={`material-symbols-outlined ${option.color} text-xl`}>
                                                {option.icon}
                                            </span>
                                            <span className={`flex-1 text-left font-medium ${filterStatus === option.value ? 'text-blue-700 font-semibold' : 'text-slate-600'
                                                }`}>
                                                {option.label}
                                            </span>
                                            {filterStatus === option.value && (
                                                <span className="material-symbols-outlined text-blue-500 text-sm">check</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Statistics Summary */}
                {bookings.length > 0 && (
                    <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-100 text-center shadow-sm">
                            <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng đơn</p>
                        </div>
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-100 text-center shadow-sm">
                            <p className="text-2xl font-bold text-emerald-600">
                                {bookings.filter(b => b.status === 'completed').length}
                            </p>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hoàn thành</p>
                        </div>
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-100 text-center shadow-sm">
                            <p className="text-2xl font-bold text-amber-600">
                                {bookings.filter(b => b.status === 'pending').length}
                            </p>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang chờ</p>
                        </div>
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-100 text-center shadow-sm">
                            <p className="text-xl font-bold text-slate-700">
                                {new Intl.NumberFormat('vi-VN').format(
                                    bookings.reduce((sum, b) => sum + b.finalAmount, 0)
                                )}₫
                            </p>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng chi tiêu</p>
                        </div>
                    </div>
                )}

                {filteredBookings.length === 0 ? (
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-16 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-blue-400 text-5xl">search_off</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Không tìm thấy đơn đặt phòng</h3>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                            {searchTerm || filterStatus !== 'all'
                                ? 'Không có đơn đặt phòng nào phù hợp với bộ lọc của bạn.'
                                : 'Bạn chưa thực hiện đặt phòng nào trên QuickStay.'}
                        </p>
                        {(searchTerm || filterStatus !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterStatus('all');
                                }}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {paginatedBookings.map((booking) => (
                            <div key={booking._id} className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg shadow-blue-200/50 border border-blue-100 hover:shadow-xl hover:shadow-blue-300/30 transition-all group">
                                <div className="flex flex-col lg:flex-row">
                                    {/* Room Thumbnail */}
                                    <div className="lg:w-72 h-56 lg:h-auto overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100 relative">
                                        {(booking.details && booking.details[0]?.roomId?.thumbnail) || (booking.details && (booking.details[0]?.roomId as any)?.avatar) ? (
                                            <img
                                                src={booking.details[0].roomId.thumbnail || (booking.details[0].roomId as any).avatar}
                                                alt="Room"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-blue-300 text-5xl">image</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            {getStatusBadge(booking.status)}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent"></div>
                                        <div className="absolute bottom-4 left-4 text-white">
                                            <p className="text-xs font-semibold">
                                                {getTotalNights(booking.checkInDate, booking.checkOutDate)} ngày
                                            </p>
                                        </div>
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-1 p-6 md:p-8">
                                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                                        {(booking.details && booking.details[0]?.roomId?.thumbnail) || (booking.details && (booking.details[0]?.roomId as any)?.avatar) ? (
                                                            <img
                                                                src={booking.details![0].roomId.thumbnail || (booking.details![0].roomId as any).avatar}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-white text-xl">bed</span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-800 leading-tight">
                                                        {booking.details && booking.details[0]?.roomId?.name ? booking.details[0].roomId.name : 'Thông tin phòng đang cập nhật'}
                                                        {booking.details && booking.details.length > 1 && (
                                                            <span className="text-blue-500 ml-2 text-sm"> (+{booking.details.length - 1} phòng)</span>
                                                        )}
                                                    </h3>
                                                </div>
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    Mã đơn: <span className="text-slate-700">{booking._id.slice(-8).toUpperCase()}</span>
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Đặt ngày: {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Thanh toán</p>
                                                <p className="text-2xl font-bold text-slate-800">
                                                    {new Intl.NumberFormat('vi-VN').format(booking.finalAmount)}₫
                                                </p>
                                                <div className="flex flex-col items-end gap-1 mt-2">
                                                    {getPaymentStatusBadge(booking.paymentStatus)}
                                                    {booking.paymentStatus === 'deposited' && (
                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                            Còn lại: {new Intl.NumberFormat('vi-VN').format(booking.finalAmount - (booking.paidAmount || (booking.finalAmount * 0.3)))}₫
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-xl p-5 border border-blue-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm">
                                                    <span className="material-symbols-outlined text-lg">calendar_today</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Nhận phòng</p>
                                                    <p className="text-sm font-bold text-slate-700">{new Date(booking.checkInDate).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm">
                                                    <span className="material-symbols-outlined text-lg">logout</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Trả phòng</p>
                                                    <p className="text-sm font-bold text-slate-700">{new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm">
                                                    <span className="material-symbols-outlined text-lg">schedule</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Giờ nhận</p>
                                                    <p className="text-sm font-bold text-slate-700">{booking.checkInTime || '14:00'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-slate-400 text-lg">payments</span>
                                                    <p className="text-xs font-semibold text-slate-600">
                                                        PTTT: <span className="text-slate-700 capitalize">{booking.paymentMethod === 'wallet' ? 'Ví QuickStay' : booking.paymentMethod}</span>
                                                    </p>
                                                </div>
                                                {booking.promotionCode && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-emerald-500 text-lg">loyalty</span>
                                                        <p className="text-xs font-semibold text-emerald-600">
                                                            Mã: <span className="font-black uppercase">{booking.promotionCode}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleViewInvoice(booking)}
                                                    className="text-sm font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
                                                >
                                                    <span className="material-symbols-outlined text-base">receipt</span>
                                                    Hóa đơn
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setIsDetailOpen(true);
                                                    }}
                                                    className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group/btn transition-colors"
                                                >
                                                    Xem chi tiết
                                                    <span className="material-symbols-outlined text-base group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl bg-white border border-blue-100 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                </button>
                                
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center ${
                                                currentPage === page 
                                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-200' 
                                                    : 'bg-white border border-blue-100 text-slate-600 hover:bg-blue-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl bg-white border border-blue-100 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>
                        )}
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
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">Chi tiết đơn đặt phòng</h2>
                                <p className="text-xs text-blue-100 font-semibold uppercase tracking-wider mt-1">Mã đơn: #{selectedBooking._id.slice(-8).toUpperCase()}</p>
                            </div>
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="w-10 h-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            {/* Khách hàng */}
                            <section className="mb-8">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                    Thông tin khách hàng
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Họ và tên</p>
                                        <p className="text-sm font-bold text-slate-700">{selectedBooking.customerInfo.name}</p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Số điện thoại</p>
                                        <p className="text-sm font-bold text-slate-700">{selectedBooking.customerInfo.phone}</p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 md:col-span-2">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Địa chỉ Email</p>
                                        <p className="text-sm font-bold text-slate-700">{selectedBooking.customerInfo.email}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Phòng đặt */}
                            <section className="mb-8">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">bed</span>
                                    Thông tin phòng
                                </h3>
                                <div className="space-y-3">
                                    {selectedBooking.details?.map((detail, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-200 to-cyan-200 shrink-0">
                                                <img src={detail.roomId?.thumbnail || ''} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-700">{detail.roomId?.name || 'Phòng không tên'}</p>
                                                <p className="text-xs font-semibold text-slate-500">{detail.roomId?.roomType || 'N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-700">{new Intl.NumberFormat('vi-VN').format(detail.price)}₫</p>
                                                <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">/ ngày</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Thời gian & Yêu cầu */}
                            <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        Thời gian & Yêu cầu
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-slate-600">Ngày nhận phòng:</span>
                                            <span className="font-bold text-slate-700">{new Date(selectedBooking.checkInDate).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-slate-600">Ngày trả phòng:</span>
                                            <span className="font-bold text-slate-700">{new Date(selectedBooking.checkOutDate).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-slate-600">Số ngày:</span>
                                            <span className="font-bold text-slate-700">{getTotalNights(selectedBooking.checkInDate, selectedBooking.checkOutDate)} ngày</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-slate-600">Giờ nhận dự kiến:</span>
                                            <span className="font-bold text-slate-700">{selectedBooking.checkInTime || '14:00'}</span>
                                        </div>
                                        <div className="pt-3">
                                            <p className="text-xs font-bold text-slate-600 uppercase mb-2">Yêu cầu đặc biệt:</p>
                                            <p className="text-sm font-medium text-slate-600 bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-xl border border-blue-100">
                                                {selectedBooking.specialRequests || "Không có yêu cầu đặc biệt."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">payments</span>
                                        Chi tiết thanh toán
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-slate-600">Giá phòng/ngày:</span>
                                            <span className="font-bold text-slate-700">
                                                {selectedBooking.details && selectedBooking.details[0]
                                                    ? new Intl.NumberFormat('vi-VN').format(selectedBooking.details[0].price)
                                                    : '0'}₫
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-slate-600">Số ngày:</span>
                                            <span className="font-bold text-slate-700">{getTotalNights(selectedBooking.checkInDate, selectedBooking.checkOutDate)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-slate-600">Tổng tiền phòng:</span>
                                            <span className="font-bold text-slate-700">{new Intl.NumberFormat('vi-VN').format(selectedBooking.totalAmount)}₫</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-slate-600">Giảm giá:</span>
                                            <span className="font-bold text-emerald-600">-{new Intl.NumberFormat('vi-VN').format(selectedBooking.discountAmount)}₫</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-blue-100">
                                            <span className="font-semibold text-slate-600">Đã thanh toán:</span>
                                            <span className="font-bold text-slate-700">
                                                {new Intl.NumberFormat('vi-VN').format(
                                                    selectedBooking.paidAmount ||
                                                    (selectedBooking.paymentStatus === 'paid' ? selectedBooking.finalAmount :
                                                        selectedBooking.paymentStatus === 'deposited' ? selectedBooking.finalAmount * 0.3 : 0)
                                                )}₫
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-slate-600">Còn lại:</span>
                                            <span className="font-bold text-rose-600">
                                                {new Intl.NumberFormat('vi-VN').format(
                                                    Math.max(0, selectedBooking.finalAmount - (
                                                        selectedBooking.paidAmount ||
                                                        (selectedBooking.paymentStatus === 'paid' ? selectedBooking.finalAmount :
                                                            selectedBooking.paymentStatus === 'deposited' ? selectedBooking.finalAmount * 0.3 : 0)
                                                    ))
                                                )}₫
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 -mx-4 px-4 py-3 rounded-lg">
                                            <span className="font-bold text-slate-700 uppercase text-xs">Tổng đơn hàng:</span>
                                            <span className="text-xl font-bold text-slate-800">
                                                {new Intl.NumberFormat('vi-VN').format(selectedBooking.finalAmount)}₫
                                            </span>
                                        </div>
                                        <div className="mt-2 text-right">
                                            {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer Action */}
                        <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-t border-blue-100 flex justify-end gap-3">
                            <button
                                onClick={() => handleViewInvoice(selectedBooking)}
                                className="px-6 py-2.5 bg-white border border-blue-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-blue-50 transition flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">receipt</span>
                                Xem hóa đơn
                            </button>
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="px-6 py-2.5 bg-white border border-blue-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-blue-50 transition"
                            >
                                Đóng lại
                            </button>

                            {['pending', 'confirmed'].includes(selectedBooking.status) &&
                                (new Date().getTime() - new Date(selectedBooking.createdAt).getTime()) <= (6 * 60 * 60 * 1000) && (
                                    <button
                                        onClick={() => handleCancelBooking(selectedBooking._id)}
                                        className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-sm rounded-xl hover:from-rose-600 hover:to-rose-700 transition shadow-lg shadow-rose-200"
                                    >
                                        Hủy đơn & Hoàn tiền
                                    </button>
                                )}

                            {selectedBooking.status === 'confirmed' && (
                                <button
                                    onClick={() => handleContactSupport(selectedBooking)}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:to-cyan-700 transition shadow-lg shadow-blue-200"
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