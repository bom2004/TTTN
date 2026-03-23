import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, Room, RoomType } from '../../types';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

interface RoomForm {
    name: string;
    roomType: string;
    capacity: string;
    size: string;

    bedType: string;
    view: string;
    description: string;
    price: string;
    originalPrice: string;
    availableRooms: string;
    status: 'available' | 'sold_out';
    amenities: {
        wifi: boolean;
        airConditioner: boolean;
        breakfast: boolean;
        minibar: boolean;
        tv: boolean;
        balcony: boolean;
    };
}


const RoomAdmin: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 5;
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');


    const initialFormData: RoomForm = {
        name: '',
        roomType: '',
        capacity: '2',
        size: '',

        bedType: 'King',
        view: '',
        description: '',
        price: '',
        originalPrice: '',
        availableRooms: '1',
        status: 'available',
        amenities: {
            wifi: false,
            airConditioner: false,
            breakfast: false,
            minibar: false,
            tv: false,
            balcony: false
        }
    };

    const [formData, setFormData] = useState<RoomForm>(initialFormData);


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
                setRoomTypes(typesRes.data.data.filter(t => t.isActive));
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleAmenityChange = (amenity: keyof RoomForm['amenities']): void => {
        setFormData({
            ...formData,
            amenities: {
                ...formData.amenities,
                [amenity]: !formData.amenities[amenity]
            }
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const files = e.target.files;
        if (files) {
            setGalleryFiles(files);
            const previews = Array.from(files).map(file => URL.createObjectURL(file));
            setGalleryPreviews(previews);
        }
    };


    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('roomType', formData.roomType);
            data.append('capacity', formData.capacity);
            data.append('size', formData.size);
            data.append('bedType', formData.bedType);

            data.append('view', formData.view);
            data.append('description', formData.description);
            data.append('price', formData.price);
            data.append('originalPrice', formData.originalPrice);
            data.append('availableRooms', formData.availableRooms);
            data.append('status', formData.status);
            data.append('amenities', JSON.stringify(formData.amenities));
            
            if (imageFile) data.append('thumbnail', imageFile);
            
            if (galleryFiles) {
                Array.from(galleryFiles).forEach(file => {
                    data.append('images', file);
                });
            }

            let response;
            if (isEditMode && selectedRoom) {
                response = await axios.put<ApiResponse<any>>(`${backendUrl}/api/rooms/${selectedRoom._id}`, data);
            } else {
                response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/rooms`, data);
            }

            if (response.data.success) {
                toast.success(response.data.message);
                setIsModalOpen(false);
                fetchData();
                setImageFile(null);
                setPreview(null);
                setGalleryFiles(null);
                setGalleryPreviews([]);
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Đã xảy ra lỗi");
        }
    };


    const deleteRoom = async (id: string): Promise<void> => {
        try {
            const response = await axios.delete<ApiResponse<any>>(`${backendUrl}/api/rooms/${id}`);
            if (response.data.success) {
                toast.success(response.data.message);
                fetchData();
            }
        } catch (error) {
            toast.error("Lỗi khi xóa phòng");
        } finally {
            setDeleteTargetId(null);
            setDeleteTargetName('');
        }
    };

    const toggleStatus = async (id: string): Promise<void> => {
        try {
            const currentRoom = rooms.find(r => r._id === id);
            if (!currentRoom) return;
            const nextStatus = currentRoom.status === 'available' ? 'sold_out' : 'available';
            const response = await axios.put<ApiResponse<any>>(`${backendUrl}/api/rooms/${id}`, {
                status: nextStatus
            });
            if (response.data.success) {
                toast.success(`Trạng thái đã chuyển sang: ${nextStatus === 'available' ? 'Sẵn sàng' : 'Hết phòng'}`);
                fetchData();
            }
        } catch (error) {
            toast.error("Lỗi khi cập nhật trạng thái");
        }
    };


    const getRoomTypeName = (roomType: any) => {
        if (!roomType) return 'Không xác định';
        if (typeof roomType === 'string') {
            const foundType = roomTypes.find(t => t._id === roomType);
            return foundType ? foundType.name : 'Không xác định';
        }
        return roomType.name || 'Không xác định';
    };

    const getPriceUnit = (roomType: any) => {
        const typeName = getRoomTypeName(roomType).toLowerCase();
        if (typeName.includes('karaoke')) return 'tiếng';
        if (typeName.includes('tiệc')) return 'buổi';
        return 'đêm';
    };

    const getRoomTypeId = (roomType: any) => {
        if (!roomType) return '';
        if (typeof roomType === 'string') return roomType;
        return roomType._id || '';
    };

    const openEditModal = (room: Room): void => {
        // Hỗ trợ dữ liệu cũ nếu amenities là array hoặc undefined
        const safeAmenities = (room.amenities && !Array.isArray(room.amenities)) ? { ...room.amenities } : {
            wifi: false,
            airConditioner: false,
            breakfast: false,
            minibar: false,
            tv: false,
            balcony: false
        };

        setFormData({
            name: room.name || (room as any).roomNumber || '',
            roomType: room.roomType || '',
            capacity: (room.capacity || 2).toString(),
            size: (room.size || 0).toString(),
            bedType: room.bedType || 'King',

            view: room.view || '',
            description: room.description || '',
            price: (room.price || 0).toString(),
            originalPrice: room.originalPrice?.toString() || '',
            availableRooms: (room.availableRooms || 0).toString(),
            status: room.status || 'available',
            amenities: safeAmenities
        });
        setSelectedRoom(room);
        setPreview(room.thumbnail || (room as any).avatar);
        setGalleryPreviews(room.images || []);
        setIsEditMode(true);
        setIsModalOpen(true);
    };



    const filteredRooms = rooms.filter(room => {
        const roomName = room.name || (room as any).roomNumber || '';
        const roomType = room.roomType || '';
        const matchesSearch = roomName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             roomType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || room.status?.toLowerCase() === filterStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });



    const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);
    const paginatedRooms = filteredRooms.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (currentPage > 1 && currentPage > totalPages) {
            setCurrentPage(totalPages || 1);
        }
    }, [totalPages, currentPage]);

    return (
        <div className="p-8 bg-[#f5f5f5] min-h-screen font-sans">
            <div className="max-w-[1600px] mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-[900] text-[#003580] tracking-tight">Danh sách phòng</h1>
                        <p className="text-sm font-medium text-gray-500">Quản lý trạng thái và thông tin chi tiết từng phòng.</p>
                    </div>
                    <button 
                        onClick={() => { setIsEditMode(false); setFormData(initialFormData); setPreview(null); setGalleryPreviews([]); setIsModalOpen(true); }}
                        className="bg-[#003580] text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-[#002a6b] transition-all shadow-md active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Thêm phòng mới
                    </button>
                </header>


                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 relative min-w-[300px]">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input 
                            type="text" 
                            placeholder="Tìm tên phòng hoặc loại phòng..." 
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="flex gap-2">
                        {['All', 'Available', 'Sold_out'].map((status) => (
                            <button
                                key={status}
                                onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                                className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
                                    filterStatus === status ? 'bg-[#003580] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {status === 'All' ? 'Tất cả' : status === 'Available' ? 'Sẵn sàng' : 'Hết phòng'}
                            </button>
                        ))}
                    </div>
                </div>


                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                             <p className="text-gray-400 font-medium">Đang tải danh sách phòng...</p>
                        </div>
                    ) : paginatedRooms.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                             <p className="text-gray-400 font-medium">Không tìm thấy phòng nào phù hợp.</p>
                        </div>
                    ) : paginatedRooms.map((room) => (
                        <div key={room._id} className="bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col md:flex-row hover:shadow-lg transition-all duration-300 group">
                            {/* Phần ảnh: Bên trái */}
                            <div className="md:w-64 h-48 md:h-auto overflow-hidden relative shrink-0">
                                <img 
                                    src={room.thumbnail || (room as any).avatar || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=400'} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                    alt={room.name || (room as any).roomNumber} 
                                />
                                <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider shadow-sm ${
                                    room.status === 'available' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}>
                                    {room.status === 'available' ? 'Sẵn sàng' : 'Hết phòng'}
                                </div>
                            </div>



                            {/* Phần thông tin: Ở giữa */}
                            <div className="flex-1 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-black text-[#003580] group-hover:text-[#006ce4] transition-colors">
                                            {room.name || `Phòng ${(room as any).roomNumber || 'Chưa đặt tên'}`}
                                        </h3>
                                        <span className="text-[10px] font-black text-[#006ce4] bg-[#006ce4]/10 px-2 py-0.5 rounded uppercase tracking-widest leading-loose">
                                            {room.roomType || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-4 mt-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-gray-400 text-lg">bed</span>
                                            <span className="text-xs font-bold text-gray-500">{room.bedType}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-gray-400 text-lg">group</span>
                                            <span className="text-xs font-bold text-gray-500">{room.capacity} người</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-gray-400 text-lg">square_foot</span>
                                            <span className="text-xs font-bold text-gray-500">{room.size}m²</span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-gray-400 text-lg">meeting_room</span>
                                            <span className="text-xs font-bold text-gray-500">Còn {room.availableRooms} phòng</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {room.amenities && !Array.isArray(room.amenities) && room.amenities.wifi && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">✓ WiFi</span>}
                                        {room.amenities && !Array.isArray(room.amenities) && room.amenities.airConditioner && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">✓ Điều hòa</span>}
                                        {room.amenities && !Array.isArray(room.amenities) && room.amenities.balcony && <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">✓ Ban công</span>}
                                        {room.view && <span className="text-[10px] font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded">View: {room.view}</span>}
                                    </div>

                                </div>
                            </div>
 
                            {/* Phần giá & hành động: Bên phải */}
                            <div className="md:w-64 p-6 flex flex-col justify-between items-end bg-[#003580]/[0.02] shrink-0">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Giá mỗi đêm</p>
                                    <p className="text-2xl font-black text-[#003580]">{new Intl.NumberFormat('vi-VN').format(room.price)}₫</p>
                                    {room.originalPrice && (
                                        <p className="text-[11px] text-gray-400 line-through font-bold">
                                            {new Intl.NumberFormat('vi-VN').format(room.originalPrice)}₫
                                        </p>
                                    )}
                                </div>


                                <div className="flex flex-col w-full gap-2 mt-4">
                                    <button 
                                        onClick={() => toggleStatus(room._id)}
                                        className="w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-base">sync_alt</span>
                                        Đổi trạng thái
                                    </button>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openEditModal(room)}
                                            className="flex-1 py-2.5 bg-[#003580] text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[#002a6b] transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-base">edit</span>
                                            Sửa
                                        </button>
                                        <button 
                                            onClick={() => { setDeleteTargetId(room._id); setDeleteTargetName(room.name); }}
                                            className="w-10 h-10 bg-white text-rose-500 border border-rose-100 rounded-lg hover:bg-rose-50 transition-all flex items-center justify-center shrink-0"
                                            title="Xóa phòng"
                                        >

                                            <span className="material-symbols-outlined text-base">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredRooms.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-[#003580] tracking-tight">{isEditMode ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{formData.name || 'Nhập tên phòng...'}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Left Side: Images */}
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Ảnh đại diện (Thumbnail)</label>
                                        <label className="relative group cursor-pointer block h-64 bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-[#003580]/30 transition-all">
                                            {preview ? (
                                                <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-3">
                                                    <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Tải ảnh chính</span>
                                                </div>
                                            )}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-[10px] font-black uppercase tracking-widest">Thay đổi ảnh</span>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Bộ sưu tập ảnh (Gallery)</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {galleryPreviews.map((url, index) => (
                                                <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={url} className="w-full h-full object-cover" alt={`Gallery ${index}`} />
                                                </div>
                                            ))}
                                            <label className="aspect-square bg-gray-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-200 cursor-pointer hover:border-[#006ce4]/30 text-gray-400 hover:bg-white transition-all">
                                                <span className="material-symbols-outlined text-xl">add_circle</span>
                                                <input type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryChange} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Tiện nghi (Amenities)</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.keys(formData.amenities).map((amenity) => (
                                                <label key={amenity} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all border border-transparent has-[:checked]:border-[#006ce4]/20 has-[:checked]:bg-blue-50/30">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formData.amenities[amenity as keyof RoomForm['amenities']]}
                                                        onChange={() => handleAmenityChange(amenity as keyof RoomForm['amenities'])}
                                                        className="w-4 h-4 rounded text-[#006ce4] focus:ring-[#006ce4]"
                                                    />
                                                    <span className="text-xs font-bold text-gray-600 capitalize">
                                                        {amenity === 'airConditioner' ? 'Điều hòa' : 
                                                         amenity === 'breakfast' ? 'Bữa sáng' : 
                                                         amenity === 'minibar' ? 'Quầy bar mini' : 
                                                         amenity === 'tv' ? 'Tivi' : 
                                                         amenity === 'balcony' ? 'Ban công' : 'Wifi'}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Details */}
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên phòng gợi nhớ</label>
                                            <input name="name" className="w-full px-5 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all placeholder:font-medium" placeholder="VD: Phòng Deluxe Giường Đôi..." required value={formData.name} onChange={handleChange} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Loại chuyên mục</label>
                                            <select name="roomType" className="w-full px-5 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all appearance-none" required value={formData.roomType} onChange={handleChange}>
                                                <option value="">Chọn loại</option>
                                                {roomTypes.map(type => (
                                                    <option key={type._id} value={type.name}>{type.name}</option>
                                                ))}
                                            </select>
                                        </div>


                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Kiểu giường</label>
                                            <select name="bedType" className="w-full px-5 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all appearance-none" required value={formData.bedType} onChange={handleChange}>
                                                <option value="King">King Bed</option>
                                                <option value="Queen">Queen Bed</option>
                                                <option value="Twin">Twin Beds</option>
                                                <option value="Single">Single Bed</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Diện tích (m²)</label>
                                            <input name="size" type="number" className="w-full px-5 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all" placeholder="30" required value={formData.size} onChange={handleChange} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Sức chứa (Người)</label>
                                            <input name="capacity" type="number" className="w-full px-5 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all" placeholder="2" required value={formData.capacity} onChange={handleChange} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">View hướng</label>

                                            <input name="view" className="w-full px-5 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all" placeholder="Biển, Phố, Hồ..." value={formData.view} onChange={handleChange} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Giá hiện tại</label>
                                            <input name="price" type="number" className="w-full px-5 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all" placeholder="1200000" required value={formData.price} onChange={handleChange} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Giá gốc (nếu giảm)</label>
                                            <input name="originalPrice" type="number" className="w-full px-5 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all" placeholder="1500000" value={formData.originalPrice} onChange={handleChange} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Số lượng phòng trống</label>
                                            <input name="availableRooms" type="number" className="w-full px-5 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all" placeholder="5" value={formData.availableRooms} onChange={handleChange} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Trạng thái</label>
                                            <select name="status" className="w-full px-5 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all appearance-none" value={formData.status} onChange={handleChange}>
                                                <option value="available">Sẵn sàng đón khách</option>
                                                <option value="sold_out">Hết phòng</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Mô tả chi tiết phòng</label>
                                        <textarea name="description" rows={4} className="w-full px-5 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all resize-none" placeholder="Thông tin về tiện ích, không gian, chính sách..." required value={formData.description} onChange={handleChange}></textarea>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">Hủy bỏ</button>
                                        <button className="flex-[2] py-4 bg-[#006ce4] text-white rounded-xl font-bold text-sm hover:bg-[#0057b8] transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined">{isEditMode ? 'check_circle' : 'add_circle'}</span>
                                            {isEditMode ? 'Cập nhật ngay' : 'Thêm phòng mới'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            <ConfirmModal
                isOpen={!!deleteTargetId}
                title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa phòng số "${deleteTargetName}"? Hành động này không thể hoàn tác.`}
                onConfirm={() => deleteTargetId && deleteRoom(deleteTargetId)}
                onCancel={() => { setDeleteTargetId(null); setDeleteTargetName(''); }}
            />
        </div>
    );
};

export default RoomAdmin;
