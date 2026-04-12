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
    const [filterFloor, setFilterFloor] = useState<string>('All');
    const [filterStatus, setFilterStatus] = useState<string>('All');

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
            case 'available': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'occupied': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400';
            case 'maintenance': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'text-gray-600 bg-gray-50 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'available': return 'Trống';
            case 'occupied': return 'Đang ở';
            case 'maintenance': return 'Bảo trì';
            default: return status;
        }
    };

    const getStatusDotColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-emerald-500';
            case 'occupied': return 'bg-orange-500';
            case 'maintenance': return 'bg-purple-500';
            default: return 'bg-gray-400';
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
            let nextStatus: 'available' | 'occupied' | 'maintenance' = 'available';
            if ((currentRoom as any).status === 'available') nextStatus = 'occupied';
            else if ((currentRoom as any).status === 'occupied') nextStatus = 'available';
            else nextStatus = 'available';
            await dispatch(updateRoomStatusThunk({ id, status: nextStatus })).unwrap();
            toast.success(`Trạng thái đã chuyển sang: ${nextStatus === 'available' ? 'Trống' : nextStatus === 'occupied' ? 'Đang ở' : 'Đang dọn dẹp'}`);
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

    const getRoomTypeBadgeColor = (roomTypeName: string) => {
        if (roomTypeName.toLowerCase().includes('suite') || roomTypeName.toLowerCase().includes('luxury')) {
            return 'bg-tertiary-container/30 text-on-tertiary-container dark:bg-purple-900/30 dark:text-purple-300';
        }
        if (roomTypeName.toLowerCase().includes('deluxe')) {
            return 'bg-secondary-container text-on-secondary-container dark:bg-blue-900/30 dark:text-blue-300';
        }
        return 'bg-secondary-container text-on-secondary-container dark:bg-slate-700 dark:text-slate-300';
    };

    const getFloorFromRoomNumber = (roomNumber: any): number => {
        if (!roomNumber) return 0;
        const roomStr = String(roomNumber).trim();
        // Lấy tất cả các chữ số
        const digits = roomStr.replace(/\D/g, '');
        if (!digits) return 0;

        const num = parseInt(digits, 10);

        // Nếu số phòng có 1-2 chữ số (VD: "1", "01", "10"), coi như là tầng đó luôn hoặc tầng trệt nếu < 100
        // Tùy vào quy mô khách sạn, nhưng thường 101 là tầng 1.
        if (num < 100) {
            // Nếu là "1", "2" -> Tầng 1, 2. Nếu là "10", "20" -> Tầng 1, 2 (hoặc 10, 20 tùy quy định)
            // Ở đây ta giả định nếu < 100 thì là tầng trệt (0) trừ khi chỉ có 1 chữ số
            return roomStr.length <= 2 ? num : Math.floor(num / 100);
        }

        return Math.floor(num / 100);
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

    const getEffectiveStatus = (roomId: string, dbStatus: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const roomBookings = getRoomBookings(roomId);

        // Tìm đơn đặt phòng nào đã Check-in và ngày hiện tại nằm trong khoảng Check-in/Check-out
        const currentActiveBooking = roomBookings.find((b: any) => {
            const start = new Date(b.checkInDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(b.checkOutDate);
            end.setHours(23, 59, 59, 999);

            return b.status === 'checked_in' && today >= start && today <= end;
        });

        if (currentActiveBooking) return 'occupied';
        return dbStatus;
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
        const currentRoomFloor = getFloorFromRoomNumber(r.roomNumber);
        const matchesFloor = filterFloor === 'All' || currentRoomFloor.toString() === filterFloor;

        const effectiveStatus = getEffectiveStatus(r._id, r.status);
        const matchesStatus = filterStatus === 'All' || effectiveStatus === filterStatus;


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

        return matchesSearch && matchesType && matchesFloor && matchesStatus && isAvailableInDateRange;
    }).sort((a: any, b: any) => String(a.roomNumber || "").localeCompare(String(b.roomNumber || ""), undefined, { numeric: true, sensitivity: 'base' }));

    const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);
    const paginatedRooms = filteredRooms.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const clearFilters = () => {
        setSearchTerm('');
        setFilterRoomTypeId('All');
        setFilterFloor('All');
        setFilterStatus('All');

        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    useEffect(() => {
        if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    // --- LOGIC THỐNG KÊ (STATS) ---
    const getStats = () => {
        let total = rooms.length;
        let available = 0;
        let occupied = 0;
        let maintenance = 0;

        rooms.forEach((room: any) => {
            // Sử dụng logic effectiveStatus cho ngày hiện tại hoặc ngày được lọc
            const status = getEffectiveStatus(room._id, room.status);
            
            // Nếu có lọc theo ngày, kiểm tra xem phòng có trống trong ngày đó không
            let isAvailableInSelectedRange = true;
            if (startDate && endDate) {
                const rangeStart = new Date(startDate).getTime();
                const rangeEnd = new Date(endDate).getTime();
                const roomBookings = getRoomBookings(room._id);
                const hasOverlap = roomBookings.some((b: any) => {
                    const bStart = new Date(b.checkInDate).getTime();
                    const bEnd = new Date(b.checkOutDate).getTime();
                    return (rangeStart < bEnd) && (rangeEnd > bStart);
                });
                isAvailableInSelectedRange = !hasOverlap;
            }

            if (status === 'maintenance') {
                maintenance++;
            } else if (status === 'occupied' || !isAvailableInSelectedRange) {
                occupied++;
            } else {
                available++;
            }
        });

        return { total, available, occupied, maintenance };
    };

    const stats = getStats();

    // Lấy danh sách tầng duy nhất từ dữ liệu phòng thực tế
    const availableFloors = Array.from(new Set((rooms || []).map((r: any) => getFloorFromRoomNumber(r.roomNumber))))
        .filter(f => f > 0)
        .sort((a, b) => a - b);

    return (
        <div className="p-6 bg-[#f5f7f9] dark:bg-slate-900 min-h-screen">
            <div className="w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold text-[#2c2f31] dark:text-slate-100 tracking-tight leading-tight font-['Manrope',sans-serif]">Quản lý phòng</h2>
                        <p className="text-[#595c5e] dark:text-slate-400 mt-1 font-medium font-['Inter',sans-serif]">Theo dõi và cập nhật trạng thái phòng thực tế.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { resetForm(); setIsModalOpen(true); }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white font-bold rounded-xl shadow-lg shadow-[#0050d4]/20 hover:scale-[1.02] transition-all"
                        >
                            <span className="material-symbols-outlined text-xl">add_circle</span>
                            Thêm phòng mới
                        </button>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100/50 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300">
                                <span className="material-symbols-outlined text-2xl">hotel</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số phòng</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.total}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100/50 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <span className="material-symbols-outlined text-2xl">check_circle</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Đang trống</p>
                                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.available}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100/50 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <span className="material-symbols-outlined text-2xl">person_pin</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">Đang ở</p>
                                <h3 className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats.occupied}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100/50 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <span className="material-symbols-outlined text-2xl">construction</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Bảo trì</p>
                                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.maintenance}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Main View */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100/50 dark:border-slate-700">
                    <div className="space-y-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Search Input */}
                            <div className="lg:col-span-2">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Tìm kiếm phòng</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-[20px]">search</span>
                                    <input
                                        type="text"
                                        placeholder="Tìm số phòng hoặc loại phòng..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 focus:ring-4 focus:ring-[#0050d4]/5 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Floor Filter */}
                            <div className="lg:col-span-1">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Vị trí tầng</label>
                                <div className="relative">
                                    <select
                                        value={filterFloor}
                                        onChange={(e) => { setFilterFloor(e.target.value); setCurrentPage(1); }}
                                        className="w-full appearance-none pl-11 pr-10 py-3 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-200 cursor-pointer outline-none transition-all"
                                    >
                                        <option value="All">Tất cả tầng</option>
                                        {availableFloors.map(floor => (
                                            <option key={floor} value={floor.toString()}>Tầng {floor}</option>
                                        ))}
                                        {(rooms || []).some((r: any) => getFloorFromRoomNumber(r.roomNumber) === 0) && (
                                            <option value="0">Tầng trệt (G)</option>
                                        )}
                                    </select>
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#747779] text-xl pointer-events-none">layers</span>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-xl pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="lg:col-span-1">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Trạng thái thực tế</label>
                                <div className="relative">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                        className="w-full appearance-none pl-11 pr-10 py-3 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-200 cursor-pointer outline-none transition-all"
                                    >
                                        <option value="All">Tất cả trạng thái</option>
                                        <option value="available">Sẵn sàng (Trống)</option>
                                        <option value="occupied">Đang ở (Có khách)</option>
                                        <option value="maintenance">Bảo trì (Sửa chữa)</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#747779] text-xl pointer-events-none">info</span>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-xl pointer-events-none">expand_more</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row items-end gap-6 border-t border-slate-100 dark:border-slate-700 pt-6">
                            {/* Room Type Filter */}
                            <div className="w-full lg:w-1/4">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Loại phòng</label>
                                <div className="relative">
                                    <select
                                        value={filterRoomTypeId}
                                        onChange={(e) => { setFilterRoomTypeId(e.target.value); setCurrentPage(1); }}
                                        className="w-full appearance-none pl-11 pr-10 py-3 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-200 cursor-pointer outline-none transition-all"
                                    >
                                        <option value="All">Tất cả loại phòng</option>
                                        {roomTypes.map(type => (
                                            <option key={type._id} value={type._id}>{type.name}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#747779] text-xl pointer-events-none">category</span>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-xl pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            {/* Date Overlap Check */}
                            <div className="flex-1 w-full">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Kiểm tra trống từ - đến ngày</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-xl">calendar_today</span>
                                        <input
                                            type="date"
                                            className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 outline-none focus:border-[#0050d4] transition-all"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <span className="text-[#abadaf] font-bold">→</span>
                                    <div className="relative flex-1">
                                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-xl">event</span>
                                        <input
                                            type="date"
                                            className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 outline-none focus:border-[#0050d4] transition-all"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl font-black text-sm flex items-center gap-2 whitespace-nowrap hover:bg-rose-100 transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-lg">filter_alt_off</span>
                                Xóa tất cả lọc
                            </button>
                        </div>
                        
                        {(startDate || endDate) && (
                            <p className="text-xs text-[#747779] dark:text-slate-400 font-medium italic mt-2">
                                * Chỉ hiển thị các phòng không có lịch đặt trong thời gian này
                            </p>
                        )}
                    </div>

                    {/* Rooms Table */}
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="w-12 h-12 bg-[#e5e9eb] dark:bg-slate-700 rounded-full mb-4"></div>
                                <p className="text-[#747779] dark:text-slate-400 text-sm font-medium">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : paginatedRooms.length === 0 ? (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-5xl text-[#abadaf] dark:text-slate-500 mb-3">hotel</span>
                            <p className="text-[#747779] dark:text-slate-400 text-sm font-medium">Không tìm thấy phòng nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[#595c5e] dark:text-slate-400 text-sm uppercase tracking-wider font-semibold">
                                        <th className="pb-6 pl-2">Phòng</th>
                                        <th className="pb-6">Tầng</th>
                                        <th className="pb-6">Loại phòng</th>
                                        <th className="pb-6">Giá phòng/Đêm</th>
                                        <th className="pb-6">Trạng thái</th>
                                        <th className="pb-6">Lịch đặt</th>
                                        <th className="pb-6 text-right pr-2">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e9eb] dark:divide-slate-700">
                                    {paginatedRooms.map((roomRaw) => {
                                        const room = roomRaw as any;
                                        const roomBookings = getRoomBookings(room._id);
                                        const upcomingBooking = roomBookings.find((b: any) => b.status !== 'completed');
                                        const roomTypeName = getRoomTypeName(room.roomTypeId);
                                        const floor = getFloorFromRoomNumber(room.roomNumber);
                                        const effectiveStatus = getEffectiveStatus(room._id, room.status);
                                        const roomPrice = room.roomTypeId?.pricePerNight ||
                                            (roomTypeName.toLowerCase().includes('suite') ? 1200000 :
                                                roomTypeName.toLowerCase().includes('deluxe') ? 850000 : 650000);

                                        return (
                                            <tr key={room._id} className="group hover:bg-[#f5f7f9] dark:hover:bg-slate-900/50 transition-colors">
                                                <td className="py-5 pl-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-inner bg-[#eef1f3] dark:bg-slate-700 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-[#747779] dark:text-slate-400">bed</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#2c2f31] dark:text-slate-100">Phòng {room.roomNumber}</p>
                                                            <p className="text-xs text-[#747779] dark:text-slate-400">
                                                                {floor > 0 ? `Tầng ${floor}` : 'Tầng trệt'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5">
                                                    <span className="text-[#2c2f31] dark:text-slate-200 font-medium">Tầng {floor > 0 ? floor : 'G'}</span>
                                                </td>
                                                <td className="py-5">
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRoomTypeBadgeColor(roomTypeName)}`}>
                                                        {roomTypeName}
                                                    </span>
                                                </td>
                                                <td className="py-5">
                                                    <span className="font-bold text-[#2c2f31] dark:text-slate-100">
                                                        {new Intl.NumberFormat('vi-VN').format(roomPrice)}đ
                                                    </span>
                                                </td>
                                                <td className="py-5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className={`flex items-center gap-2 ${effectiveStatus === 'available' ? 'text-emerald-600' : effectiveStatus === 'occupied' ? 'text-orange-600' : 'text-purple-600'}`}>
                                                            <span className={`w-2 h-2 rounded-full ${getStatusDotColor(effectiveStatus)} ${effectiveStatus === 'available' ? 'animate-pulse' : ''}`}></span>
                                                            <span className="text-sm font-bold">{getStatusLabel(effectiveStatus)}</span>
                                                        </div>
                                                        {effectiveStatus === 'available' && (
                                                            <button
                                                                onClick={() => toggleStatus(room._id)}
                                                                className="text-xs text-[#0050d4] hover:text-[#0046bb] transition"
                                                            >
                                                                Đánh dấu đang dùng
                                                            </button>
                                                        )}
                                                        {effectiveStatus === 'occupied' && (
                                                            <button
                                                                onClick={() => toggleStatus(room._id)}
                                                                className="text-xs text-emerald-600 hover:text-emerald-700 transition"
                                                            >
                                                                Đánh dấu trống
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-5">
                                                    {upcomingBooking ? (
                                                        <div className="text-xs">
                                                            <p className="text-[#4e5c71] dark:text-slate-400">
                                                                {new Date(upcomingBooking.checkInDate).toLocaleDateString('vi-VN')}
                                                                <span className="text-[#abadaf] mx-1">→</span>
                                                                {new Date(upcomingBooking.checkOutDate).toLocaleDateString('vi-VN')}
                                                            </p>
                                                            <p className="text-[#747779] dark:text-slate-500 mt-0.5 truncate max-w-[150px]">{upcomingBooking.customerInfo?.name}</p>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => openHistoryModal(room)}
                                                            className="text-xs text-[#747779] dark:text-slate-500 hover:text-[#0050d4] transition"
                                                        >
                                                            Xem lịch sử
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="py-5 text-right pr-2">
                                                    <button
                                                        onClick={() => openEditModal(room)}
                                                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-[#747779] dark:text-slate-400 hover:text-[#0050d4]"
                                                        title="Sửa"
                                                    >
                                                        <span className="material-symbols-outlined">edit_note</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openHistoryModal(room)}
                                                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-[#747779] dark:text-slate-400 hover:text-[#0050d4]"
                                                        title="Lịch đặt"
                                                    >
                                                        <span className="material-symbols-outlined">calendar_month</span>
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteTargetId(room._id); setDeleteTargetName(`Phòng ${room.roomNumber}`); }}
                                                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-[#747779] dark:text-slate-400 hover:text-rose-600"
                                                        title="Xóa"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
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
                    {filteredRooms.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-between mt-10">
                            <p className="text-sm text-[#747779] dark:text-slate-400 font-medium">
                                Hiển thị <span className="font-bold text-[#2c2f31] dark:text-slate-100">{paginatedRooms.length}</span> trên <span className="font-bold text-[#2c2f31] dark:text-slate-100">{filteredRooms.length}</span> phòng
                            </p>
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
            </div>

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl">
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-[#e5e9eb] dark:border-slate-700 rounded-t-2xl px-6 py-5 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-extrabold text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">
                                    {isEditMode ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
                                </h2>
                                <p className="text-xs text-[#747779] dark:text-slate-400 mt-0.5 font-medium">Thông tin chi tiết phòng</p>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="w-8 h-8 flex items-center justify-center text-[#747779] hover:text-[#2c2f31] dark:hover:text-slate-200 hover:bg-[#eef1f3] dark:hover:bg-slate-700 rounded-lg transition-all text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-1.5 uppercase tracking-wide">Số phòng *</label>
                                <input
                                    name="roomNumber"
                                    className="w-full px-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0050d4] transition-all"
                                    placeholder="VD: 101, 202, 305"
                                    required
                                    value={formData.roomNumber}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-1.5 uppercase tracking-wide">Loại phòng *</label>
                                <select
                                    name="roomTypeId"
                                    className="w-full px-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0050d4] transition-all cursor-pointer"
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
                                <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-2 uppercase tracking-wide">Trạng thái</label>
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
                                            className={`py-2 text-xs font-bold rounded-xl transition-all ${formData.status === s.id
                                                ? 'bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white shadow-md'
                                                : 'bg-[#eef1f3] dark:bg-slate-700 text-[#4e5c71] dark:text-slate-400 hover:bg-[#e5e9eb] dark:hover:bg-slate-600'
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
                                    className="flex-1 py-2.5 border border-[#d9dde0] dark:border-slate-700 text-[#4e5c71] dark:text-slate-400 text-sm font-bold rounded-xl hover:bg-[#eef1f3] dark:hover:bg-slate-700 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 shadow-md"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden">
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-[#e5e9eb] dark:border-slate-700 rounded-t-2xl px-6 py-5 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-extrabold text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">Lịch đặt phòng {historyRoom.roomNumber}</h2>
                                <p className="text-xs text-[#747779] dark:text-slate-400 mt-0.5 font-medium">Các đơn đặt đã và sắp diễn ra</p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-[#747779] hover:text-[#2c2f31] dark:hover:text-slate-200 hover:bg-[#eef1f3] dark:hover:bg-slate-700 rounded-lg transition-all text-2xl">&times;</button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {getRoomBookings(historyRoom._id).length > 0 ? (
                                <div className="space-y-3">
                                    {getRoomBookings(historyRoom._id).map((b: any, idx: number) => (
                                        <div key={idx} className="p-4 border border-[#e5e9eb] dark:border-slate-700 rounded-xl hover:bg-[#f5f7f9] dark:hover:bg-slate-900/50 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-sm font-bold text-[#2c2f31] dark:text-slate-100">
                                                    {new Date(b.checkInDate).toLocaleDateString('vi-VN')} → {new Date(b.checkOutDate).toLocaleDateString('vi-VN')}
                                                </p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : b.status === 'confirmed'
                                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                        : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
                                                    }`}>
                                                    {b.status === 'completed' ? 'Đã hoàn thành' : b.status === 'confirmed' ? 'Sắp tới' : b.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#747779] dark:text-slate-400">{b.customerInfo?.name} • {b.customerInfo?.phone}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <span className="material-symbols-outlined text-4xl text-[#abadaf] dark:text-slate-500 mb-3">calendar_month</span>
                                    <p className="text-[#747779] dark:text-slate-400 text-sm font-medium">Chưa có lịch đặt nào cho phòng này</p>
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