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
            if (b.assignedRooms && b.assignedRooms.includes(roomId)) return true;
            if (b.details && b.details.some((d: any) => (String(d.roomId?._id) === roomId || String(d.roomId) === roomId))) return true;
            return false;
        }).sort((a: any, b: any) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
    };

    const openHistoryModal = (e: React.MouseEvent, room: any) => {
        e.stopPropagation();
        setHistoryRoom(room);
        setIsHistoryModalOpen(true);
    };

    const getStatusBadge = (room: any) => {
        const now = new Date();
        const hasUpcomingBooking = getRoomBookings(room._id).some((b: any) =>
            new Date(b.checkInDate) <= now && new Date(b.checkOutDate) >= now
        );

        if (hasUpcomingBooking) {
            return { text: 'Đang có khách', color: 'text-amber-600 bg-amber-50' };
        }
        return { text: 'Sẵn sàng', color: 'text-emerald-600 bg-emerald-50' };
    };

    const filteredRooms = rooms.filter(room => {
        const r = room as any;
        const roomNumberStr = r.roomNumber?.toString() || '';
        const roomTypeStr = r.roomTypeId?.name || r.roomType || '';
        const searchInput = searchTerm.toLowerCase();

        const matchesSearch = roomNumberStr.toLowerCase().includes(searchInput) ||
            roomTypeStr.toLowerCase().includes(searchInput);

        const matchesType = filterRoomTypeId === 'All' ||
            String(r.roomTypeId?._id || r.roomTypeId) === filterRoomTypeId ||
            String(r.roomTypeId?.name) === filterRoomTypeId ||
            String(r.roomType) === filterRoomTypeId;

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
    }).sort((a, b) => {
        const numA = (a as any).roomNumber?.toString() || '';
        const numB = (b as any).roomNumber?.toString() || '';
        return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
    });

    const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);
    const paginatedRooms = filteredRooms.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const clearFilters = () => {
        setSearchTerm('');
        setFilterRoomTypeId('All');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const openDetail = (room: Room) => {
        setSelectedRoom(room);
        setIsDetailOpen(true);
    };

    const parseAmenities = (amenities: any): string[] => {
        if (!amenities) return [];
        if (typeof amenities === 'string') {
            try {
                const parsed = JSON.parse(amenities);
                return Object.entries(parsed)
                    .filter(([k, v]) => v === true && k !== '_id')
                    .map(([k]) => k);
            } catch (e) {
                return [];
            }
        }
        if (typeof amenities === 'object') {
            return Object.entries(amenities)
                .filter(([k, v]) => v === true && k !== '_id')
                .map(([k]) => k);
        }
        return [];
    };

    const amenityLabels: Record<string, string> = {
        wifi: 'Wi-Fi',
        airConditioner: 'Điều hòa',
        breakfast: 'Ăn sáng',
        minibar: 'Minibar',
        tv: 'TV',
        balcony: 'Ban công'
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Tình trạng phòng</h1>
                    <p className="text-sm text-gray-500 mt-1">Xem trạng thái sẵn có và thông tin chi tiết các phòng</p>
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
                                {roomTypes.map((type: any) => (
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

                {/* Table */}
                {loading ? (
                    <div className="text-center py-12 bg-white rounded-md border border-gray-200">
                        <p className="text-gray-400 text-sm">Đang tải...</p>
                    </div>
                ) : filteredRooms.length === 0 ? (
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
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tiện nghi</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Giá / Ngày</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedRooms.map((room) => {
                                    const status = getStatusBadge(room);
                                    const roomData = room as any;
                                    const amenities = roomData.roomTypeId?.amenities;
                                    const amenityList = parseAmenities(amenities);

                                    return (
                                        <tr
                                            key={room._id}
                                            onClick={() => openDetail(room)}
                                            className="hover:bg-gray-50 transition cursor-pointer"
                                        >
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">Phòng {roomData.roomNumber}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        Tầng: {roomData.roomNumber?.charAt(0) || '?'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-gray-700">{roomData.roomTypeId?.name || 'Chưa xác định'}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-400">
                                                            {roomData.roomTypeId?.capacity || 2} người
                                                        </span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-xs text-gray-400">
                                                            {roomData.roomTypeId?.size || 0}m²
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {amenityList.slice(0, 3).map((key, idx) => (
                                                        <span key={idx} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                            {amenityLabels[key] || key}
                                                        </span>
                                                    ))}
                                                    {amenityList.length > 3 && (
                                                        <span className="text-[10px] text-gray-400">+{amenityList.length - 3}</span>
                                                    )}
                                                    {amenityList.length === 0 && (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-gray-900">
                                                    {new Intl.NumberFormat('vi-VN').format(roomData.roomTypeId?.basePrice || 0)}₫
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={(e) => openHistoryModal(e, room)}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                                                        title="Lịch đặt"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openDetail(room)}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                                                        title="Chi tiết"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
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

            {/* Modal Detail Room */}
            {isDetailOpen && selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
                    <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Chi tiết phòng {selectedRoom.roomNumber}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {(selectedRoom as any).roomTypeId?.name || 'Thông tin phòng'}
                                </p>
                            </div>
                            <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Image */}
                            <div className="w-full h-48 rounded-md overflow-hidden bg-gray-100">
                                <img
                                    src={(selectedRoom as any).roomTypeId?.image || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=600&h=400&fit=crop'}
                                    className="w-full h-full object-cover"
                                    alt={selectedRoom.roomNumber}
                                />
                            </div>

                            {/* Room Info Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase">Số phòng</p>
                                    <p className="font-medium text-gray-900 mt-1">{selectedRoom.roomNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase">Loại phòng</p>
                                    <p className="font-medium text-gray-900 mt-1">{(selectedRoom as any).roomTypeId?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase">Sức chứa</p>
                                    <p className="font-medium text-gray-900 mt-1">{(selectedRoom as any).roomTypeId?.capacity || 2} người</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase">Diện tích</p>
                                    <p className="font-medium text-gray-900 mt-1">{(selectedRoom as any).roomTypeId?.size || 0} m²</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase">Loại giường</p>
                                    <p className="font-medium text-gray-900 mt-1">{(selectedRoom as any).roomTypeId?.bedType || 'Tiêu chuẩn'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase">Hướng nhìn</p>
                                    <p className="font-medium text-gray-900 mt-1">{(selectedRoom as any).roomTypeId?.view || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs font-medium text-gray-400 uppercase">Giá cơ bản</p>
                                    <p className="font-bold text-xl text-gray-900 mt-1">
                                        {new Intl.NumberFormat('vi-VN').format((selectedRoom as any).roomTypeId?.basePrice || 0)}₫
                                        <span className="text-sm font-normal text-gray-400 ml-1">/ngày</span>
                                    </p>
                                </div>
                            </div>

                            {/* Amenities */}
                            <div className="border-t pt-4">
                                <p className="text-xs font-medium text-gray-400 uppercase mb-2">Tiện nghi</p>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const amenities = (selectedRoom as any).roomTypeId?.amenities;
                                        const amenityList = parseAmenities(amenities);

                                        return amenityList.length > 0 ? (
                                            amenityList.map((key) => (
                                                <span key={key} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                    {amenityLabels[key] || key}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">Chưa có thông tin tiện nghi</p>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="border-t pt-4">
                                <p className="text-xs font-medium text-gray-400 uppercase mb-2">Mô tả</p>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {(selectedRoom as any).roomTypeId?.description || 'Chưa có mô tả cho loại phòng này.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Lịch sử đặt phòng */}
            {isHistoryModalOpen && historyRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-xl max-h-[80vh] overflow-hidden">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Lịch đặt phòng {historyRoom.name || historyRoom.roomNumber}
                                </h2>
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

export default RoomStaff;