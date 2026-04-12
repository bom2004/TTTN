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
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 5;
    const [selectedType, setSelectedType] = useState<RoomType | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

    useEffect(() => {
        dispatch(fetchAllRoomTypesThunk()).unwrap().catch(() => toast.error("Lỗi khi tải danh sách loại phòng"));
        dispatch(fetchAllRoomsThunk()).unwrap().catch(() => { });
    }, [dispatch]);

    const filteredTypes = roomTypes.filter(type => {
        const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || 
            (filterStatus === 'active' && type.isActive) || 
            (filterStatus === 'inactive' && !type.isActive);
        return matchesSearch && matchesStatus;
    });

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
            ? { text: 'Đang kinh doanh', color: 'text-emerald-700 bg-emerald-50 border-emerald-100', icon: 'check_circle' }
            : { text: 'Tạm ngưng', color: 'text-rose-700 bg-rose-50 border-rose-100', icon: 'pause_circle' };
    };

    return (
        <div className="p-8 bg-[#f5f7f9] min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#2c2f31] tracking-tight font-['Manrope',sans-serif]">Thông tin loại phòng</h1>
                        <p className="text-[#595c5e] mt-1 font-medium font-['Inter',sans-serif]">Xem chi tiết định danh, tiêu chuẩn và cấu hình hạ tầng cho từng hạng phòng.</p>
                    </div>
                </div>

                {/* Search Bar Bento */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100/50 p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative flex-[2] w-full">
                            <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Tìm kiếm loại phòng</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-xl">search</span>
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên hạng phòng (Vd: Deluxe, Suite...)"
                                    className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] border border-slate-200 focus:border-[#0050d4] rounded-2xl text-sm font-bold text-[#2c2f31] focus:ring-4 focus:ring-[#0050d4]/5 transition-all outline-none"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Trạng thái kinh doanh</label>
                            <select
                                className="w-full px-4 py-3 bg-[#f8fafc] border border-slate-200 focus:border-[#0050d4] rounded-2xl text-sm font-bold text-[#2c2f31] focus:ring-4 focus:ring-[#0050d4]/5 transition-all cursor-pointer outline-none appearance-none"
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="All">Tất cả trạng thái</option>
                                <option value="active">Đang kinh doanh</option>
                                <option value="inactive">Tạm ngưng</option>
                            </select>
                        </div>

                        {(searchTerm || filterStatus !== 'All') && (
                            <div className="self-end pb-1">
                                <button 
                                    onClick={() => { setSearchTerm(''); setFilterStatus('All'); }}
                                    className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-rose-100 transition-all uppercase tracking-wider"
                                >
                                    <span className="material-symbols-outlined text-lg">filter_alt_off</span>
                                    Xóa lọc
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#f5f7f9]/50 border-b border-[#e5e9eb]">
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Hạng phòng & Mô tả</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Giá niêm yết</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Số lượng phòng</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Trạng thái</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest text-right font-['Manrope',sans-serif]">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e9eb]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 border-4 border-[#0050d4] border-t-transparent rounded-full animate-spin mb-4"></div>
                                                <p className="text-sm font-bold text-[#747779]">Đang tải dữ liệu...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTypes.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <span className="material-symbols-outlined text-5xl text-[#abadaf] mb-3">category</span>
                                            <p className="text-sm font-bold text-[#747779]">Không tìm thấy loại phòng nào phù hợp.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTypes.map((type) => {
                                        const roomsInType = getRoomsByType(type.name);
                                        const statusBadge = getStatusBadge(type.isActive);
                                        return (
                                            <tr key={type._id} className="hover:bg-[#f5f7f9] transition-all duration-300" onClick={() => openDetail(type)}>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                                                            <img
                                                                src={type.image || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=100&h=100&fit=crop'}
                                                                className="w-full h-full object-cover transition-transform hover:scale-110 duration-500"
                                                                alt={type.name}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-bold text-[#2c2f31] font-['Manrope',sans-serif]">{type.name}</p>
                                                            <p className="text-xs text-[#747779] font-medium line-clamp-1 max-w-[300px]">
                                                                {type.description || 'Chưa cung cấp mô tả chi tiết cho loại phòng này.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 font-['Manrope',sans-serif]">
                                                    <p className="text-base font-extrabold text-[#2c2f31]">
                                                        {new Intl.NumberFormat('vi-VN').format(type.basePrice)}₫
                                                    </p>
                                                    <p className="text-[10px] text-[#abadaf] font-bold uppercase tracking-widest mt-0.5">Mỗi đêm nghỉ</p>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-bold text-[#4e5c71]">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-sm">meeting_room</span>
                                                        {roomsInType.length} phòng hiện có
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge.color}`}>
                                                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{statusBadge.icon}</span>
                                                        {statusBadge.text}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openDetail(type); }}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#0050d4]/10 border border-[#0050d4]/20 text-[#0050d4] hover:bg-[#0050d4] hover:text-white transition-all shadow-sm active:scale-95"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {filteredTypes.length > ITEMS_PER_PAGE && (
                    <div className="mt-8 flex justify-center">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredTypes.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}

                {/* Premium Detail Modal */}
                {isDetailOpen && selectedType && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2c2f31]/60 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                                <img
                                    src={selectedType.image || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=800&h=600&fit=crop'}
                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                    alt={selectedType.name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                <button 
                                    onClick={() => setIsDetailOpen(false)} 
                                    className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                                <div className="absolute bottom-6 left-8">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 inline-block">Chi tiết loại phòng</span>
                                    <h2 className="text-3xl font-extrabold text-white tracking-tight font-['Manrope',sans-serif]">{selectedType.name}</h2>
                                    <p className="text-white/80 text-sm font-medium">Cấu hình tiêu chuẩn hạng {selectedType.name}</p>
                                </div>
                            </div>

                            <div className="p-10">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-10">
                                    {[
                                        { label: 'Sức chứa', val: `${selectedType.capacity || 2} Khách`, icon: 'person' },
                                        { label: 'Diện tích', val: `${selectedType.size || 0} m²`, icon: 'view_quilt' },
                                        { label: 'Giường', val: selectedType.bedType || 'Tiêu chuẩn', icon: 'bed' },
                                        { label: 'Hướng nhìn', val: selectedType.view || 'Hướng phố', icon: 'visibility' },
                                        { label: 'Giá niêm yết', val: `${new Intl.NumberFormat('vi-VN').format(selectedType.basePrice)}₫`, icon: 'payments', highlight: true }
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
                                    <p className="text-[10px] font-bold text-[#abadaf] uppercase tracking-widest mb-4 font-['Manrope',sans-serif]">Tiện nghi hạng phòng</p>
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
                                            return amenityList.length > 0 ? amenityList.map(([key]) => (
                                                <span key={key} className="text-xs font-bold text-[#4e5c71] bg-[#f5f7f9] border border-[#e5e9eb] px-4 py-2 rounded-xl">
                                                    {amenityLabels[key] || key}
                                                </span>
                                            )) : <p className="text-sm font-medium text-gray-400">Không có thông tin tiện nghi.</p>;
                                        })()}
                                    </div>
                                </div>

                                <div className="mb-10">
                                    <p className="text-[10px] font-bold text-[#abadaf] uppercase tracking-widest mb-3">Thông tin chi tiết</p>
                                    <p className="text-sm text-[#595c5e] font-medium leading-relaxed font-['Inter',sans-serif]">
                                        {selectedType.description || 'Chưa có mô tả chi tiết cho loại phòng này.'}
                                    </p>
                                </div>

                                <div className="border-t border-[#e5e9eb] pt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#abadaf] text-sm">info</span>
                                        <p className="text-[10px] text-[#abadaf] font-bold uppercase tracking-widest">
                                            Chế độ xem nhân viên (Không quyền chỉnh sửa)
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setIsDetailOpen(false)}
                                        className="px-6 py-2 bg-[#f5f7f9] text-[#747779] text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-[#eef1f3] transition-all"
                                    >
                                        Đóng lại
                                    </button>
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