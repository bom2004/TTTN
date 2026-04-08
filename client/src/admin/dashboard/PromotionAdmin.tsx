import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { IPromotion } from '../../types';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import {
    fetchAllPromotionsThunk,
    createPromotionThunk,
    updatePromotionThunk,
    deletePromotionThunk,
    togglePromotionStatusThunk,
    selectAllPromotions,
    selectPromotionLoading,
} from '../../lib/redux/reducers/promotion';
import { fetchAllRoomTypesThunk, selectAllRoomTypes } from '../../lib/redux/reducers/room-type';

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
    maxDiscountAmount: string; // New field
    roomTypes: string[];
}

const PromotionAdmin: React.FC = () => {
    const dispatch = useAppDispatch();
    const promotions = useAppSelector(selectAllPromotions);
    const loading = useAppSelector(selectPromotionLoading);
    const roomTypesList = useAppSelector(selectAllRoomTypes);

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

    const emptyForm: PromotionForm = {
        title: '', description: '', discountPercent: '', code: '',
        startDate: '', endDate: '', minOrderValue: '0', usageLimit: '0',
        minGeniusLevel: '0',
        maxDiscountAmount: '0',
        roomTypes: []
    };
    const [formData, setFormData] = useState<PromotionForm>(emptyForm);

    useEffect(() => {
        dispatch(fetchAllPromotionsThunk());
        dispatch(fetchAllRoomTypesThunk());
    }, [dispatch]);

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
        const payload = new FormData();
        payload.append('title', formData.title);
        payload.append('description', formData.description);
        payload.append('discountPercent', formData.discountPercent);
        payload.append('code', formData.code.toUpperCase());
        payload.append('startDate', formData.startDate);
        payload.append('endDate', formData.endDate);
        payload.append('minOrderValue', formData.minOrderValue);
        payload.append('maxDiscountAmount', formData.maxDiscountAmount);
        payload.append('usageLimit', formData.usageLimit);
        payload.append('minGeniusLevel', formData.minGeniusLevel);
        payload.append('roomTypes', JSON.stringify(formData.roomTypes));
        if (imageFile) payload.append('image', imageFile);

        try {
            if (isEditMode && selectedPromo) {
                await dispatch(updatePromotionThunk({ id: selectedPromo._id, formData: payload })).unwrap();
                toast.success("Cập nhật khuyến mãi thành công");
            } else {
                await dispatch(createPromotionThunk(payload)).unwrap();
                toast.success("Tạo khuyến mãi mới thành công");
            }
            setIsModalOpen(false);
            setImageFile(null);
            setPreview(null);
        } catch (error: any) {
            toast.error(error || "Đã xảy ra lỗi");
        }
    };

    const toggleStatus = async (id: string): Promise<void> => {
        try {
            await dispatch(togglePromotionStatusThunk(id)).unwrap();
            toast.success("Cập nhật trạng thái thành công");
        } catch (error: any) {
            toast.error(error || "Lỗi khi cập nhật trạng thái");
        }
    };

    const deletePromo = async (id: string): Promise<void> => {
        try {
            await dispatch(deletePromotionThunk(id)).unwrap();
            toast.success("Xóa khuyến mãi thành công");
        } catch (error: any) {
            toast.error(error || "Lỗi khi xóa khuyến mãi");
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
            maxDiscountAmount: (promo.maxDiscountAmount || 0).toString(),
            roomTypes: promo.roomTypes ? promo.roomTypes.map((rt: any) => typeof rt === 'string' ? rt : rt._id) : []
        });
        setSelectedPromo(promo);
        setPreview(promo.image || null);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return { text: 'Hoạt động', color: 'text-emerald-600 bg-emerald-50' };
            case 'inactive': return { text: 'Tạm ngưng', color: 'text-rose-600 bg-rose-50' };
            case 'expired': return { text: 'Hết hạn', color: 'text-gray-500 bg-gray-50' };
            default: return { text: status, color: 'text-gray-600 bg-gray-50' };
        }
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
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Mã khuyến mãi</h1>
                    <p className="text-sm text-gray-500 mt-1">Tạo và quản lý các voucher giảm giá, ưu đãi cho khách hàng</p>
                </div>

                {/* Search and Filters */}
                <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Tìm theo mã code hoặc tên chương trình..."
                            className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="flex gap-1">
                        {['All', 'active', 'inactive', 'expired'].map((status) => (
                            <button
                                key={status}
                                onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                                className={`px-3 py-1.5 text-sm rounded-md transition ${filterStatus === status
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {status === 'All' ? 'Tất cả' : status === 'active' ? 'Hoạt động' : status === 'inactive' ? 'Tạm ngưng' : 'Hết hạn'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { setIsEditMode(false); setFormData(emptyForm); setPreview(null); setImageFile(null); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
                    >
                        + Tạo mã mới
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-sm">Đang tải...</p>
                    </div>
                ) : filteredPromos.length === 0 ? (
                    <div className="bg-white rounded-md border border-gray-200 text-center py-12">
                        <p className="text-gray-400 text-sm">Không tìm thấy mã khuyến mãi nào</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Khuyến mãi</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Giảm</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Hạng</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Loại phòng</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sử dụng</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedPromos.map((promo) => {
                                        const statusInfo = getStatusBadge(promo.status);
                                        return (
                                            <tr key={promo._id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {promo.image ? (
                                                            <img src={promo.image} alt={promo.title} className="w-12 h-12 rounded object-cover border border-gray-100" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded bg-gray-50 flex items-center justify-center border border-gray-100">
                                                                <span className="material-symbols-outlined text-gray-300 text-lg">image</span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                                                    {promo.code}
                                                                </span>
                                                            </div>
                                                            <p className="font-medium text-gray-900 leading-tight">{promo.title}</p>
                                                            {promo.description && <p className="text-[10px] text-gray-400 line-clamp-1 max-w-[200px] mb-0.5">{promo.description}</p>}
                                                            <div className="flex flex-wrap gap-x-3">
                                                                <p className="text-[10px] text-gray-500">
                                                                    Min: {new Intl.NumberFormat('vi-VN').format(promo.minOrderValue)}₫
                                                                </p>
                                                                {promo.maxDiscountAmount > 0 && (
                                                                    <p className="text-[10px] text-amber-600 font-bold">
                                                                        Max: {new Intl.NumberFormat('vi-VN').format(promo.maxDiscountAmount)}₫
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-base font-bold text-rose-500">{promo.discountPercent}%</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${promo.minGeniusLevel > 0
                                                            ? 'bg-blue-50 text-blue-600'
                                                            : 'bg-gray-50 text-gray-500'
                                                        }`}>
                                                        {promo.minGeniusLevel == 1 ? 'Gold+' : promo.minGeniusLevel == 2 ? 'Diamond+' : promo.minGeniusLevel == 3 ? 'Platinum' : 'Tất cả'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                                                        {(!promo.roomTypes || promo.roomTypes.length === 0) ? (
                                                            <span className="text-xs text-gray-400 italic">Tất cả</span>
                                                        ) : (
                                                            promo.roomTypes.slice(0, 2).map((rt: any) => (
                                                                <span key={typeof rt === 'string' ? rt : rt._id} className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                    {typeof rt === 'string' ? '...' : rt.name}
                                                                </span>
                                                            ))
                                                        )}
                                                        {promo.roomTypes && promo.roomTypes.length > 2 && (
                                                            <span className="text-xs text-gray-400">+{promo.roomTypes.length - 2}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-xs text-gray-600">
                                                        {new Date(promo.startDate).toLocaleDateString('vi-VN')}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        → {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {promo.usedCount} <span className="text-gray-400 text-xs">/ {promo.usageLimit === 0 ? '∞' : promo.usageLimit}</span>
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => toggleStatus(promo._id)}
                                                        disabled={promo.status === 'expired'}
                                                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium transition ${promo.status === 'active'
                                                                ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                                                : promo.status === 'expired'
                                                                    ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                                                                    : 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                                                            }`}
                                                    >
                                                        {statusInfo.text}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => openEditModal(promo)}
                                                            className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => { setDeleteTargetId(promo._id); setDeleteTargetCode(promo.code); }}
                                                            className="p-1.5 text-gray-400 hover:text-rose-600 transition"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {isEditMode ? 'Cập nhật khuyến mãi' : 'Tạo mã khuyến mãi mới'}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Thiết lập thông tin ưu đãi</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Hình ảnh khuyến mãi</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                                        {preview ? (
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-gray-300 text-3xl">image</span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP. Tối đa 5MB</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Tên chương trình *</label>
                                    <input
                                        name="title"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        placeholder="Ví dụ: Siêu Sale Hè 2024"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Mã Code *</label>
                                    <input
                                        name="code"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono uppercase focus:outline-none focus:border-gray-400 transition"
                                        placeholder="SUMMER2024"
                                        required
                                        value={formData.code}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Giảm giá (%) *</label>
                                    <input
                                        name="discountPercent"
                                        type="number"
                                        min="1"
                                        max="100"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        placeholder="15"
                                        required
                                        value={formData.discountPercent}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Ngày bắt đầu *</label>
                                    <input
                                        name="startDate"
                                        type="date"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        required
                                        value={formData.startDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Ngày kết thúc *</label>
                                    <input
                                        name="endDate"
                                        type="date"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        required
                                        value={formData.endDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Đơn tối thiểu (VNĐ)</label>
                                    <input
                                        name="minOrderValue"
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        placeholder="0"
                                        value={formData.minOrderValue}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Số tiền giảm tối đa (VNĐ)</label>
                                    <input
                                        name="maxDiscountAmount"
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        placeholder="0 (không giới hạn)"
                                        value={formData.maxDiscountAmount}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Giới hạn lượt dùng</label>
                                    <input
                                        name="usageLimit"
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        placeholder="0 (không giới hạn)"
                                        value={formData.usageLimit}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Dành riêng cho (VIP)</label>
                                    <select
                                        name="minGeniusLevel"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-gray-400"
                                        value={formData.minGeniusLevel}
                                        onChange={handleChange}
                                    >
                                        <option value="0">Tất cả khách hàng (Hạng Silver+)</option>
                                        <option value="1">Hạng Gold trở lên</option>
                                        <option value="2">Hạng Diamond trở lên</option>
                                        <option value="3">Điều kiện Platinum</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Áp dụng cho loại phòng</label>
                                    <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-md border border-gray-200 max-h-40 overflow-y-auto">
                                        {roomTypesList.map((rt) => (
                                            <label key={rt._id} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                                                    checked={formData.roomTypes.includes(rt._id)}
                                                    onChange={(e) => {
                                                        const newRoomTypes = e.target.checked
                                                            ? [...formData.roomTypes, rt._id]
                                                            : formData.roomTypes.filter(id => id !== rt._id);
                                                        setFormData({ ...formData, roomTypes: newRoomTypes });
                                                    }}
                                                />
                                                <span className="text-sm text-gray-700">{rt.name}</span>
                                            </label>
                                        ))}
                                        {roomTypesList.length === 0 && (
                                            <p className="text-xs text-gray-400 col-span-2 text-center py-2">Đang tải...</p>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Bỏ trống tất cả để áp dụng cho mọi loại phòng</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Mô tả / Thể lệ</label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition resize-none"
                                        placeholder="Chỉ áp dụng cho người dùng mới..."
                                        value={formData.description}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
                                >
                                    {isEditMode ? 'Cập nhật' : 'Tạo mã khuyến mãi'}
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
                message={`Bạn có chắc chắn muốn xóa mã "${deleteTargetCode}"? Hành động này không thể hoàn tác.`}
                onConfirm={() => deleteTargetId && deletePromo(deleteTargetId)}
                onCancel={() => { setDeleteTargetId(null); setDeleteTargetCode(''); }}
            />
        </div>
    );
};

export default PromotionAdmin;