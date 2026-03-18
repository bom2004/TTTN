import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, RoomType, Room } from '../../types';
import Pagination from '../../admin/components/Pagination';

const RoomTypeStaff: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [allRooms, setAllRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 6;
    const [selectedType, setSelectedType] = useState<RoomType | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

    const fetchData = async (): Promise<void> => {
        setLoading(true);
        try {
            const [typesRes, roomsRes] = await Promise.all([
                axios.get<ApiResponse<RoomType[]>>(`${backendUrl}/api/room-types`),
                axios.get<ApiResponse<Room[]>>(`${backendUrl}/api/rooms`)
            ]);
            
            if (typesRes.data.success && typesRes.data.data) {
                setRoomTypes(typesRes.data.data);
            }
            if (roomsRes.data.success && roomsRes.data.data) {
                setAllRooms(roomsRes.data.data);
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Không thể tải danh sách loại phòng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalPages = Math.ceil(roomTypes.length / ITEMS_PER_PAGE);
    const paginatedTypes = roomTypes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getRoomsByType = (typeName: string) => {
        return allRooms.filter(room => room.roomType === typeName);
    };

    const openDetail = (type: RoomType) => {
        setSelectedType(type);
        setIsDetailOpen(true);
    };

    return (
        <div className="p-8 bg-[#f5f5f5] min-h-screen font-sans text-left">
            <div className="max-w-[1600px] mx-auto">
                <header className="mb-10 text-left">
                    <h1 className="text-3xl font-[900] text-[#003580] tracking-tight">Chi tiết loại phòng</h1>
                    <p className="text-sm font-medium text-gray-500">Xem thông tin định danh và tiêu chuẩn các loại phòng hiện có.</p>
                </header>

                {loading ? (
                    <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                         <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Đang tải danh sách loại phòng...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {paginatedTypes.map((type) => {
                                const roomsInType = getRoomsByType(type.name);
                                const availableCount = roomsInType.filter(r => r.status === 'available').length;
                                
                                return (
                                    <div 
                                        key={type._id} 
                                        onClick={() => openDetail(type)}
                                        className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 group relative cursor-pointer group"
                                    >
                                        <div className="relative h-64 overflow-hidden">
                                            <img 
                                                src={type.image || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=400'} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                                alt={type.name} 
                                            />
                                            <div className="absolute top-6 left-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl border border-white/30">
                                                {type.isActive ? 'Đang kinh doanh' : 'Tạm dừng'}
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                                                <button className="w-full py-4 bg-white text-[#003580] rounded-[20px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl">
                                                    <span>Xem chi tiết</span>
                                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-10">
                                            <div className="flex justify-between items-start mb-6">
                                                <h3 className="text-2xl font-black text-[#003580] tracking-tight group-hover:text-blue-600 transition-colors leading-tight">{type.name}</h3>
                                            </div>
                                            <p className="text-sm text-gray-400 font-medium leading-relaxed line-clamp-2 mb-8 h-10">
                                                {type.description || "Chưa có mô tả chi tiết cho loại phòng này."}
                                            </p>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá bán thẻ</p>
                                                    <p className="text-sm font-black text-[#003580]">{new Intl.NumberFormat('vi-VN').format(type.basePrice)}₫</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Số phòng</p>
                                                    <p className="text-sm font-black text-[#003580]">{roomsInType.length || 0} Phòng</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-12">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={roomTypes.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </>
                )}

                {/* Modal Detail */}
                {isDetailOpen && selectedType && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#001533]/80 backdrop-blur-md">
                        <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300 flex flex-col">
                            <div className="relative h-80 shrink-0">
                                <img src={selectedType.image} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                                <button 
                                    onClick={() => setIsDetailOpen(false)}
                                    className="absolute top-8 right-8 w-14 h-14 bg-black/20 hover:bg-black/40 backdrop-blur-xl rounded-[24px] flex items-center justify-center text-white transition-all active:scale-90 z-20"
                                >
                                    <span className="material-symbols-outlined text-2xl">close</span>
                                </button>
                                <div className="absolute bottom-0 left-0 p-12 text-left w-full">
                                    <span className="bg-[#003580] text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-4 inline-block shadow-2xl">QUICKSTAY STANDARDS</span>
                                    <h2 className="text-5xl font-black text-[#003580] tracking-tighter mt-2">{selectedType.name}</h2>
                                </div>
                            </div>
                            
                            <div className="p-12 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-3 gap-12">
                                <div className="lg:col-span-2 space-y-8 text-left">
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Tổng quan loại phòng</h4>
                                        <p className="text-lg text-gray-600 font-medium leading-[1.8] text-justify">
                                            {selectedType.description || "Đây là loại phòng tiêu chuẩn với đầy đủ các tiện ích cần thiết cho một kỳ nghỉ thoải mái. Tận hưởng không gian thiết kế hiện đại cùng dịch vụ chăm sóc khách hàng hàng đầu từ QuickStay. Mỗi chi tiết đều được chúng tôi chuẩn bị kỹ lưỡng để mang lại trải nghiệm tốt nhất."}
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                                            <span className="material-symbols-outlined text-[#006ce4] mb-3">payments</span>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Đơn giá cơ sở</p>
                                            <p className="text-2xl font-black text-[#003580]">{new Intl.NumberFormat('vi-VN').format(selectedType.basePrice)}₫</p>
                                            <p className="text-[10px] font-bold text-gray-400 mt-1">Chưa bao gồm phụ phí & VAT</p>
                                        </div>
                                        <div className="p-6 bg-[#006ce4]/5 rounded-[32px] border border-[#006ce4]/10">
                                            <span className="material-symbols-outlined text-[#006ce4] mb-3">inventory_2</span>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hiện diện hệ thống</p>
                                            <p className="text-2xl font-black text-[#006ce4]">{getRoomsByType(selectedType.name).length} Phòng</p>
                                            <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter italic">Cập nhật thời gian thực</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-8 text-left">
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Mô hình vận hành</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 group">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">✓</div>
                                                <span className="text-sm font-black text-gray-700">Thanh toán trực tuyến</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">✓</div>
                                                <span className="text-sm font-black text-gray-700">Hỗ trợ check-in nhanh</span>
                                            </div>
                                            <div className="flex items-center gap-4 opacity-40">
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center font-black">✕</div>
                                                <span className="text-sm font-black text-gray-700">Không hỗ trợ vật nuôi</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-[#003580] rounded-[32px] text-white">
                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Trạng thái hiện tại</p>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${selectedType.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
                                            <span className="text-lg font-black uppercase tracking-widest">{selectedType.isActive ? 'HOẠT ĐỘNG' : 'TẠM DỪNG'}</span>
                                        </div>
                                        <p className="text-[9px] font-medium text-white/40 mt-4 leading-relaxed uppercase tracking-widest italic">Lưu ý: Nhân viên chỉ có quyền xem thông tin, không thể sửa đổi thông số quản lý.</p>
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
