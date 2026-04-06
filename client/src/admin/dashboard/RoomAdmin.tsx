import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Room, RoomType } from '../../types';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import { useAppDispatch, useAppSelector } from '@/lib/redux/store';
import { fetchAllRoomsThunk, createRoomThunk, updateRoomThunk, deleteRoomThunk, updateRoomStatusThunk, selectAllRooms, selectRoomLoading } from '@/lib/redux/reducers/room';
import { fetchAllRoomTypesThunk, selectAllRoomTypes } from '@/lib/redux/reducers/room-type';
import { fetchAllBookingsThunk, selectAllBookings } from '@/lib/redux/reducers/booking';

interface RoomForm {
    roomNumber: string;
    roomTypeId: string;
    status: 'available' | 'occupied' | 'maintenance';
}

const RoomAdmin: React.FC = () => {
    const dispatch = useAppDispatch();
    const rooms = useAppSelector(selectAllRooms);
    const roomTypes = useAppSelector(selectAllRoomTypes);
    const loading = useAppSelector(selectRoomLoading);
    const bookings = useAppSelector(selectAllBookings);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterRoomTypeId, setFilterRoomTypeId] = useState<string>('All');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 10;

    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyRoom, setHistoryRoom] = useState<any>(null);

    const initialFormData: RoomForm = {
        roomNumber: '',
        roomTypeId: '',
        status: 'available'
    };

    const [formData, setFormData] = useState<RoomForm>(initialFormData);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    useEffect(() => {
        dispatch(fetchAllRoomsThunk());
        dispatch(fetchAllRoomTypesThunk());
        dispatch(fetchAllBookingsThunk());
    }, [dispatch]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'text-emerald-600 bg-emerald-50';
            case 'occupied': return 'text-amber-600 bg-amber-50';
            case 'maintenance': return 'text-rose-600 bg-rose-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'available': return 'Sẵn sàng';
            case 'occupied': return 'Đang có khách';
            case 'maintenance': return 'Bảo trì';
            default: return status;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!formData.roomNumber || !formData.roomTypeId) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return;
        }

        const data = new FormData();
        data.append('roomNumber', formData.roomNumber);
        data.append('roomTypeId', formData.roomTypeId);
        data.append('status', formData.status);

        try {
            if (isEditMode && selectedRoom) {
                await dispatch(updateRoomThunk({ id: selectedRoom._id, formData: data })).unwrap();
                toast.success("Cập nhật phòng thành công");
            } else {
                await dispatch(createRoomThunk(data)).unwrap();
                toast.success("Thêm phòng thành công");
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error?.message || "Đã xảy ra lỗi");
        }
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedRoom(null);
        setIsEditMode(false);
    };

    const deleteRoom = async (id: string): Promise<void> => {
        try {
            await dispatch(deleteRoomThunk(id)).unwrap();
            toast.success("Xóa phòng thành công");
        } catch (error: any) {
            toast.error(error?.message || "Lỗi khi xóa phòng");
        } finally {
            setDeleteTargetId(null);
            setDeleteTargetName('');
        }
    };

    const toggleStatus = async (id: string): Promise<void> => {
        try {
            const currentRoom = rooms.find(r => r._id === id);
            if (!currentRoom) return;
            const nextStatus = (currentRoom as any).status === 'available' ? 'occupied' : 'available';
            await dispatch(updateRoomStatusThunk({ id, status: nextStatus })).unwrap();
            toast.success(`Trạng thái đã chuyển sang: ${nextStatus === 'available' ? 'Sẵn sàng' : 'Đang có khách'}`);
        } catch (error: any) {
            toast.error(error?.message || "Lỗi khi cập nhật trạng thái");
        }
    };

    const getRoomTypeName = (roomTypeId: any) => {
        if (!roomTypeId) return 'Không xác định';
        if (typeof roomTypeId === 'string') {
            const foundType = roomTypes.find(t => t._id === roomTypeId);
            return foundType ? foundType.name : 'Không xác định';
        }
        return roomTypeId.name || 'Không xác định';
    };

    const openEditModal = (room: any): void => {
        setFormData({
            roomNumber: room.roomNumber || '',
            roomTypeId: typeof room.roomTypeId === 'string' ? room.roomTypeId : room.roomTypeId?._id || '',
            status: room.status || 'available'
        });
        setSelectedRoom(room);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const openHistoryModal = (room: any) => {
        setHistoryRoom(room);
        setIsHistoryModalOpen(true);
    };

    const getRoomBookings = (roomId: string) => {
        if (!bookings || bookings.length === 0) return [];

        return bookings.filter((b: any) => {
            if (b.status === 'cancelled' || b.status === 'pending') return false;

            if (b.assignedRooms && b.assignedRooms.includes(roomId)) return true;

            if (b.details && b.details.some((d: any) => {
                const detailRoomId = d.roomId?._id || d.roomId;
                return String(detailRoomId) === String(roomId);
            })) return true;

            return false;
        }).sort((a: any, b: any) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
    };

    const filteredRooms = rooms.filter(room => {
        const r = room as any;
        const roomNumStr = String(r.roomNumber || '').toLowerCase();
        const roomTypeStr = String(r.roomTypeId?.name || getRoomTypeName(r.roomTypeId) || '').toLowerCase();
        const searchStr = searchTerm.toLowerCase();

        const matchesSearch = roomNumStr.includes(searchStr) || roomTypeStr.includes(searchStr);
        const matchesType = filterRoomTypeId === 'All' || String(r.roomTypeId?._id || r.roomTypeId) === filterRoomTypeId;

        let isAvailableInDateRange = true;
        if (startDate && endDate) {
            const rangeStart = new Date(startDate).getTime();
            const rangeEnd = new Date(endDate).getTime();
            const roomBookings = getRoomBookings(r._id);
            const hasOverlap = roomBookings.some((b: any) => {
                const bStart = new Date(b.checkInDate).getTime();
                const bEnd = new Date(b.checkOutDate).getTime();
                return (rangeStart < bEnd) && (rangeEnd > bStart);
            });
            isAvailableInDateRange = !hasOverlap;
        }

        return matchesSearch && matchesType && isAvailableInDateRange;
    }).sort((a: any, b: any) => String(a.roomNumber || "").localeCompare(String(b.roomNumber || ""), undefined, { numeric: true, sensitivity: 'base' }));

    const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);
    const paginatedRooms = filteredRooms.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const clearFilters = () => {
        setSearchTerm('');
        setFilterRoomTypeId('All');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    useEffect(() => {
        if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Danh sách phòng</h1>
                    <p className="text-sm text-gray-500 mt-1">Quản lý trạng thái và thông tin chi tiết từng phòng</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-md border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tìm kiếm</label>
                            <input
                                type="text"
                                placeholder="Số phòng hoặc loại phòng..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Loại phòng</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-gray-400"
                                value={filterRoomTypeId}
                                onChange={(e) => { setFilterRoomTypeId(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="All">Tất cả loại phòng</option>
                                {roomTypes.map(type => (
                                    <option key={type._id} value={type._id}>{type.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Kiểm tra phòng trống</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                <span className="text-gray-400 self-center">→</span>
                                <input
                                    type="date"
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <button
                                onClick={clearFilters}
                                disabled={!startDate && !endDate && !searchTerm && filterRoomTypeId === 'All'}
                                className="w-full py-2 px-3 border border-gray-200 text-gray-500 text-sm rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add Button */}
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
                    >
                        + Thêm phòng mới
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-12 bg-white rounded-md border border-gray-200">
                        <p className="text-gray-400 text-sm">Đang tải...</p>
                    </div>
                ) : paginatedRooms.length === 0 ? (
                    <div className="bg-white rounded-md border border-gray-200 text-center py-12">
                        <p className="text-gray-400 text-sm">Không tìm thấy phòng nào</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Số phòng</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Loại phòng</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Lịch đặt</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedRooms.map((roomRaw) => {
                                    const room = roomRaw as any;
                                    const roomBookings = getRoomBookings(room._id);
                                    const upcomingBooking = roomBookings.find((b: any) => b.status !== 'completed');
                                    return (
                                        <tr key={room._id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">Phòng {room.roomNumber}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        Tầng: {room.roomNumber?.charAt(0) || '?'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-gray-700">{getRoomTypeName(room.roomTypeId)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                                                        {getStatusLabel(room.status)}
                                                    </span>
                                                    {room.status === 'available' && (
                                                        <button
                                                            onClick={() => toggleStatus(room._id)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 transition"
                                                        >
                                                            Đánh dấu đang dùng
                                                        </button>
                                                    )}
                                                    {room.status === 'occupied' && (
                                                        <button
                                                            onClick={() => toggleStatus(room._id)}
                                                            className="text-xs text-emerald-600 hover:text-emerald-800 transition"
                                                        >
                                                            Đánh dấu trống
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {upcomingBooking ? (
                                                    <div className="text-xs">
                                                        <p className="text-gray-600">
                                                            {new Date(upcomingBooking.checkInDate).toLocaleDateString('vi-VN')}
                                                            <span className="text-gray-400 mx-1">→</span>
                                                            {new Date(upcomingBooking.checkOutDate).toLocaleDateString('vi-VN')}
                                                        </p>
                                                        <p className="text-gray-400 mt-0.5 truncate max-w-[150px]">{upcomingBooking.customerInfo?.name}</p>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => openHistoryModal(room)}
                                                        className="text-xs text-gray-400 hover:text-gray-600 transition"
                                                    >
                                                        Xem lịch sử
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => openEditModal(room)}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                                                        title="Sửa"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openHistoryModal(room)}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                                                        title="Lịch đặt"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteTargetId(room._id); setDeleteTargetName(`Phòng ${room.roomNumber}`); }}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 transition"
                                                        title="Xóa"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {filteredRooms.length > ITEMS_PER_PAGE && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredRooms.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-xl">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {isEditMode ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Thông tin chi tiết phòng</p>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Số phòng *</label>
                                <input
                                    name="roomNumber"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                    placeholder="VD: 101, 202, 305"
                                    required
                                    value={formData.roomNumber}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Loại phòng *</label>
                                <select
                                    name="roomTypeId"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-gray-400"
                                    required
                                    value={formData.roomTypeId}
                                    onChange={handleChange}
                                >
                                    <option value="">-- Chọn loại phòng --</option>
                                    {roomTypes.map(type => (
                                        <option key={type._id} value={type._id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Trạng thái</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'available', label: 'Sẵn sàng' },
                                        { id: 'occupied', label: 'Đang có khách' },
                                        { id: 'maintenance', label: 'Bảo trì' }
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: s.id as any })}
                                            className={`py-2 text-xs font-medium rounded-md transition ${formData.status === s.id
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
                                >
                                    {isEditMode ? 'Cập nhật' : 'Thêm phòng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteTargetId}
                title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa ${deleteTargetName}? Hành động này không thể hoàn tác.`}
                onConfirm={() => deleteTargetId && deleteRoom(deleteTargetId)}
                onCancel={() => { setDeleteTargetId(null); setDeleteTargetName(''); }}
            />

            {/* History Modal */}
            {isHistoryModalOpen && historyRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-xl max-h-[80vh] overflow-hidden">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Lịch đặt phòng {historyRoom.roomNumber}</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Các đơn đặt đã và sắp diễn ra</p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {getRoomBookings(historyRoom._id).length > 0 ? (
                                <div className="space-y-3">
                                    {getRoomBookings(historyRoom._id).map((b: any, idx: number) => (
                                        <div key={idx} className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {new Date(b.checkInDate).toLocaleDateString('vi-VN')} → {new Date(b.checkOutDate).toLocaleDateString('vi-VN')}
                                                </p>
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${b.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : b.status === 'confirmed'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {b.status === 'completed' ? 'Đã hoàn thành' : b.status === 'confirmed' ? 'Sắp tới' : b.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">{b.customerInfo?.name} • {b.customerInfo?.phone}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-400 text-sm">Chưa có lịch đặt nào cho phòng này</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomAdmin;