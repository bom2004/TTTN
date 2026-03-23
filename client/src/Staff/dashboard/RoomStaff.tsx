import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, Room, RoomType } from '../../types';
import Pagination from '../../admin/components/Pagination';

const RoomStaff: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 6;

    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

    const fetchData = async (): Promise<void> => {
        setLoading(true);
        try {
            const [roomsRes, typesRes] = await Promise.all([
                axios.get<ApiResponse<Room[]>>(`${backendUrl}/api/rooms`),
                axios.get<ApiResponse<RoomType[]>>(`${backendUrl}/api/room-types`)
            ]);
            
            if (roomsRes.data.success && roomsRes.data.data) {
                setRooms(roomsRes.data.data);
            }
            if (typesRes.data.success && typesRes.data.data) {
                setRoomTypes(typesRes.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải dữ liệu phòng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredRooms = rooms.filter(room => {
        const roomName = room.name || '';
        const roomType = room.roomType || '';
        const matchesSearch = roomName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             roomType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || room.status?.toLowerCase() === filterStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);
    const paginatedRooms = filteredRooms.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const openDetail = (room: Room) => {
        setSelectedRoom(room);
        setIsDetailOpen(true);
    };

    return (
        <div className="p-8 bg-[#f5f5f5] min-h-screen font-sans text-left">
            <div className="max-w-[1600px] mx-auto">
                <header className="mb-10 text-left">
                    <h1 className="text-3xl font-[900] text-[#003580] tracking-tight">Tình trạng phòng</h1>
                    <p className="text-sm font-medium text-gray-500">Xem trạng thái sẵn có và thông tin chi tiết các phòng (Chế độ xem nhân viên).</p>
                </header>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-wrap gap-6 items-center">
                    <div className="flex-1 relative min-w-[300px]">
                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input 
                            type="text" 
                            placeholder="Tìm tên phòng hoặc loại phòng..." 
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-black focus:ring-2 focus:ring-gray-100 outline-none transition-all placeholder:font-medium"
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="flex gap-3">
                        {['All', 'Available', 'Sold_out'].map((status) => (
                            <button
                                key={status}
                                onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                    filterStatus === status 
                                    ? 'bg-[#003580] text-white shadow-xl shadow-blue-900/20' 
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                            >
                                {status === 'All' ? 'Tất cả' : status === 'Available' ? 'Sẵn sàng' : 'Hết phòng'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                         <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Đang tải danh sách phòng...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {paginatedRooms.map((room) => (
                                <div 
                                    key={room._id} 
                                    onClick={() => openDetail(room)}
                                    className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 group relative flex flex-col h-full cursor-pointer"
                                >
                                    <div className="relative h-56 overflow-hidden">
                                        <img 
                                            src={room.thumbnail || (room as any).avatar || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=600'} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                            alt={room.name} 
                                        />
                                        <div className={`absolute top-5 left-5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md ${
                                            room.status === 'available' ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'
                                        }`}>
                                            {room.status === 'available' ? '✓ Sẵn sàng' : '✕ Hết phòng'}
                                        </div>
                                        <div className="absolute top-5 right-5 h-10 w-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/30">
                                            <span className="material-symbols-outlined text-lg">info</span>
                                        </div>
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-xl font-black text-[#003580] leading-tight line-clamp-1">{room.name}</h3>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mb-6">
                                                <span className="text-[10px] font-black text-[#006ce4] bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-widest leading-none">
                                                    {room.roomType}
                                                </span>
                                                <span className="text-[10px] font-medium text-gray-400">ID: {room._id.substring(0, 8)}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="material-symbols-outlined text-gray-300 text-lg">group</span>
                                                    <span className="text-xs font-black text-gray-600">{room.capacity} Người</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <span className="material-symbols-outlined text-gray-300 text-lg">square_foot</span>
                                                    <span className="text-xs font-black text-gray-600">{room.size}m²</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <span className="material-symbols-outlined text-gray-300 text-lg">bed</span>
                                                    <span className="text-xs font-black text-gray-600">{room.bedType}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <span className="material-symbols-outlined text-gray-300 text-lg">meeting_room</span>
                                                    <span className="text-xs font-black text-gray-600">Còn {room.availableRooms} phòng</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-gray-50 flex items-center justify-between mt-auto">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá tham khảo</p>
                                                <p className="text-xl font-black text-[#003580]">{new Intl.NumberFormat('vi-VN').format(room.price)}₫<span className="text-xs font-bold text-gray-400 ml-1">/đêm</span></p>
                                            </div>
                                            <div className={`w-3 h-3 rounded-full ${room.status === 'available' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {paginatedRooms.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
                                 <p className="text-gray-400 font-medium">Không tìm thấy phòng nào phù hợp.</p>
                            </div>
                        )}

                        <div className="mt-12">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredRooms.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Modal Detail Room */}
            {isDetailOpen && selectedRoom && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#001533]/80 backdrop-blur-md">
                    <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300 flex flex-col">
                        <div className="relative h-96 shrink-0 bg-gray-100">
                            <img 
                                src={selectedRoom.thumbnail || (selectedRoom as any).avatar || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200'} 
                                className="w-full h-full object-cover" 
                                alt={selectedRoom.name}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent"></div>
                            <button 
                                onClick={() => setIsDetailOpen(false)}
                                className="absolute top-8 right-8 w-14 h-14 bg-black/20 hover:bg-black/40 backdrop-blur-xl rounded-[24px] flex items-center justify-center text-white transition-all active:scale-90 z-20"
                            >
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                            <div className="absolute bottom-0 left-0 p-12 text-left w-full">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="bg-[#003580] text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-2xl">
                                        <span className="material-symbols-outlined text-[14px]">meeting_room</span>
                                        Phòng {selectedRoom.name}
                                    </span>
                                </div>
                                <h2 className="text-5xl font-black text-[#003580] tracking-tighter">{selectedRoom.name}</h2>
                                <p className="text-lg font-black text-[#006ce4] uppercase tracking-[0.2em] mt-2">{selectedRoom.roomType}</p>
                            </div>
                        </div>
                        
                        <div className="p-12 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-10 text-left">
                                <div className="grid grid-cols-4 gap-6">
                                    <div className="p-6 bg-gray-50 rounded-[32px] text-center">
                                        <span className="material-symbols-outlined text-[#003580] mb-2">group</span>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Sức chứa</p>
                                        <p className="text-sm font-black text-[#003580]">{selectedRoom.capacity} Người</p>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-[32px] text-center">
                                        <span className="material-symbols-outlined text-[#003580] mb-2">square_foot</span>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Diện tích</p>
                                        <p className="text-sm font-black text-[#003580]">{selectedRoom.size}m²</p>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-[32px] text-center">
                                        <span className="material-symbols-outlined text-[#003580] mb-2">bed</span>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Giường</p>
                                        <p className="text-sm font-black text-[#003580]">{selectedRoom.bedType}</p>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-[32px] text-center">
                                        <span className="material-symbols-outlined text-[#003580] mb-2">visibility</span>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Hướng nhìn</p>
                                        <p className="text-sm font-black text-[#003580]">{selectedRoom.view || 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Tiện nghi có sẵn</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedRoom.amenities && Object.entries(selectedRoom.amenities).map(([key, value]) => value && (
                                            <div key={key} className="flex items-center gap-3 px-5 py-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                                                <span className="material-symbols-outlined text-[#006ce4] text-lg">
                                                    {key === 'wifi' ? 'wifi' : key === 'airConditioner' ? 'ac_unit' : key === 'breakfast' ? 'restaurant' : key === 'minibar' ? 'local_bar' : key === 'tv' ? 'tv' : 'balcony'}
                                                </span>
                                                <span className="text-xs font-black text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Mô tả phòng</h4>
                                    <p className="text-lg text-gray-600 font-medium leading-[1.8] text-justify">
                                        {selectedRoom.description || "Phòng được thiết kế theo phong cách hiện đại, tối ưu hóa không gian và ánh sáng tự nhiên. Trang thiết bị nội thất cao cấp đảm bảo mang lại sự hài lòng tuyệt đối cho khách hàng trong suốt thời gian lưu trú."}
                                    </p>
                                </div>

                                {selectedRoom.images && selectedRoom.images.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Thư viện ảnh ({selectedRoom.images.length})</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            {selectedRoom.images.map((img, idx) => (
                                                <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-gray-100">
                                                    <img src={img} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-8 text-left">
                                <div className="p-8 bg-[#003580] rounded-[40px] text-white shadow-2xl">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-4">Thông tin doanh thu</p>
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-blue-200 uppercase mb-1 italic">Giá niêm yết mỗi đêm</p>
                                            <p className="text-3xl font-black">{new Intl.NumberFormat('vi-VN').format(selectedRoom.price)}₫</p>
                                        </div>
                                        {selectedRoom.originalPrice && (
                                            <div>
                                                <p className="text-[10px] font-bold text-blue-200 uppercase mb-1 italic">Giá gốc chưa giảm</p>
                                                <p className="text-xl font-bold line-through opacity-50">{new Intl.NumberFormat('vi-VN').format(selectedRoom.originalPrice)}₫</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-10 pt-10 border-t border-white/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Trạng thái</span>
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${selectedRoom.status === 'available' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                {selectedRoom.status === 'available' ? 'Sẵn sàng' : 'Hết phòng'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Khả dụng</span>
                                            <span className="text-lg font-black">{selectedRoom.availableRooms} Phòng trống</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-blue-50/50 rounded-[40px] border border-blue-100">
                                    <h5 className="text-[10px] font-black text-[#006ce4] uppercase tracking-widest mb-4">Ghi chú vận hành</h5>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[#006ce4] text-sm">verified_user</span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-500 leading-relaxed italic">Phòng đã được kiểm tra vệ sinh tiêu chuẩn trước khi hiển thị trạng thái sẵn sàng.</p>
                                        </li>
                                        <li className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[#006ce4] text-sm">info</span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-500 leading-relaxed italic">Trong trường hợp có sự cố kỹ thuật, nhân viên báo ngay cho bộ phận bảo trì qua hệ thống quản trị.</p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomStaff;
