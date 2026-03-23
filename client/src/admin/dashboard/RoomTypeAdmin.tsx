import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, RoomType } from '../../types';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

interface RoomTypeForm {
    name: string;
    description: string;
    basePrice: string;
}

const RoomTypeAdmin: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 5;
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [selectedType, setSelectedType] = useState<RoomType | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');

    const [formData, setFormData] = useState<RoomTypeForm>({
        name: '',
        description: '',
        basePrice: ''
    });

    const fetchRoomTypes = async (): Promise<void> => {
        setLoading(true);
        try {
            const response = await axios.get<ApiResponse<RoomType[]>>(`${backendUrl}/api/room-types?admin=true`);
            if (response.data.success && response.data.data) {
                setRoomTypes(response.data.data);
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Không thể tải danh sách loại phòng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomTypes();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('basePrice', formData.basePrice);
            if (imageFile) data.append('image', imageFile);

            let response;
            if (isEditMode && selectedType) {
                response = await axios.put<ApiResponse<any>>(`${backendUrl}/api/room-types/${selectedType._id}`, data);
            } else {
                response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/room-types`, data);
            }

            if (response.data.success) {
                toast.success(response.data.message);
                setIsModalOpen(false);
                fetchRoomTypes();
                setImageFile(null);
                setPreview(null);
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Đã xảy ra lỗi");
        }
    };

    const toggleStatus = async (id: string): Promise<void> => {
        try {
            const currentType = roomTypes.find(t => t._id === id);
            if (!currentType) return;
            const response = await axios.put<ApiResponse<any>>(`${backendUrl}/api/room-types/${id}`, {
                isActive: !currentType.isActive
            });
            if (response.data.success) {
                toast.success(response.data.message);
                fetchRoomTypes();
            }
        } catch (error: any) {
            toast.error("Lỗi khi cập nhật trạng thái");
        }
    };

    const deleteRoomType = async (id: string): Promise<void> => {
        try {
            const response = await axios.delete<ApiResponse<any>>(`${backendUrl}/api/room-types/${id}`);
            if (response.data.success) {
                toast.success(response.data.message);
                fetchRoomTypes();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa loại phòng");
        } finally {
            setDeleteTargetId(null);
            setDeleteTargetName('');
        }
    };

    const openEditModal = (type: RoomType): void => {
        setFormData({
            name: type.name,
            description: type.description || '',
            basePrice: type.basePrice.toString()
        });
        setSelectedType(type);
        setPreview(type.image);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const getPriceUnit = (typeName: string) => {
        const lowerName = typeName.toLowerCase();
        if (lowerName.includes('karaoke')) return 'tiếng';
        if (lowerName.includes('tiệc')) return 'buổi';
        return 'đêm';
    };

    const totalPages = Math.ceil(roomTypes.length / ITEMS_PER_PAGE);
    const paginatedTypes = roomTypes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
                        <h1 className="text-3xl font-[900] text-[#003580] tracking-tight">Loại phòng khách sạn</h1>
                        <p className="text-sm font-medium text-gray-500">Định nghĩa các tiêu chuẩn phòng và giá cơ bản.</p>
                    </div>
                    <button 
                        onClick={() => { setIsEditMode(false); setFormData({name:'', description:'', basePrice:''}); setPreview(null); setIsModalOpen(true); }}
                        className="bg-[#003580] text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-[#002a6b] transition-all shadow-md active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Thêm loại phòng
                    </button>
                </header>

                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                             <p className="text-gray-400 font-medium">Đang tải danh sách loại phòng...</p>
                        </div>
                    ) : roomTypes.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                             <p className="text-gray-400 font-medium">Chưa có loại phòng nào được tạo.</p>
                        </div>
                    ) : (
                        <>
                        {paginatedTypes.map((type) => (
                        <div key={type._id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 flex flex-col md:flex-row hover:shadow-lg transition-all duration-300 group">
                            {/* Phần ảnh: Bên trái */}
                            <div className="md:w-80 h-52 md:h-auto overflow-hidden relative shrink-0">
                                <img 
                                    src={type.image || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=400'} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                    alt={type.name} 
                                />
                                <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg ${
                                    type.isActive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}>
                                    {type.isActive ? 'Đang kinh doanh' : 'Tạm ngưng'}
                                </div>
                            </div>

                            {/* Phần nội dung: Ở giữa */}
                            <div className="flex-1 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-2xl font-black text-[#003580] tracking-tight group-hover:text-[#006ce4] transition-colors">{type.name}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-6 font-medium">
                                        {type.description || "Không có mô tả cho loại phòng này. Bạn có thể thêm mô tả để khách hàng dễ dàng lựa chọn hơn."}
                                    </p>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg border border-gray-100">
                                        <span className="material-symbols-outlined text-[16px]">wifi</span>
                                        <span className="text-[10px] font-bold uppercase">Wifi</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg border border-gray-100">
                                        <span className="material-symbols-outlined text-[16px]">ac_unit</span>
                                        <span className="text-[10px] font-bold uppercase">Điều hòa</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg border border-gray-100">
                                        <span className="material-symbols-outlined text-[16px]">tv</span>
                                        <span className="text-[10px] font-bold uppercase">Smart TV</span>
                                    </div>
                                </div>
                            </div>

                            {/* Phần hành động: Bên phải */}
                            <div className="md:w-80 p-8 flex flex-col justify-between items-end bg-[#003580]/[0.02] shrink-0">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá mỗi {getPriceUnit(type.name)}</p>
                                    <p className="text-3xl font-black text-[#003580]">{new Intl.NumberFormat('vi-VN').format(type.basePrice)}đ</p>
                                    <p className="text-[10px] text-gray-500 font-bold mt-1">+ thuế và phí</p>
                                </div>

                                <div className="flex flex-col w-full gap-2.5 mt-8">
                                    <button 
                                        onClick={() => toggleStatus(type._id)}
                                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                                            type.isActive 
                                            ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
                                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{type.isActive ? 'pause_circle' : 'play_circle'}</span>
                                        {type.isActive ? 'Tạm ngưng KD' : 'Bật kinh doanh'}
                                    </button>
                                    
                                    <div className="flex gap-2.5">
                                        <button 
                                            onClick={() => openEditModal(type)}
                                            className="flex-1 py-3 bg-[#003580] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#002a6b] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#003580]/10"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                            Sửa
                                        </button>
                                        <button 
                                            onClick={() => { setDeleteTargetId(type._id); setDeleteTargetName(type.name); }}
                                            className="w-12 h-12 bg-white text-rose-500 border border-rose-100 rounded-xl hover:bg-rose-50 transition-all flex items-center justify-center shrink-0 active:scale-90"
                                            title="Xóa loại phòng"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={roomTypes.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                    </>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#003580]">
                            <div>
                                <h2 className="text-xl font-[900] text-white tracking-tight">{isEditMode ? 'Cập nhật loại phòng' : 'Thêm loại phòng mới'}</h2>
                                <p className="text-xs font-bold text-white/60 mt-1 uppercase tracking-widest">Thông tin tiêu chuẩn phòng</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-all">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div className="flex flex-col items-center mb-6">
                                <label className="relative group cursor-pointer w-full h-40 bg-gray-50 rounded-[2rem] overflow-hidden border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 hover:border-gray-300 transition-all">
                                    {preview ? (
                                        <img src={preview} className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-gray-300 text-4xl">add_photo_alternate</span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tải ảnh lên</span>
                                        </>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên loại phòng</label>
                                <input 
                                    name="name"
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-black focus:ring-2 focus:ring-gray-100 transition-all outline-none" 
                                    placeholder="Ví dụ: Deluxe Sea View" 
                                    required 
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giá cơ bản (VNĐ/Tiếng, Buổi, Đêm)</label>
                                <input 
                                    name="basePrice"
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-black focus:ring-2 focus:ring-gray-100 transition-all outline-none" 
                                    placeholder="500000" 
                                    type="number" 
                                    required 
                                    value={formData.basePrice}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mô tả chi tiết</label>
                                <textarea 
                                    name="description"
                                    rows={4}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all outline-none resize-none" 
                                    placeholder="Nêu đặc điểm nổi bật của loại phòng này..."
                                    required
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <button className="w-full mt-4 py-4 bg-[#003580] text-white rounded-lg font-bold text-sm hover:bg-[#002a6b] transition-all active:scale-[0.98] shadow-lg">
                                {isEditMode ? 'Cập nhật thay đổi' : 'Tạo loại phòng ngay'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!deleteTargetId}
                title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa loại phòng "${deleteTargetName}"? Hành động này không thể hoàn tác và sẽ ảnh hưởng đến các phòng thuộc loại này.`}
                onConfirm={() => deleteTargetId && deleteRoomType(deleteTargetId)}
                onCancel={() => { setDeleteTargetId(null); setDeleteTargetName(''); }}
            />
        </div>
    );
};

export default RoomTypeAdmin;
