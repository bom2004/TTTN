import React, { useEffect, useState } from 'react';
import { exportInvoice } from '../../../utils/exportInvoice';
import { exportBookingToExcel, exportBookingsToExcel } from '../../../utils/exportExcel';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../../lib/redux/store';
import {
    fetchAllBookingsThunk,
    updateBookingStatusThunk,
    deleteBookingThunk,
    createBookingThunk,
    adminUpdateBookingThunk,
    addExtraPaymentThunk,
    selectAllBookings,
    selectBookingLoading,
    selectBookingUpdating
} from '../../../lib/redux/reducers/booking';
import { fetchAllRoomsThunk } from '../../../lib/redux/reducers/room';
import { fetchAllRoomTypesThunk, selectAllRoomTypes } from '../../../lib/redux/reducers/room-type';
import { fetchAllUsersThunk, selectAllUsers } from '../../../lib/redux/reducers/user';
import { selectIsAdmin, selectIsStaff } from '../../../lib/redux/reducers/auth/selectors';
import axiosInstance from '../../../lib/redux/api/axiosInstance';
import ConfirmModal from '../../../admin/components/ConfirmModal';
import CreateBooking from './Createbooking';
import BookingDetails from './Bookingdetails';
import AssignRoomModal from './AssignRoomModal';


