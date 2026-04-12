import React, { useEffect, useState } from 'react';
import { exportInvoice } from '../../../utils/exportInvoice';
import { exportBookingsToExcel } from '../../../utils/exportExcel';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../../lib/redux/store';
import {
    fetchAllBookingsThunk,
    updateBookingStatusThunk,
    deleteBookingThunk,
    selectAllBookings,
    selectBookingLoading,
    selectBookingUpdating
} from '../../../lib/redux/reducers/booking';
import { fetchAllRoomsThunk } from '../../../lib/redux/reducers/room';
import { fetchAllRoomTypesThunk, selectAllRoomTypes } from '../../../lib/redux/reducers/room-type';
import { fetchAllUsersThunk, selectAllUsers } from '../../../lib/redux/reducers/user';
import { selectIsAdmin } from '../../../lib/redux/reducers/auth/selectors';
import axiosInstance from '../../../lib/redux/api/axiosInstance';
import CreateBooking from './Createbooking';
import BookingDetails from './Bookingdetails';
import AssignRoomModal from './AssignRoomModal';
import Pagination from '../../../admin/components/Pagination';

const BookingStaff: React.FC = () => {
    const dispatch = useAppDispatch();
    const bookings = useAppSelector(selectAllBookings) as any[];
    const isAdmin = useAppSelector(selectIsAdmin);
    const loading = useAppSelector(selectBookingLoading);
    const isUpdating = useAppSelector(selectBookingUpdating);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const selectedBooking = bookings.find(b => b._id === selectedBookingId) || null;
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
    const [allRooms, setAllRooms] = useState<any[]>([]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [roomTypeFilter, setRoomTypeFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 10;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const roomTypes = useAppSelector(selectAllRoomTypes);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            await dispatch(fetchAllBookingsThunk()).unwrap();
            const roomsRes = await dispatch(fetchAllRoomsThunk()).unwrap();
            if (Array.isArray(roomsRes)) setAllRooms(roomsRes);
            dispatch(fetchAllRoomTypesThunk());
            dispatch(fetchAllUsersThunk());
        } catch (error: any) {
            toast.error(error || "Không thể tải danh sách đặt phòng");
        }
    };

    const getAvailableRoomsForBooking = (booking: any, roomList: any[], bookingList: any[]) => {
        if (!booking) return [];

        const overlappingBookings = bookingList.filter(b => {
            if (b._id === booking._id) return false;
            if (['cancelled', 'pending', 'completed', 'checked_out'].includes(b.status)) return false;

            const bIn = new Date(b.checkInDate).getTime();
            const bOut = new Date(b.checkOutDate).getTime();
            const tIn = new Date(booking.checkInDate).getTime();
            const tOut = new Date(booking.checkOutDate).getTime();

            return bIn < tOut && bOut > tIn;
        });

        const assignedRoomIds = new Set<string>();
        overlappingBookings.forEach(b => {
            if (b.assignedRooms && b.assignedRooms.length > 0) {
                b.assignedRooms.forEach((rId: any) => assignedRoomIds.add(String(rId)));
            } else if (b.details && b.details.length > 0) {
                b.details.forEach((d: any) => {
                    if (d.roomId) assignedRoomIds.add(String(d.roomId._id || d.roomId));
                });
            }
        });

        const rtId = String(booking.roomTypeId?._id || booking.roomTypeId);
        return roomList.filter((r: any) => {
            const roomTypeMatch = String(r.roomTypeId?._id || r.roomTypeId) === rtId;
            // Chỉ loại bỏ nếu phòng đang bảo trì
            const isNotMaintenance = r.status !== 'maintenance';
            // Không được trùng với các đơn đặt phòng khác đã gán
            const isNotAssigned = !assignedRoomIds.has(String(r._id));
            
            return roomTypeMatch && isNotMaintenance && isNotAssigned;
        });
    };

    const handleAssignAndConfirm = async (bookingId: string, roomIds: string[]) => {
        try {
            const res = await axiosInstance.post(`/api/bookings/${bookingId}/assign-and-confirm`, { roomIds });
            if (!res.data.success) throw new Error(res.data.message);
            toast.success("Xác nhận gán phòng & Gửi email thành công!");
            setIsAssignModalOpen(false);
            setIsDetailOpen(false);
            fetchBookings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || "Lỗi khi gán phòng");
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string, newPaymentStatus?: string) => {
        try {
            await dispatch(updateBookingStatusThunk({
                id,
                status: newStatus as any,
                paymentStatus: (newPaymentStatus || selectedBooking?.paymentStatus) as any
            })).unwrap();
            toast.success("Cập nhật trạng thái thành công");
            setIsDetailOpen(false);
            fetchBookings();
        } catch (error: any) {
            toast.error(error || "Lỗi khi cập nhật trạng thái");
        }
    };

    const handleDeleteBooking = async (id: string) => {
        try {
            await dispatch(deleteBookingThunk(id)).unwrap();
            toast.success("Xóa đơn đặt phòng thành công");
            setIsDetailOpen(false);
            fetchBookings();
        } catch (error: any) {
            toast.error(error || "Lỗi khi xóa đơn đặt phòng");
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch =
            b._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.customerInfo.phone.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

        const bIn = new Date(b.checkInDate).setHours(0, 0, 0, 0);
        const bOut = new Date(b.checkOutDate).setHours(0, 0, 0, 0);
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null;

        const matchesStartDate = !start || bIn >= start;
        const matchesEndDate = !end || bOut <= end;

        const rtId = b.roomTypeId?._id || b.roomTypeId || b.roomTypeInfo?._id;
        const matchesRoomType = roomTypeFilter === 'all' || rtId === roomTypeFilter;

        return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate && matchesRoomType;
    });

    const paginatedBookings = filteredBookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending': return { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' };
            case 'confirmed': return { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' };
            case 'checked_in': return { label: 'Đã Nhận phòng', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', dot: 'bg-indigo-500' };
            case 'checked_out': return { label: 'Đã Trả phòng', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', dot: 'bg-purple-500' };
            case 'completed': return { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' };
            case 'cancelled': return { label: 'Đã hủy', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', dot: 'bg-rose-500' };
            default: return { label: status, color: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-400', dot: 'bg-gray-500' };
        }
    };

    const getPaymentStatusConfig = (status: string) => {
        switch (status) {
            case 'paid': return { label: 'Đã thanh toán', color: 'text-emerald-600 dark:text-emerald-400' };
            case 'deposited': return { label: 'Đã cọc', color: 'text-blue-600 dark:text-blue-400' };
            case 'unpaid': return { label: 'Chưa thanh toán', color: 'text-rose-600 dark:text-rose-400' };
            default: return { label: status, color: 'text-gray-600' };
        }
    };

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        active: bookings.filter(b => ['confirmed', 'checked_in'].includes(b.status)).length,
        completed: bookings.filter(b => b.status === 'completed').length,
    };

    return (
        <div className="p-8 bg-[#f5f7f9] dark:bg-slate-900 min-h-screen font-['Inter',sans-serif]">
            <div className="max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-[#2c2f31] dark:text-slate-100 leading-tight font-['Manrope',sans-serif]">Quản lý đặt phòng</h2>
                        <p className="text-[#595c5e] dark:text-slate-400 mt-1 font-medium">Theo dõi và xử lý các yêu cầu đặt phòng từ khách hàng.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => exportBookingsToExcel(filteredBookings, "Danh_sach_don_dat_phong")}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-[#2c2f31] dark:text-slate-200 font-bold rounded-xl border border-[#d9dde0] dark:border-slate-700 hover:bg-[#f5f7f9] dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-xl text-slate-500">file_download</span>
                            Xuất báo cáo
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white font-bold rounded-xl shadow-lg shadow-[#0050d4]/20 hover:scale-[1.02] transition-all"
                        >
                            <span className="material-symbols-outlined text-xl">add_circle</span>
                            Tạo đơn mới
                        </button>
                    </div>
                </div>

                {/* Stats Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Tổng số đơn', value: stats.total, icon: 'receipt_long', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
                        { label: 'Chờ duyệt', value: stats.pending, icon: 'pending_actions', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
                        { label: 'Đang hoạt động', value: stats.active, icon: 'analytics', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
                        { label: 'Hoàn thành', value: stats.completed, icon: 'task_alt', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100/50 dark:border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                                    <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{stat.value}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100/50 dark:border-slate-700 overflow-hidden">
                    {/* Toolbar (Matched EXACTLY with user.tsx) */}
                    <div className="p-6 border-b border-[#e5e9eb] dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Search Input */}
                        <div className="relative w-full md:max-w-md">
                            <input
                                type="text"
                                placeholder="Kiểm tra mã đơn, khách hàng, số điện thoại..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-11 pr-4 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0050d4] transition-all text-[#2c2f31] dark:text-slate-100 placeholder-[#abadaf]"
                            />
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-[20px]">search</span>
                        </div>

                        {/* Filters & Actions */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* Status Filter */}
                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                    className="w-full md:w-44 appearance-none pl-10 pr-10 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:ring-2 focus:ring-[#0050d4]/20 cursor-pointer transition-all"
                                >
                                    <option value="all">Trạng thái: Tất cả</option>
                                    <option value="pending">Chờ duyệt</option>
                                    <option value="confirmed">Đã xác nhận</option>
                                    <option value="checked_in">Đã nhận phòng</option>
                                    <option value="checked_out">Đã trả phòng</option>
                                    <option value="completed">Đã hoàn thành</option>
                                    <option value="cancelled">Đã hủy bỏ</option>
                                </select>
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">filter_list</span>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">expand_more</span>
                            </div>

                            {/* Room Type Filter */}
                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={roomTypeFilter}
                                    onChange={(e) => { setRoomTypeFilter(e.target.value); setCurrentPage(1); }}
                                    className="w-full md:w-44 appearance-none pl-10 pr-10 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:ring-2 focus:ring-[#0050d4]/20 cursor-pointer transition-all"
                                >
                                    <option value="all">Loại phòng: Tất cả</option>
                                    {roomTypes.map((rt: any) => (
                                        <option key={rt._id} value={rt._id}>{rt.name}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">bed</span>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">expand_more</span>
                            </div>

                            {/* Date Filter (Optimized for space) */}
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-xl px-2">
                                <input
                                    type="date"
                                    className="bg-transparent text-[11px] font-medium py-2 outline-none dark:text-slate-100"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                <span className="text-[#abadaf] text-xs">→</span>
                                <input
                                    type="date"
                                    className="bg-transparent text-[11px] font-medium py-2 outline-none dark:text-slate-100"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>

                            {/* Clear All Filters Button */}
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setRoomTypeFilter('all'); setStartDate(''); setEndDate(''); }}
                                title="Xóa tất cả lọc"
                                className="w-10 h-10 flex items-center justify-center border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400 hover:text-rose-600 transition-all shadow-sm active:scale-90"
                            >
                                <span className="material-symbols-outlined text-[20px]">filter_list_off</span>
                            </button>
                        </div>
                    </div>

                    {/* Table Section */}
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="animate-spin inline-block w-10 h-10 border-4 border-[#0050d4] border-t-transparent rounded-full mb-4"></div>
                            <p className="text-slate-400 font-medium">Đang tải danh sách đặt phòng...</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="py-20 text-center">
                            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">inbox</span>
                            <p className="text-slate-400 text-lg font-medium">Không tìm thấy đơn đặt phòng nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#eef1f3]/50 dark:bg-slate-900/50">
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Mã đơn</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Khách hàng</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Hạng phòng & Số phòng</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Thời gian lưu trú</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Thanh toán</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Trạng thái</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif] text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {paginatedBookings.map((booking) => {
                                        const status = getStatusConfig(booking.status);
                                        const payStatus = getPaymentStatusConfig(booking.paymentStatus);
                                        return (
                                            <tr key={booking._id} className="group hover:bg-[#f8fafb] dark:hover:bg-slate-900/30 transition-colors">
                                                <td className="px-6 py-5">
                                                    <span className="text-xs font-black text-[#595c5e] dark:text-slate-500 font-mono tracking-tighter">
                                                        #{booking._id.slice(-8).toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div>
                                                        <p className="font-bold text-[#2c2f31] dark:text-slate-100">{booking.customerInfo.name}</p>
                                                        <p className="text-xs text-[#747779] dark:text-slate-400 mt-0.5">{booking.customerInfo.phone}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                            {booking.roomTypeId?.name || booking.roomTypeInfo?.name || 'N/A'}
                                                        </span>
                                                        {booking.details?.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {booking.details.map((d: any, idx: number) => (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300">
                                                                        P.{d.roomId?.roomNumber}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <p className="text-sm font-bold text-[#2c2f31] dark:text-slate-100">
                                                            {new Date(booking.checkInDate).toLocaleDateString('vi-VN')}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#747779] dark:text-slate-500">
                                                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                                            {new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div>
                                                        <p className="font-black text-[#0050d4] dark:text-blue-400">
                                                            {new Intl.NumberFormat('vi-VN').format(booking.finalAmount + (booking.totalServiceAmount || 0))}₫
                                                        </p>
                                                        <span className={`text-[10px] font-bold uppercase tracking-tight ${payStatus.color}`}>
                                                            {payStatus.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${status.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button
                                                        onClick={() => { setSelectedBookingId(booking._id); setIsDetailOpen(true); }}
                                                        className="p-2 hover:bg-[#eef1f3] dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-[#0050d4] transition-all"
                                                        title="Xem chi tiết"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">visibility</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredBookings.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-between mt-10">
                            <p className="text-sm text-[#747779] dark:text-slate-400 font-medium">
                                Hiển thị <span className="font-bold text-[#2c2f31] dark:text-slate-100">{paginatedBookings.length}</span> trên <span className="font-bold text-[#2c2f31] dark:text-slate-100">{filteredBookings.length}</span> đơn đặt
                            </p>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredBookings.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals Container */}
            {isDetailOpen && selectedBooking && (
                <BookingDetails
                    booking={selectedBooking}
                    onClose={() => setIsDetailOpen(false)}
                    isAdmin={isAdmin}
                    roomTypes={roomTypes}
                    isUpdating={isUpdating}
                    handleUpdateStatus={handleUpdateStatus}
                    handleDeleteBooking={handleDeleteBooking}
                    handleExportInvoice={exportInvoice}
                    setSelectedRoomIds={setSelectedRoomIds}
                    setIsAssignModalOpen={setIsAssignModalOpen}
                    fetchBookings={fetchBookings}
                />
            )}
            
            {isAssignModalOpen && selectedBooking && (
                <AssignRoomModal
                    booking={selectedBooking}
                    onClose={() => setIsAssignModalOpen(false)}
                    getAvailableRoomsForBooking={getAvailableRoomsForBooking}
                    allRooms={allRooms}
                    bookings={bookings}
                    selectedRoomIds={selectedRoomIds}
                    setSelectedRoomIds={setSelectedRoomIds}
                    handleAssignAndConfirm={handleAssignAndConfirm}
                />
            )}

            <CreateBooking 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                roomTypes={roomTypes} 
                onSuccess={fetchBookings} 
            />
        </div>
    );
};

export default BookingStaff;