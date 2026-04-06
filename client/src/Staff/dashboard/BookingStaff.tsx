import React, { useEffect, useState } from 'react';
import { exportInvoice } from '../../utils/exportInvoice';
import { exportBookingToExcel, exportBookingsToExcel } from '../../utils/exportExcel';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import {
    fetchAllBookingsThunk,
    updateBookingStatusThunk,
    deleteBookingThunk,
    createBookingThunk,
    selectAllBookings,
    selectBookingLoading,
    selectBookingUpdating
} from '../../lib/redux/reducers/booking';
import { fetchAllRoomsThunk } from '../../lib/redux/reducers/room';
import { fetchAllRoomTypesThunk, selectAllRoomTypes } from '../../lib/redux/reducers/room-type';
import { fetchAllUsersThunk, selectAllUsers } from '../../lib/redux/reducers/user';
import { selectIsAdmin, selectIsStaff } from '../../lib/redux/reducers/auth/selectors';
import axiosInstance from '../../lib/redux/api/axiosInstance';
import ConfirmModal from '../../admin/components/ConfirmModal';

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
    const [bookingForm, setBookingForm] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        roomTypeId: '',
        roomQuantity: 1,
        checkInDate: '',
        checkOutDate: '',
        paymentMethod: 'cash' as 'vnpay' | 'cash' | 'balance' | 'wallet',
        paymentStatus: 'unpaid' as 'unpaid' | 'paid' | 'deposited',
        specialRequests: '',
        checkInTime: '14:00'
    });

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
    // thêm đơn đặt phòng
    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            customerInfo: {
                name: bookingForm.customerName,
                email: bookingForm.customerEmail,
                phone: bookingForm.customerPhone
            },
            roomTypeId: bookingForm.roomTypeId,
            roomQuantity: bookingForm.roomQuantity,
            checkInDate: new Date(bookingForm.checkInDate),
            checkOutDate: new Date(bookingForm.checkOutDate),
            paymentMethod: bookingForm.paymentMethod,
            paymentStatus: bookingForm.paymentStatus,
            paidAmount: 0,
            specialRequests: bookingForm.specialRequests,
            checkInTime: bookingForm.checkInTime,
            status: 'confirmed'
        };

        try {
            await dispatch(createBookingThunk(data)).unwrap();
            toast.success("Tạo đặt phòng thành công");
            setIsCreateModalOpen(false);
            setBookingForm({
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                roomTypeId: '',
                roomQuantity: 1,
                checkInDate: '',
                checkOutDate: '',
                paymentMethod: 'cash',
                paymentStatus: 'unpaid',
                specialRequests: '',
                checkInTime: '14:00'
            });
            fetchBookings();
        } catch (error: any) {
            toast.error(error || "Tạo đặt phòng thất bại");
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
            case 'wallet': return '👛 Ví QuickStay';
            case 'vnpay': return '💳 VNPay';
            default: return '❓ Chưa xác định';
        }
    };

    // Simple Status Badge
    const StatusBadge = ({ status, type = 'order' }: { status: string; type?: 'order' | 'payment' }) => {
        const style = type === 'order' ? getStatusStyle(status) : getPaymentStatusStyle(status);
        const label = type === 'order' ?
            (status === 'pending' ? 'Chờ duyệt' : status === 'confirmed' ? 'Xác nhận' : status === 'checked_in' ? 'Check-in' : status === 'checked_out' ? 'Check-out' : status === 'completed' ? 'Hoàn thành' : 'Hủy') :
            (status === 'paid' ? 'Đã thanh toán' : status === 'deposited' ? 'Đã cọc' : 'Chưa thanh toán');

        return <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${style}`}>{label}</span>;
    };

    const handleExportInvoice = (booking: any) => exportInvoice(booking);

    // Simple Detail Modal
    const DetailModal = ({ booking, onClose }: { booking: any; onClose: () => void }) => {
        if (!booking) return null;

        const nights = Math.ceil(
            (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Chi tiết đơn #{booking._id.slice(-8).toUpperCase()}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(booking.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Customer Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Khách hàng</p>
                                <p className="font-medium text-gray-900 mt-1">{booking.customerInfo.name}</p>
                                <p className="text-gray-600">{booking.customerInfo.phone}</p>
                                <p className="text-gray-500 text-xs">{booking.customerInfo.email}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Thời gian lưu trú</p>
                                <p className="font-medium text-gray-900 mt-1">
                                    {new Date(booking.checkInDate).toLocaleDateString('vi-VN')} ({formatCheckInTime(booking)})
                                    → {new Date(booking.checkOutDate).toLocaleDateString('vi-VN')} (12:00)
                                </p>
                                <p className="text-gray-500 text-xs">{nights} ngày • {booking.roomQuantity} phòng</p>
                            </div>
                        </div>

                        {/* Room Info */}
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Loại phòng</p>
                            <div className="bg-gray-50 rounded-md p-3 text-sm">
                                <span className="font-medium">{booking.roomTypeId?.name || booking.roomTypeInfo?.name || 'N/A'}</span>
                                {booking.details?.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        Phòng: {booking.details.map((d: any) => d.roomId?.roomNumber).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="border-t pt-4">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-2 text-gray-600">Giá phòng</td>
                                        <td className="py-2 text-right font-medium">{new Intl.NumberFormat('vi-VN').format(booking.totalAmount)}₫</td>
                                    </tr>
                                    {booking.discountAmount > 0 && (
                                        <tr className="border-b">
                                            <td className="py-2 text-gray-600">Giảm giá ({booking.promotionCode || 'Mã'})</td>
                                            <td className="py-2 text-right text-emerald-600">-{new Intl.NumberFormat('vi-VN').format(booking.discountAmount)}₫</td>
                                        </tr>
                                    )}
                                    <tr className="border-b">
                                        <td className="py-3 font-semibold text-gray-900">Tổng cộng</td>
                                        <td className="py-3 text-right font-bold text-gray-900">{new Intl.NumberFormat('vi-VN').format(booking.finalAmount)}₫</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 text-gray-600">Đã thanh toán</td>
                                        <td className="py-2 text-right text-emerald-600 font-medium">{new Intl.NumberFormat('vi-VN').format(booking.paidAmount || 0)}₫</td>
                                    </tr>
                                    {/* Phương thức thanh toán */}
                                    <tr className="border-b">
                                        <td className="py-2 text-gray-600">Phương thức thanh toán</td>
                                        <td className="py-2 text-right font-medium text-gray-700">
                                            {formatPaymentMethod(booking.paymentMethod)}
                                        </td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="py-2 font-medium text-gray-900">Còn lại</td>
                                        <td className="py-2 text-right font-bold text-rose-600">{new Intl.NumberFormat('vi-VN').format(Math.max(0, booking.finalAmount - (booking.paidAmount || 0)))}₫</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Special Requests */}
                        {booking.specialRequests && (
                            <div className="bg-gray-50 rounded-md p-3">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Yêu cầu đặc biệt</p>
                                <p className="text-sm text-gray-600 italic">"{booking.specialRequests}"</p>
                            </div>
                        )}

                        {/* Status & Actions */}
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Trạng thái</span>
                                <StatusBadge status={booking.status} />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {booking.status === 'pending' && (
                                    <>
                                        <button onClick={() => { setSelectedRoomIds([]); setIsAssignModalOpen(true); }} disabled={isUpdating} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition">
                                            Gán phòng & Xác nhận
                                        </button>
                                        <button onClick={() => handleUpdateStatus(booking._id, 'cancelled')} disabled={isUpdating} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition">
                                            Hủy đơn
                                        </button>
                                        {isStaff && (
                                            <button onClick={() => handleDeleteBooking(booking._id)} className="px-4 py-2 border border-rose-200 text-rose-600 text-sm font-medium rounded-md hover:bg-rose-50 transition">
                                                Xóa
                                            </button>
                                        )}
                                    </>
                                )}

                                {booking.status === 'confirmed' && (
                                    <>
                                        {isBeforeCheckIn(booking) && (
                                            <button onClick={() => { const currentAssignedIds = booking.details?.map((d: any) => d.roomId?._id || d.roomId) || []; setSelectedRoomIds(currentAssignedIds); setIsAssignModalOpen(true); }} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition">
                                                Đổi phòng
                                            </button>
                                        )}
                                        <button onClick={() => handleUpdateStatus(booking._id, 'checked_in')} disabled={isUpdating} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition">
                                            Check-in
                                        </button>
                                        <button onClick={() => handleUpdateStatus(booking._id, 'cancelled')} disabled={isUpdating} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition">
                                            Hủy
                                        </button>
                                        {isStaff && (
                                            <button onClick={() => handleDeleteBooking(booking._id)} className="px-4 py-2 border border-rose-200 text-rose-600 text-sm font-medium rounded-md hover:bg-rose-50 transition">
                                                Xóa
                                            </button>
                                        )}
                                    </>
                                )}

                                {booking.status === 'checked_in' && (
                                    <>
                                        <button onClick={() => handleUpdateStatus(booking._id, 'completed', 'paid')} disabled={isUpdating} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition">
                                            Check-out & Hoàn tất
                                        </button>
                                        {isStaff && (
                                            <button onClick={() => handleDeleteBooking(booking._id)} className="px-4 py-2 border border-rose-200 text-rose-600 text-sm font-medium rounded-md hover:bg-rose-50 transition">
                                                Xóa
                                            </button>
                                        )}
                                    </>
                                )}

                                {booking.status === 'checked_out' && (
                                    <>
                                        <button onClick={() => handleUpdateStatus(booking._id, 'completed')} disabled={isUpdating} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition">
                                            Đánh dấu hoàn thành
                                        </button>
                                        <button onClick={() => handleExportInvoice(booking)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition">
                                            Xuất hóa đơn
                                        </button>
                                        {isStaff && (
                                            <button onClick={() => handleDeleteBooking(booking._id)} className="px-4 py-2 border border-rose-200 text-rose-600 text-sm font-medium rounded-md hover:bg-rose-50 transition">
                                                Xóa
                                            </button>
                                        )}
                                    </>
                                )}

                                {booking.status === 'completed' && (
                                    <>
                                        <button onClick={() => handleExportInvoice(booking)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition">
                                            Xuất hóa đơn
                                        </button>
                                        {isStaff && (
                                            <>
                                                <button onClick={() => exportBookingToExcel(booking)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition">
                                                    Xuất Excel
                                                </button>
                                                <button onClick={() => handleDeleteBooking(booking._id)} className="px-4 py-2 border border-rose-200 text-rose-600 text-sm font-medium rounded-md hover:bg-rose-50 transition">
                                                    Xóa
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}

                                {booking.status === 'cancelled' && isStaff && (
                                    <>
                                        <button onClick={() => exportBookingToExcel(booking)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition">
                                            Xuất Excel
                                        </button>
                                        <button onClick={() => handleDeleteBooking(booking._id)} className="px-4 py-2 border border-rose-200 text-rose-600 text-sm font-medium rounded-md hover:bg-rose-50 transition">
                                            Xóa
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Simple Assign Room Modal
    const AssignRoomModal = ({ booking, onClose }: { booking: any; onClose: () => void }) => {
        if (!booking) return null;
        const availableRooms = getAvailableRoomsForBooking(booking, allRooms, bookings);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white w-full max-w-md rounded-lg shadow-xl">
                    <div className="border-b px-6 py-4 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Gán số phòng</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                    </div>

                    <div className="p-6">
                        <p className="text-sm text-gray-600 mb-4">Yêu cầu <strong>{booking.roomQuantity}</strong> phòng. Chọn phòng bên dưới:</p>

                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {availableRooms.length === 0 ? (
                                <p className="text-center text-gray-400 py-8 text-sm">Không có phòng trống cho loại phòng này</p>
                            ) : (
                                availableRooms.map((r: any) => (
                                    <label key={r._id} className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition ${selectedRoomIds.includes(r._id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedRoomIds.includes(r._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedRoomIds([...selectedRoomIds, r._id]);
                                                else setSelectedRoomIds(selectedRoomIds.filter(id => id !== r._id));
                                            }}
                                            disabled={!selectedRoomIds.includes(r._id) && selectedRoomIds.length >= (booking.roomQuantity || 1)}
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Phòng {r.roomNumber}</p>
                                            <p className="text-xs text-gray-500">Trống</p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="border-t px-6 py-4 flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition">
                            Hủy
                        </button>
                        <button
                            onClick={() => handleAssignAndConfirm(booking._id, selectedRoomIds)}
                            disabled={selectedRoomIds.length !== booking.roomQuantity}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                        >
                            Xác nhận ({selectedRoomIds.length}/{booking.roomQuantity})
                        </button>
                    </div>
                </div>
            </div>
        );
    };

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
                                        <StatusBadge status={booking.paymentStatus} type="payment" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={booking.status} />
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
                <DetailModal booking={selectedBooking} onClose={() => setIsDetailOpen(false)} />
            )}
            {isAssignModalOpen && selectedBooking && (
                <AssignRoomModal booking={selectedBooking} onClose={() => setIsAssignModalOpen(false)} />
            )}

            {/* Modal thêm đơn mới */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl my-auto animate-in fade-in zoom-in duration-300">
                        <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <div className="text-left">
                                <h2 className="text-lg font-semibold text-gray-900">Tạo đơn đặt phòng mới</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Đặt phòng thủ công cho khách hàng</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleCreateBooking} className="p-6 space-y-5 text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên khách hàng</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="Vd: Nguyễn Văn A"
                                        value={bookingForm.customerName}
                                        onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="Vd: 0987654321"
                                        value={bookingForm.customerPhone}
                                        onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="Vd: khach@gmail.com"
                                        value={bookingForm.customerEmail}
                                        onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Loại phòng</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        value={bookingForm.roomTypeId}
                                        onChange={(e) => setBookingForm({ ...bookingForm, roomTypeId: e.target.value })}
                                    >
                                        <option value="">-- Chọn loại phòng --</option>
                                        {roomTypes.map((rt: any) => (
                                            <option key={rt._id || rt.id} value={rt._id || rt.id}>
                                                {rt.name} - {new Intl.NumberFormat('vi-VN').format(rt.basePrice)}₫/ngày
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày nhận phòng</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        value={bookingForm.checkInDate}
                                        onChange={(e) => setBookingForm({ ...bookingForm, checkInDate: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày trả phòng</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        value={bookingForm.checkOutDate}
                                        onChange={(e) => setBookingForm({ ...bookingForm, checkOutDate: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số lượng phòng</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        value={bookingForm.roomQuantity}
                                        onChange={(e) => setBookingForm({ ...bookingForm, roomQuantity: parseInt(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hình thức thanh toán</label>
                                    <select
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        value={bookingForm.paymentMethod}
                                        onChange={(e: any) => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}
                                    >
                                        <option value="cash">💵 Tiền mặt</option>
                                        <option value="vnpay">💳 Chuyển khoản</option>
                                        <option value="wallet">👛 Ví điện tử</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Trạng thái thanh toán</label>
                                    <select
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        value={bookingForm.paymentStatus}
                                        onChange={(e: any) => setBookingForm({ ...bookingForm, paymentStatus: e.target.value })}
                                    >
                                        <option value="unpaid">Chưa thanh toán</option>
                                        <option value="paid">Đã thanh toán đủ</option>
                                        <option value="deposited">Đã đặt cọc</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giờ nhận phòng dự kiến</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="Vd: 14:00"
                                        value={bookingForm.checkInTime}
                                        onChange={(e) => setBookingForm({ ...bookingForm, checkInTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Yêu cầu đặc biệt</label>
                                <textarea
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                                    placeholder="Ghi chú thêm từ khách hàng..."
                                    value={bookingForm.specialRequests}
                                    onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 border-t flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                >
                                    Xác nhận tạo đơn
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingStaff;