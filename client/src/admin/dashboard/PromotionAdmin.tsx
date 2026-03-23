import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, IPromotion } from '../../types';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

interface PromotionForm {
    title: string;
    description: string;
    discountPercent: string;
    code: string;
    startDate: string;
    endDate: string;
    minOrderValue: string;
    usageLimit: string;
    minGeniusLevel: string;
    roomTypes: string[]; // Added
}

const PromotionAdmin: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const [promotions, setPromotions] = useState<IPromotion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 5;

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [selectedPromo, setSelectedPromo] = useState<IPromotion | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetCode, setDeleteTargetCode] = useState<string>('');

    const [roomTypesList, setRoomTypesList] = useState<any[]>([]); // To store available room types

    const emptyForm: PromotionForm = {
        title: '', description: '', discountPercent: '', code: '',
        startDate: '', endDate: '', minOrderValue: '0', usageLimit: '0',
        minGeniusLevel: '0',
        roomTypes: [] // Added
    };
    const [formData, setFormData] = useState<PromotionForm>(emptyForm);

    const fetchPromotions = async (): Promise<void> => {
        setLoading(true);
        try {
            const response = await axios.get<ApiResponse<IPromotion[]>>(`${backendUrl}/api/promotions`);
            if (response.data.success && response.data.data) {
                setPromotions(response.data.data);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách khuyến mãi");
        } finally {
            setLoading(false);
        }
    };

    const fetchRoomTypes = async (): Promise<void> => {
        try {
            const response = await axios.get<ApiResponse<any[]>>(`${backendUrl}/api/room-types`);
            if (response.data.success && response.data.data) {
                setRoomTypesList(response.data.data);
            }
        } catch (error) {
            console.error("Lỗi khi tải loại phòng:", error);
        }
    };

    useEffect(() => {
        fetchPromotions();
        fetchRoomTypes(); // Added
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
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
            const payload = new FormData();
            payload.append('title', formData.title);
            payload.append('description', formData.description);
            payload.append('discountPercent', formData.discountPercent);
            payload.append('code', formData.code.toUpperCase());
            payload.append('startDate', formData.startDate);
            payload.append('endDate', formData.endDate);
            payload.append('minOrderValue', formData.minOrderValue);
            payload.append('usageLimit', formData.usageLimit);
            payload.append('minGeniusLevel', formData.minGeniusLevel);
            payload.append('roomTypes', JSON.stringify(formData.roomTypes)); // Added as JSON string
            if (imageFile) payload.append('image', imageFile);

            let response;
            if (isEditMode && selectedPromo) {
                response = await axios.put<ApiResponse<IPromotion>>(`${backendUrl}/api/promotions/${selectedPromo._id}`, payload);
            } else {
                response = await axios.post<ApiResponse<IPromotion>>(`${backendUrl}/api/promotions`, payload);
            }

            if (response.data.success) {
                toast.success(response.data.message);
                setIsModalOpen(false);
                fetchPromotions();
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
            const response = await axios.put<ApiResponse<IPromotion>>(`${backendUrl}/api/promotions/${id}/toggle-status`);
            if (response.data.success) {
                toast.success(response.data.message);
                fetchPromotions();
            }
        } catch (error) {
            toast.error("Lỗi khi cập nhật trạng thái");
        }
    };

    const deletePromo = async (id: string): Promise<void> => {
        try {
            const response = await axios.delete<ApiResponse<any>>(`${backendUrl}/api/promotions/${id}`);
            if (response.data.success) {
                toast.success(response.data.message);
                fetchPromotions();
            }
        } catch (error) {
            toast.error("Lỗi khi xóa khuyến mãi");
        } finally {
            setDeleteTargetId(null);
            setDeleteTargetCode('');
        }
    };

    const openEditModal = (promo: IPromotion): void => {
        setFormData({
            title: promo.title,
            description: promo.description || '',
            discountPercent: promo.discountPercent.toString(),
            code: promo.code,
            startDate: new Date(promo.startDate).toISOString().split('T')[0],
            endDate: new Date(promo.endDate).toISOString().split('T')[0],
            minOrderValue: promo.minOrderValue.toString(),
            usageLimit: promo.usageLimit.toString(),
            minGeniusLevel: (promo.minGeniusLevel || 0).toString(),
            roomTypes: promo.roomTypes ? promo.roomTypes.map((rt: any) => typeof rt === 'string' ? rt : rt._id) : []
        });
        setSelectedPromo(promo);
        setPreview(promo.image || null);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const filteredPromos = promotions.filter(p => {
        const matchesSearch = p.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredPromos.length / ITEMS_PER_PAGE);
    const paginatedPromos = filteredPromos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
                        <h1 className="text-3xl font-[900] text-[#003580] tracking-tight">Mã khuyến mãi</h1>
                        <p className="text-sm font-medium text-gray-500">Tạo và quản lý các voucher giảm giá, ưu đãi cho khách hàng.</p>
                    </div>
                    <button 
                        onClick={() => { setIsEditMode(false); setFormData(emptyForm); setPreview(null); setImageFile(null); setIsModalOpen(true); }}
                        className="bg-[#003580] text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-[#002a6b] transition-all shadow-md active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Tạo mã mới
                    </button>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 relative min-w-[300px]">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input 
                            type="text" 
                            placeholder="Tìm theo mã code hoặc tên chương trình..." 
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="flex gap-2">
                        {['All', 'active', 'inactive', 'expired'].map((status) => (
                            <button
                                key={status}
                                onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                                className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
                                    filterStatus === status ? 'bg-[#003580] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {status === 'All' ? 'Tất cả' : status === 'active' ? 'Hoạt động' : status === 'inactive' ? 'Tạm Ngưng' : 'Hết hạn'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#003580]/5 border-b border-gray-100">
                                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Khuyến mãi</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Giảm</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Hạng</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Loại phòng</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Sử dụng</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-medium">Đang tải dữ liệu...</td>
                                    </tr>
                                ) : paginatedPromos.length > 0 ? (
                                    paginatedPromos.map((promo) => (
                                        <tr key={promo._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 font-black text-xs rounded border border-amber-200 uppercase tracking-widest">
                                                            {promo.code}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-black text-gray-900 line-clamp-1">{promo.title}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">Đơn tối thiểu: {new Intl.NumberFormat('vi-VN').format(promo.minOrderValue)}đ</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-lg font-black text-rose-500">{promo.discountPercent}%</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                                    promo.minGeniusLevel > 0 
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                                    : 'bg-gray-50 text-gray-400 border border-gray-100'
                                                }`}>
                                                    {promo.minGeniusLevel > 0 ? `Genius ${promo.minGeniusLevel}+` : 'Tất cả'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                    {(!promo.roomTypes || promo.roomTypes.length === 0) ? (
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase italic">Tất cả</span>
                                                    ) : (
                                                        promo.roomTypes.map((rt: any) => (
                                                            <span key={typeof rt === 'string' ? rt : rt._id} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold border border-gray-200">
                                                                {typeof rt === 'string' ? '...' : rt.name}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-xs font-bold text-gray-600 mb-1">
                                                    <span className="text-gray-400 font-medium">Từ:</span> {new Date(promo.startDate).toLocaleDateString('vi-VN')}
                                                </p>
                                                <p className="text-xs font-bold text-rose-500">
                                                    <span className="text-gray-400 font-medium">Đến:</span> {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <p className="text-sm font-black text-[#003580]">{promo.usedCount} <span className="text-gray-400 font-medium text-xs">/ {promo.usageLimit === 0 ? '∞' : promo.usageLimit}</span></p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <button
                                                    onClick={() => toggleStatus(promo._id)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        promo.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' :
                                                        promo.status === 'expired' ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed' :
                                                        'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                                                    }`}
                                                    disabled={promo.status === 'expired'}
                                                >
                                                    {promo.status === 'active' ? 'Hoạt động' : promo.status === 'expired' ? 'Đã Hết Hạn' : 'Đang Tắt'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => openEditModal(promo)}
                                                        className="p-2 bg-[#003580]/10 text-[#003580] rounded-lg hover:bg-[#003580] hover:text-white transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => { setDeleteTargetId(promo._id); setDeleteTargetCode(promo.code); }}
                                                        className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-medium">Không tìm thấy mã khuyến mãi nào.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredPromos.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#003580]">
                            <div>
                                <h2 className="text-xl font-[900] text-white tracking-tight">{isEditMode ? 'Cập nhật khuyến mãi' : 'Tạo mã khuyến mãi mới'}</h2>
                                <p className="text-xs font-bold text-blue-200 mt-1 uppercase tracking-widest">Thiết lập ưu đãi giảm giá</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên chương trình</label>
                                    <input 
                                        name="title"
                                        className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-[#003580]/20 transition-all outline-none" 
                                        placeholder="Ví dụ: Siêu Sale Hè 2024" 
                                        required 
                                        value={formData.title}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hình ảnh khuyến mãi</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                                            {preview ? (
                                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-gray-300">image</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#003580]/10 file:text-[#003580] hover:file:bg-[#003580]/20 cursor-pointer transition-all"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-2 font-medium">Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB. Kích thước tỷ lệ 16:9.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mã Code (Tự viết hoa)</label>
                                    <input 
                                        name="code"
                                        className="w-full px-5 py-3.5 bg-amber-50 rounded-xl border border-amber-200 text-sm font-black text-amber-700 uppercase focus:ring-2 focus:ring-amber-200 transition-all outline-none" 
                                        placeholder="SUMMER2024" 
                                        required 
                                        value={formData.code}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giảm giá (%)</label>
                                    <div className="relative">
                                        <input 
                                            name="discountPercent"
                                            type="number"
                                            min="1" max="100"
                                            className="w-full pl-5 pr-10 py-3.5 bg-rose-50 rounded-xl border border-rose-100 text-sm font-black text-rose-600 focus:ring-2 focus:ring-rose-200 transition-all outline-none" 
                                            placeholder="15" 
                                            required 
                                            value={formData.discountPercent}
                                            onChange={handleChange}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-rose-400">%</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày bắt đầu</label>
                                    <input 
                                        name="startDate"
                                        type="date"
                                        className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-[#003580]/20 transition-all outline-none" 
                                        required 
                                        value={formData.startDate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày kết thúc</label>
                                    <input 
                                        name="endDate"
                                        type="date"
                                        className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-[#003580]/20 transition-all outline-none" 
                                        required 
                                        value={formData.endDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giá trị đơn tối thiểu (VNĐ)</label>
                                    <input 
                                        name="minOrderValue"
                                        type="number"
                                        className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-[#003580]/20 transition-all outline-none" 
                                        placeholder="0" 
                                        required 
                                        value={formData.minOrderValue}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giới hạn lượt dùng (0 = Không giới hạn)</label>
                                    <input 
                                        name="usageLimit"
                                        type="number"
                                        className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-[#003580]/20 transition-all outline-none" 
                                        placeholder="0" 
                                        required 
                                        value={formData.usageLimit}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hạng Genius tối thiểu (0-10)</label>
                                    <select 
                                        name="minGeniusLevel"
                                        className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-[#003580]/20 transition-all outline-none"
                                        value={formData.minGeniusLevel}
                                        onChange={handleChange}
                                    >
                                        <option value="0">Tất cả khách hàng (Hạng 0+)</option>
                                        {[1,2,3,4,5,6,7,8,9,10].map(lv => (
                                            <option key={lv} value={lv}>Hạng Genius {lv} trở lên</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Áp dụng cho loại phòng (Mặc định: Tất cả)</label>
                                    <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        {roomTypesList.map((rt) => (
                                            <label key={rt._id} className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="checkbox"
                                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:bg-[#003580] checked:border-[#003580] transition-all"
                                                        checked={formData.roomTypes.includes(rt._id)}
                                                        onChange={(e) => {
                                                            const newRoomTypes = e.target.checked 
                                                                ? [...formData.roomTypes, rt._id]
                                                                : formData.roomTypes.filter(id => id !== rt._id);
                                                            setFormData({ ...formData, roomTypes: newRoomTypes });
                                                        }}
                                                    />
                                                    <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-xs font-bold">check</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-600 group-hover:text-[#003580] transition-colors">{rt.name}</span>
                                            </label>
                                        ))}
                                        {roomTypesList.length === 0 && (
                                            <p className="text-xs text-gray-400 italic col-span-2">Đang tải danh sách loại phòng...</p>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Bỏ trống tất cả nếu muốn áp dụng cho mọi loại phòng.</p>
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ghi chú / Thể lệ (Nếu có)</label>
                                    <textarea 
                                        name="description"
                                        rows={3}
                                        className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border-none text-sm font-medium focus:ring-2 focus:ring-[#003580]/20 transition-all outline-none resize-none" 
                                        placeholder="Chỉ áp dụng cho người dùng mới..."
                                        value={formData.description}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="flex-1 py-4 bg-[#003580] text-white rounded-xl font-bold text-sm hover:bg-[#002a6b] transition-all shadow-lg active:scale-[0.98]">
                                    {isEditMode ? 'Lưu thay đổi khuyến mãi' : 'Tạo mã khuyến mãi ngay'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!deleteTargetId}
                title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa mã "${deleteTargetCode}"? Hành động này không thể hoàn tác.`}
                onConfirm={() => deleteTargetId && deletePromo(deleteTargetId)}
                onCancel={() => { setDeleteTargetId(null); setDeleteTargetCode(''); }}
            />
        </div>
    );
};

export default PromotionAdmin;