const StatusBadge = ({
    status,
    type = 'order',
    getStatusStyle,
    getPaymentStatusStyle
}: {
    status: string;
    type?: 'order' | 'payment';
    getStatusStyle: (s: string) => string;
    getPaymentStatusStyle: (s: string) => string;
}) => {
    const style = type === 'order' ? getStatusStyle(status) : getPaymentStatusStyle(status);
    const label = type === 'order' ?
        (status === 'pending' ? 'Chờ duyệt' : status === 'confirmed' ? 'Xác nhận' : status === 'checked_in' ? 'Check-in' : status === 'checked_out' ? 'Check-out' : status === 'completed' ? 'Hoàn thành' : 'Hủy') :
        (status === 'paid' ? 'Đã thanh toán' : status === 'deposited' ? 'Đã cọc' : 'Chưa thanh toán');

    return <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${style}`}>{label}</span>;
};

const BookingStaff: React.FC = () => {
    const dispatch = useAppDispatch();
    const bookings = useAppSelector(selectAllBookings) as any[];
    const isAdmin = useAppSelector(selectIsAdmin);
    const isStaff = useAppSelector(selectIsStaff);
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

    // Create Booking States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const roomTypes = useAppSelector(selectAllRoomTypes);
    const users = useAppSelector(selectAllUsers).filter((u: any) => u.role === 'customer');

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
            if (['cancelled', 'pending'].includes(b.status)) return false;

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
            const isAvailableStatus = r.status === 'available' || r.status === 'Sẵn sàng';
            const isNotAssigned = !assignedRoomIds.has(String(r._id));
            return roomTypeMatch && isAvailableStatus && isNotAssigned;
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
        if (!window.confirm("Bạn có chắc chắn muốn XÓA VĨNH VIỄN đơn đặt phòng này không?")) return;
        try {
            await dispatch(deleteBookingThunk(id)).unwrap();
            toast.success("Xóa đơn đặt phòng thành công");
            setIsDetailOpen(false);
            fetchBookings();
        } catch (error: any) {
            toast.error(error || "Lỗi khi xóa đơn đặt phòng");
        }
    };




    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'text-amber-600 bg-amber-50';
            case 'confirmed': return 'text-blue-600 bg-blue-50';
            case 'checked_in': return 'text-indigo-600 bg-indigo-50';
            case 'checked_out': return 'text-purple-600 bg-purple-50';
            case 'completed': return 'text-emerald-600 bg-emerald-50';
            case 'cancelled': return 'text-rose-600 bg-rose-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getPaymentStatusStyle = (status: string) => {
        switch (status) {
            case 'unpaid': return 'text-rose-600 bg-rose-50';
            case 'paid': return 'text-emerald-600 bg-emerald-50';
            case 'deposited': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusCount = (status: string) => {
        if (status === 'all') return bookings.length;
        return bookings.filter(b => b.status === status).length;
    };

    const statusOptions = [
        { label: 'Tất cả', value: 'all' },
        { label: 'Chờ duyệt', value: 'pending' },
        { label: 'Xác nhận', value: 'confirmed' },
        { label: 'Đã Check-in', value: 'checked_in' },
        { label: 'Đã Check-out', value: 'checked_out' },
        { label: 'Hoàn thành', value: 'completed' },
        { label: 'Đã hủy', value: 'cancelled' }
    ];

    const filteredBookings = bookings.filter(b => {
        const matchesSearch =
            b._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.customerInfo.phone.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

        // Date filters
        const bIn = new Date(b.checkInDate).setHours(0, 0, 0, 0);
        const bOut = new Date(b.checkOutDate).setHours(0, 0, 0, 0);
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null;

        const matchesStartDate = !start || bIn >= start;
        const matchesEndDate = !end || bOut <= end;

        // Room type filter
        const rtId = b.roomTypeId?._id || b.roomTypeId || b.roomTypeInfo?._id;
        const matchesRoomType = roomTypeFilter === 'all' || rtId === roomTypeFilter;

        return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate && matchesRoomType;
    });

    const formatCheckInTime = (booking: any) => {
        if (booking.checkInTime && booking.checkInTime !== 'Tôi chưa biết') {
            return booking.checkInTime;
        }
        return '14:00';
    };

    const isBeforeCheckIn = (booking: any) => {
        if (!booking) return false;
        const now = new Date();
        const checkInDate = new Date(booking.checkInDate);
        const checkInTimeStr = formatCheckInTime(booking);
        const [hours, minutes] = checkInTimeStr.includes(':')
            ? checkInTimeStr.split(':').map((v: string) => parseInt(v, 10))
            : [14, 0];
        const checkInDateTime = new Date(checkInDate);
        checkInDateTime.setHours(hours, minutes, 0, 0);
        return now < checkInDateTime;
    };

    const formatPaymentMethod = (method: string) => {
        switch (method) {
            case 'vnpay': return '💳 VNPay';
            case 'cash': return '💵 Tiền mặt';
            case 'mixed': return '🔀 Hỗn hợp (VN+TM)';
            default: return '❓ ' + (method || 'Chưa rõ');
        }
    };

    const handleExportInvoice = (booking: any) => exportInvoice(booking);
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Quản lý đặt phòng</h1>
                    <p className="text-sm text-gray-500 mt-1">Quản lý và theo dõi tất cả các đơn đặt phòng</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => exportBookingsToExcel(filteredBookings, "Danh_sach_don_dat_phong")}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-transparent bg-clip-text bg-gray-500" style={{ WebkitTextFillColor: 'gray' }}>file_download</span>
                        Xuất báo cáo
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-transparent bg-clip-text bg-white" style={{ WebkitTextFillColor: 'white' }}>add</span>
                        Tạo đơn mới
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Tìm kiếm</label>
                    <input
                        type="text"
                        placeholder="Mã đơn, tên, SĐT..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Loại phòng</label>
                    <select
                        className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                        value={roomTypeFilter}
                        onChange={(e) => setRoomTypeFilter(e.target.value)}
                    >
                        <option value="all">Tất cả loại phòng</option>
                        {roomTypes.map((rt: any) => (
                            <option key={rt._id} value={rt._id}>{rt.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Từ ngày (Check-in)</label>
                    <input
                        type="date"
                        className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Đến ngày (Check-out)</label>
                    <input
                        type="date"
                        className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-1 mb-6">
                {statusOptions.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setStatusFilter(opt.value)}
                        className={`px-4 py-1.5 text-sm rounded-md transition ${statusFilter === opt.value
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                    >
                        {opt.label} <span className="text-xs opacity-70 ml-1">({getStatusCount(opt.value)})</span>
                    </button>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-400 text-sm">Đang tải...</p>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="bg-white rounded-md border border-gray-200 text-center py-12">
                    <p className="text-gray-400 text-sm">Không tìm thấy đơn đặt phòng nào</p>
                </div>
            ) : (
                <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Loại phòng</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày nhận/trả</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBookings.map((booking) => (
                                <tr key={booking._id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs text-gray-500">#{booking._id.slice(-8).toUpperCase()}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-gray-900">{booking.customerInfo.name}</p>
                                            <p className="text-xs text-gray-400">{booking.customerInfo.phone}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-gray-700">{booking.roomTypeId?.name || booking.roomTypeInfo?.name || 'N/A'}</span>
                                        {booking.details?.length > 0 && (
                                            <p className="text-xs text-gray-400">Phòng {booking.details.map((d: any) => d.roomId?.roomNumber).join(', ')}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-gray-700">{new Date(booking.checkInDate).toLocaleDateString('vi-VN')}</p>
                                        <p className="text-xs text-gray-400">
                                            → {new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}
                                            {booking.status === 'confirmed' && isBeforeCheckIn(booking) && (
                                                <span className="ml-2 text-blue-500">(Check-in: {formatCheckInTime(booking)})</span>
                                            )}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <p className="font-medium text-gray-900">{new Intl.NumberFormat('vi-VN').format(booking.finalAmount)}₫</p>
                                        <StatusBadge status={booking.paymentStatus} type="payment" getStatusStyle={getStatusStyle} getPaymentStatusStyle={getPaymentStatusStyle} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={booking.status} getStatusStyle={getStatusStyle} getPaymentStatusStyle={getPaymentStatusStyle} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => {
                                                setSelectedBookingId(booking._id);
                                                setIsDetailOpen(true);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 text-sm"
                                        >
                                            Chi tiết →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            {isDetailOpen && selectedBooking && (
                <BookingDetails
                    booking={selectedBooking}
                    onClose={() => setIsDetailOpen(false)}
                    isAdmin={isAdmin}
                    roomTypes={roomTypes}
                    formatCheckInTime={formatCheckInTime}
                    formatPaymentMethod={formatPaymentMethod}
                    isUpdating={isUpdating}
                    handleUpdateStatus={handleUpdateStatus}
                    handleDeleteBooking={handleDeleteBooking}
                    handleExportInvoice={handleExportInvoice}
                    isBeforeCheckIn={isBeforeCheckIn}
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

            {/* Modal thêm đơn mới (đã tách Component) */}
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