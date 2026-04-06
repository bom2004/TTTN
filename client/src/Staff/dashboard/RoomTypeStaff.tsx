import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { RoomType, Room } from '../../types';
import Pagination from '../../admin/components/Pagination';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import { fetchAllRoomTypesThunk, selectAllRoomTypes, selectRoomTypeLoading } from '../../lib/redux/reducers/room-type';
import { fetchAllRoomsThunk, selectAllRooms, selectRoomLoading } from '../../lib/redux/reducers/room';

const RoomTypeStaff: React.FC = () => {
    const dispatch = useAppDispatch();
    const roomTypes = useAppSelector(selectAllRoomTypes) as unknown as RoomType[];
    const allRooms = useAppSelector(selectAllRooms) as unknown as Room[];
    const loadingTypes = useAppSelector(selectRoomTypeLoading);
    const loadingRooms = useAppSelector(selectRoomLoading);
    const loading = loadingTypes || loadingRooms;

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 5;
    const [selectedType, setSelectedType] = useState<RoomType | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

    useEffect(() => {
        dispatch(fetchAllRoomTypesThunk()).unwrap().catch(() => toast.error("Lỗi khi tải danh sách loại phòng"));
        dispatch(fetchAllRoomsThunk()).unwrap().catch(() => { });
    }, [dispatch]);

    const filteredTypes = roomTypes.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTypes.length / ITEMS_PER_PAGE);
    const paginatedTypes = filteredTypes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getRoomsByType = (typeName: string) => {
        return allRooms.filter((room: any) => room.roomTypeId?.name === typeName || room.roomType === typeName);
    };

    const openDetail = (type: RoomType) => {
        setSelectedType(type);
        setIsDetailOpen(true);
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive
            ? { text: 'Đang kinh doanh', color: 'text-emerald-600 bg-emerald-50' }
            : { text: 'Tạm ngưng', color: 'text-rose-600 bg-rose-50' };
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Chi tiết loại phòng</h1>
                    <p className="text-sm text-gray-500 mt-1">Xem thông tin định danh và tiêu chuẩn các loại phòng hiện có</p>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Tìm theo tên loại phòng..."
                        className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-12 bg-white rounded-md border border-gray-200">
                        <p className="text-gray-400 text-sm">Đang tải...</p>
                    </div>
                ) : filteredTypes.length === 0 ? (
                    <div className="bg-white rounded-md border border-gray-200 text-center py-12">
                        <p className="text-gray-400 text-sm">Không tìm thấy loại phòng nào</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thông tin</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Giá / Ngày</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Số phòng</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedTypes.map((type) => {
                                    const roomsInType = getRoomsByType(type.name);
                                    const statusBadge = getStatusBadge(type.isActive);
                                    return (
                                        <tr key={type._id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => openDetail(type)}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                        <img
                                                            src={type.image || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=100&h=100&fit=crop'}
                                                            className="w-full h-full object-cover"
                                                            alt={type.name}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{type.name}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-[250px]">
                                                            {type.description || 'Chưa có mô tả'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-gray-900">
                                                    {new Intl.NumberFormat('vi-VN').format(type.basePrice)}₫
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-gray-700">{roomsInType.length} phòng</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                                    {statusBadge.text}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openDetail(type); }}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                                                    title="Chi tiết"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
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
                {filteredTypes.length > ITEMS_PER_PAGE && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredTypes.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}

                {/* Modal Detail */}
                {isDetailOpen && selectedType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
                        <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Chi tiết loại phòng
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">{selectedType.name}</p>
                                </div>
                                <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Image */}
                                <div className="w-full h-48 rounded-md overflow-hidden bg-gray-100">
                                    <img
                                        src={selectedType.image || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=600&h=400&fit=crop'}
                                        className="w-full h-full object-cover"
                                        alt={selectedType.name}
                                    />
                                </div>

                                {/* Type Info Grid */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="col-span-2">
                                        <p className="text-xs font-medium text-gray-400 uppercase">Tên loại phòng</p>
                                        <p className="font-medium text-gray-900 mt-1">{selectedType.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase">Giá cơ bản</p>
                                        <p className="font-bold text-xl text-gray-900 mt-1">
                                            {new Intl.NumberFormat('vi-VN').format(selectedType.basePrice)}₫
                                            <span className="text-sm font-normal text-gray-400 ml-1">/ngày</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase">Số lượng phòng</p>
                                        <p className="font-medium text-gray-900 mt-1">{getRoomsByType(selectedType.name).length} phòng</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase">Sức chứa</p>
                                        <p className="font-medium text-gray-900 mt-1">{selectedType.capacity || 2} người</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase">Diện tích</p>
                                        <p className="font-medium text-gray-900 mt-1">{selectedType.size || 0} m²</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase">Loại giường</p>
                                        <p className="font-medium text-gray-900 mt-1">{selectedType.bedType || 'Tiêu chuẩn'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase">Hướng nhìn</p>
                                        <p className="font-medium text-gray-900 mt-1">{selectedType.view || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase">Trạng thái</p>
                                        <p className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${selectedType.isActive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                                            {selectedType.isActive ? 'Đang kinh doanh' : 'Tạm ngưng'}
                                        </p>
                                    </div>
                                </div>

                                {/* Amenities */}
                                <div className="border-t pt-4">
                                    <p className="text-xs font-medium text-gray-400 uppercase mb-2">Tiện nghi</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(() => {
                                            let amenities = selectedType.amenities;
                                            if (typeof amenities === 'string') {
                                                try { amenities = JSON.parse(amenities); } catch (e) { }
                                            }

                                            const amenityLabels: Record<string, string> = {
                                                wifi: 'Wi-Fi miễn phí', airConditioner: 'Điều hòa', breakfast: 'Bữa sáng',
                                                minibar: 'Minibar', tv: 'TV cáp', balcony: 'Ban công'
                                            };

                                            const amenityList = amenities && typeof amenities === 'object'
                                                ? Object.entries(amenities).filter(([k, v]) => v === true && k !== '_id')
                                                : [];

                                            return amenityList.length > 0 ? (
                                                amenityList.map(([key]) => (
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
                                        {selectedType.description || 'Chưa có mô tả cho loại phòng này.'}
                                    </p>
                                </div>

                                {/* Note */}
                                <div className="border-t pt-4">
                                    <div className="bg-gray-50 rounded-md p-3">
                                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Lưu ý</p>
                                        <p className="text-xs text-gray-400 italic">
                                            Nhân viên chỉ có quyền xem thông tin, không thể sửa đổi thông số quản lý.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomTypeStaff;