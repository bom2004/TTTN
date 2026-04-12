import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Room } from '../../types';
import Pagination from '../../admin/components/Pagination';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import { fetchAllRoomsThunk, selectAllRooms, selectRoomLoading } from '../../lib/redux/reducers/room';
import { fetchAllRoomTypesThunk, selectAllRoomTypes } from '../../lib/redux/reducers/room-type';
import { fetchAllBookingsThunk, selectAllBookings } from '../../lib/redux/reducers/booking';

const RoomStaff: React.FC = () => {
    const dispatch = useAppDispatch();
    const rooms = useAppSelector(selectAllRooms) as unknown as Room[];
    const roomTypes = useAppSelector(selectAllRoomTypes);
    const bookings = useAppSelector(selectAllBookings);
    const loading = useAppSelector(selectRoomLoading);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterRoomTypeId, setFilterRoomTypeId] = useState<string>('All');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 10;

    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyRoom, setHistoryRoom] = useState<any>(null);

    useEffect(() => {
        dispatch(fetchAllRoomsThunk()).unwrap().catch((err: any) => {
            console.error(err);
            toast.error(err || "Lỗi khi tải dữ liệu phòng");
        });
        dispatch(fetchAllBookingsThunk());
        dispatch(fetchAllRoomTypesThunk());
    }, [dispatch]);

    const getRoomBookings = (roomId: string) => {
        return bookings.filter((b: any) => {
            if (b.status === 'cancelled' || b.status === 'pending') return false;
            const assignedIds = b.assignedRooms || [];
            if (assignedIds.includes(roomId)) return true;
            if (b.details && b.details.some((d: any) => (String(d.roomId?._id || d.roomId) === roomId))) return true;
            return false;
        }).sort((a: any, b: any) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
    };

    const getFloorFromRoomNumber = (roomNumber: any): number => {
        if (!roomNumber) return 0;
        const roomStr = String(roomNumber).trim();
        const digits = roomStr.replace(/\D/g, '');
        if (!digits) return 0;
        const num = parseInt(digits, 10);
        if (num < 100) return roomStr.length <= 2 ? num : Math.floor(num / 100);
        return Math.floor(num / 100);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
            case 'occupied': return 'text-amber-700 bg-amber-50 border-amber-100';
            case 'maintenance': return 'text-purple-700 bg-purple-50 border-purple-100';
            default: return 'text-gray-700 bg-gray-50 border-gray-100';
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

    const filteredRooms = rooms.filter(room => {
        const r = room as any;
        const roomNumberStr = r.roomNumber?.toString() || r.name?.toString() || '';
        const roomTypeStr = r.roomTypeId?.name || r.roomType || '';
        const searchInput = searchTerm.toLowerCase();

        const matchesSearch = roomNumberStr.toLowerCase().includes(searchInput) ||
            roomTypeStr.toLowerCase().includes(searchInput);

        const matchesType = filterRoomTypeId === 'All' ||
            String(r.roomTypeId?._id || r.roomTypeId) === filterRoomTypeId;

        const matchesStatus = filterStatus === 'All' || r.status === filterStatus;

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

        return matchesSearch && matchesType && matchesStatus && isAvailableInDateRange;
    }).sort((a, b) => {
        const numA = (a as any).roomNumber?.toString() || '';
        const numB = (b as any).roomNumber?.toString() || '';
        return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
    });

    const getStats = () => {
        const total = rooms.length;
        const available = rooms.filter((r: any) => (r.status === 'available')).length;
        const occupied = rooms.filter((r: any) => r.status === 'occupied').length;
        const maintenance = rooms.filter((r: any) => r.status === 'maintenance').length;
        return { total, available, occupied, maintenance };
    };

    const stats = getStats();
    const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);
    const paginatedRooms = filteredRooms.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const clearFilters = () => {
        setSearchTerm('');
        setFilterRoomTypeId('All');
        setFilterStatus('All');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const openDetail = (room: Room) => {
        setSelectedRoom(room);
        setIsDetailOpen(true);
    };

    const openHistoryModal = (e: React.MouseEvent, room: any) => {
        e.stopPropagation();
        setHistoryRoom(room);
        setIsHistoryModalOpen(true);
    };

    const parseAmenities = (amenities: any): string[] => {
        if (!amenities) return [];
        if (typeof amenities === 'string') {
            try {
                const parsed = JSON.parse(amenities);
                return Object.entries(parsed)
                    .filter(([k, v]) => v === true && k !== '_id')
                    .map(([k]) => k);
            } catch (e) { return []; }
        }
        if (typeof amenities === 'object') {
            return Object.entries(amenities).filter(([k, v]) => v === true && k !== '_id').map(([k]) => k);
        }
        return [];
    };

    const amenityLabels: Record<string, string> = {
        wifi: 'Wi-Fi', airConditioner: 'Điều hòa', breakfast: 'Ăn sáng',
        minibar: 'Minibar', tv: 'TV', balcony: 'Ban công'
    };

    return (
        <div className="p-8 bg-[#f5f7f9] min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#2c2f31] tracking-tight font-['Manrope',sans-serif]">Tình trạng phòng</h1>
                        <p className="text-[#595c5e] mt-1 font-medium font-['Inter',sans-serif]">Theo dõi trạng thái sẵn có và vận hành phòng thực tế của khách sạn.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => dispatch(fetchAllRoomsThunk())}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#d9dde0] rounded-xl text-sm font-bold text-[#4e5c71] hover:bg-[#eef1f3] transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">refresh</span> Làm mới dữ liệu
                        </button>
                    </div>
                </div>

                {/* Stats Section - Bento Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                                <span className="material-symbols-outlined text-2xl">hotel</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng số phòng</p>
                                <h3 className="text-2xl font-black text-slate-800">{stats.total}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <span className="material-symbols-outlined text-2xl">check_circle</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Đang trống</p>
                                <h3 className="text-2xl font-black text-emerald-600">{stats.available}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                <span className="material-symbols-outlined text-2xl">person_pin</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Đang có khách</p>
                                <h3 className="text-2xl font-black text-amber-600">{stats.occupied}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                                <span className="material-symbols-outlined text-2xl">construction</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Bảo trì</p>
                                <h3 className="text-2xl font-black text-purple-600">{stats.maintenance}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Bento */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100/50 p-6 mb-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <div className="lg:col-span-2">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Tìm kiếm phòng</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-xl">search</span>
                                    <input
                                        type="text"
                                        placeholder="Số phòng hoặc hạng phòng..."
                                        className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] border border-slate-200 focus:border-[#0050d4] rounded-2xl text-sm font-bold text-[#2c2f31] focus:ring-4 focus:ring-[#0050d4]/5 transition-all outline-none"
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-1">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Trạng thái</label>
                                <select
                                    className="w-full px-4 py-3 bg-[#f8fafc] border border-slate-200 focus:border-[#0050d4] rounded-2xl text-sm font-bold text-[#2c2f31] focus:ring-4 focus:ring-[#0050d4]/5 transition-all cursor-pointer outline-none appearance-none"
                                    value={filterStatus}
                                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                >
                                    <option value="All">Tất cả trạng thái</option>
                                    <option value="available">Sẵn sàng (Trống)</option>
                                    <option value="occupied">Đang ở (Có khách)</option>
                                    <option value="maintenance">Bảo trì (Sửa chữa)</option>
                                </select>
                            </div>

                            <div className="lg:col-span-1">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Loại phòng</label>
                                <select
                                    className="w-full px-4 py-3 bg-[#f8fafc] border border-slate-200 focus:border-[#0050d4] rounded-2xl text-sm font-bold text-[#2c2f31] focus:ring-4 focus:ring-[#0050d4]/5 transition-all cursor-pointer outline-none appearance-none"
                                    value={filterRoomTypeId}
                                    onChange={(e) => { setFilterRoomTypeId(e.target.value); setCurrentPage(1); }}
                                >
                                    <option value="All">Tất cả hạng phòng</option>
                                    {roomTypes.map((type: any) => (
                                        <option key={type._id} value={type._id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-end gap-4 border-t border-slate-100 pt-6">
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Kiểm tra trống từ</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-xl">calendar_today</span>
                                    <input
                                        type="date"
                                        className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] border border-slate-200 focus:border-[#0050d4] rounded-2xl text-sm font-bold text-[#2c2f31] focus:ring-4 focus:ring-[#0050d4]/5 transition-all outline-none"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Đến ngày</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-xl">event</span>
                                    <input
                                        type="date"
                                        className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] border border-slate-200 focus:border-[#0050d4] rounded-2xl text-sm font-bold text-[#2c2f31] focus:ring-4 focus:ring-[#0050d4]/5 transition-all outline-none"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            {(startDate || endDate || searchTerm || filterRoomTypeId !== 'All' || filterStatus !== 'All') && (
                                <button
                                    onClick={clearFilters}
                                    className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all font-bold text-sm flex items-center gap-2 whitespace-nowrap"
                                >
                                    <span className="material-symbols-outlined text-lg">filter_alt_off</span>
                                    Xóa lọc
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Room List Table */}
                <div className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#f5f7f9]/50 border-b border-[#e5e9eb]">
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Thông tin phòng</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Phân loại & Quy mô</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Giá niêm yết</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Trạng thái thực tế</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest text-right font-['Manrope',sans-serif]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e9eb]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 border-4 border-[#0050d4] border-t-transparent rounded-full animate-spin mb-4"></div>
                                                <p className="text-sm font-bold text-[#747779]">Đang cập nhật trạng thái...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedRooms.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <span className="material-symbols-outlined text-5xl text-[#abadaf] mb-3">meeting_room</span>
                                            <p className="text-sm font-bold text-[#747779]">Không tìm thấy phòng nào phù hợp.</p>
                                        </td>
                                    </tr>
                                ) : paginatedRooms.map((room) => {
                                    const roomData = room as any;
                                    const statusObj = {
                                        text: getStatusLabel(roomData.status),
                                        style: getStatusColor(roomData.status),
                                        icon: roomData.status === 'available' ? 'check_circle' : roomData.status === 'occupied' ? 'person' : 'construction'
                                    };
                                    const amenities = roomData.roomTypeId?.amenities;
                                    const amenityList = parseAmenities(amenities);

                                    return (
                                        <tr key={room._id} className="hover:bg-[#f5f7f9] transition-all duration-300 group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-[#0050d4] to-[#0046bb] rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/10 group-hover:scale-110 transition-transform">
                                                        {roomData.roomNumber}
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-bold text-[#2c2f31] font-['Manrope',sans-serif]">Phòng {roomData.roomNumber}</p>
                                                        <p className="text-[11px] text-[#747779] font-bold uppercase tracking-wide mt-0.5">Tầng {getFloorFromRoomNumber(roomData.roomNumber)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-bold text-[#4e5c71]">{roomData.roomTypeId?.name || 'CPD'}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[11px] font-bold text-[#747779] flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">groups</span> {roomData.roomTypeId?.capacity || 2} Khách
                                                    </span>
                                                    <span className="text-[#d9dde0]">|</span>
                                                    <span className="text-[11px] font-bold text-[#747779] flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">square_foot</span> {roomData.roomTypeId?.size || 0}m²
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-['Manrope',sans-serif]">
                                                <p className="text-sm font-extrabold text-[#2c2f31]">
                                                    {new Intl.NumberFormat('vi-VN').format(roomData.roomTypeId?.basePrice || 0)}₫
                                                </p>
                                                <p className="text-[10px] text-[#abadaf] font-bold uppercase tracking-widest mt-0.5">Theo ngày</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusObj.style}`}>
                                                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{statusObj.icon}</span>
                                                    {statusObj.text}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={(e) => openHistoryModal(e, room)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#d9dde0] text-[#747779] hover:text-[#0050d4] hover:border-[#0050d4] hover:bg-blue-50 transition-all shadow-sm active:scale-95"
                                                        title="Lịch sử đặt"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openDetail(room); }}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#0050d4]/10 border border-[#0050d4]/20 text-[#0050d4] hover:bg-[#0050d4] hover:text-white transition-all shadow-sm active:scale-95"
                                                        title="Xem chi tiết"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {filteredRooms.length > ITEMS_PER_PAGE && (
                    <div className="mt-8 flex justify-center">
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

            {/* Detail Modal & History Modal Code stays as before but with adjusted styling... */}
            {isDetailOpen && selectedRoom && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2c2f31]/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                            <img
                                src={(selectedRoom as any).roomTypeId?.image || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=800&h=600&fit=crop'}
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                alt={selectedRoom.roomNumber}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <button 
                                onClick={() => setIsDetailOpen(false)} 
                                className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                            <div className="absolute bottom-6 left-8">
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 inline-block">Thông tin chi tiết vận hành</span>
                                <h2 className="text-3xl font-extrabold text-white tracking-tight font-['Manrope',sans-serif]">Phòng {selectedRoom.roomNumber}</h2>
                                <p className="text-white/80 text-sm font-medium">{(selectedRoom as any).roomTypeId?.name || 'Standard'}</p>
                            </div>
                        </div>

                        <div className="p-10">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-10">
                                {[
                                    { label: 'Sức chứa', val: `${(selectedRoom as any).roomTypeId?.capacity || 2} Khách`, icon: 'person' },
                                    { label: 'Diện tích', val: `${(selectedRoom as any).roomTypeId?.size || 0} m²`, icon: 'view_quilt' },
                                    { label: 'Giường', val: (selectedRoom as any).roomTypeId?.bedType || 'Tiêu chuẩn', icon: 'bed' },
                                    { label: 'Trạng thái', val: getStatusLabel((selectedRoom as any).status), icon: 'info' },
                                    { label: 'Giá niêm yết', val: `${new Intl.NumberFormat('vi-VN').format((selectedRoom as any).roomTypeId?.basePrice || 0)}₫`, icon: 'payments', highlight: true }
                                ].map((spec, i) => (
                                    <div key={i} className={spec.highlight ? 'col-span-2 sm:col-span-2' : ''}>
                                        <p className="text-[10px] font-bold text-[#abadaf] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[14px]">{spec.icon}</span> {spec.label}
                                        </p>
                                        <p className={`font-bold font-['Manrope',sans-serif] ${spec.highlight ? 'text-2xl text-[#0050d4]' : 'text-slate-800'}`}>{spec.val}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mb-10">
                                <p className="text-[10px] font-bold text-[#abadaf] uppercase tracking-widest mb-4">Các tiện nghi đính kèm</p>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const amenities = (selectedRoom as any).roomTypeId?.amenities;
                                        const amenityList = parseAmenities(amenities);
                                        return amenityList.length > 0 ? amenityList.map((key) => (
                                            <span key={key} className="text-xs font-bold text-[#4e5c71] bg-[#f5f7f9] border border-[#e5e9eb] px-4 py-2 rounded-xl">
                                                {amenityLabels[key] || key}
                                            </span>
                                        )) : <p className="text-sm font-medium text-gray-400">Không có dữ liệu tiện nghi.</p>;
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isHistoryModalOpen && historyRoom && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2c2f31]/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                        <div className="px-8 py-6 border-b border-[#e5e9eb] flex justify-between items-center bg-[#f5f7f9]/50">
                            <div>
                                <h2 className="text-xl font-bold text-[#2c2f31] font-['Manrope',sans-serif]">Nhật ký đặt phòng {historyRoom.roomNumber}</h2>
                                <p className="text-[11px] text-[#747779] font-bold uppercase tracking-widest">Lịch sử và các đơn sắp tới</p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center text-[#abadaf] hover:text-[#2c2f31] transition-all">&times;</button>
                        </div>

                        <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                            {getRoomBookings(historyRoom._id).length > 0 ? (
                                <div className="space-y-4">
                                    {getRoomBookings(historyRoom._id).map((b: any, idx: number) => (
                                        <div key={idx} className="p-5 bg-white border border-[#e5e9eb] rounded-2xl hover:border-[#0050d4]/30 hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-[#abadaf] uppercase tracking-tighter mb-1">Thời gian lưu trú</p>
                                                    <p className="text-sm font-extrabold text-[#2c2f31] font-['Manrope',sans-serif]">
                                                        {new Date(b.checkInDate).toLocaleDateString('vi-VN')} – {new Date(b.checkOutDate).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${b.status === 'completed' || b.status === 'checked_out' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {b.status === 'completed' || b.status === 'checked_out' ? 'Đã hoàn tất' : 'Đã xác nhận'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-[#f5f7f9] text-[#747779] rounded-full flex items-center justify-center text-[10px] font-bold uppercase tracking-tighter">
                                                    {b.customerInfo?.name?.charAt(0) || 'K'}
                                                </div>
                                                <p className="text-xs font-bold text-[#4e5c71]">{b.customerInfo?.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <span className="material-symbols-outlined text-5xl text-[#d9dde0] mb-4">event_busy</span>
                                    <p className="text-sm font-bold text-[#abadaf]">Không có dữ liệu lịch đặt phòng.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-[#f5f7f9]/50 border-t border-[#e5e9eb] flex justify-end">
                            <button onClick={() => setIsHistoryModalOpen(false)} className="px-6 py-2 bg-white border border-[#d9dde0] rounded-xl text-sm font-bold text-[#4e5c71] hover:bg-gray-100 transition-all shadow-sm">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomStaff;