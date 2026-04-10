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
    maxDiscountAmount: string;
    roomTypes: string[];
}

const PromotionAdmin: React.FC = () => {
    const dispatch = useAppDispatch();
    const promotions = useAppSelector(selectAllPromotions);
    const loading = useAppSelector(selectPromotionLoading);
    const roomTypesList = useAppSelector(selectAllRoomTypes);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterRank, setFilterRank] = useState<string>('All');
    const [startDateFilter, setStartDateFilter] = useState<string>('');
    const [endDateFilter, setEndDateFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 10;

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

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'active': return { 
                text: 'Hoạt động', 
                color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                dotColor: 'bg-green-600'
            };
            case 'inactive': return { 
                text: 'Tạm ngưng', 
                color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                dotColor: 'bg-amber-600'
            };
            case 'expired': return { 
                text: 'Hết hạn', 
                color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                dotColor: 'bg-red-600'
            };
            default: return { 
                text: status, 
                color: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-400',
                dotColor: 'bg-gray-600'
            };
        }
    };

    const filteredPromos = promotions.filter(p => {
        const matchesSearch = p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
        const matchesRank = filterRank === 'All' || (p.minGeniusLevel || 0).toString() === filterRank;

        // Date range filtering
        const pStart = new Date(p.startDate).setHours(0, 0, 0, 0);
        const pEnd = new Date(p.endDate).setHours(0, 0, 0, 0);
        
        const filterStart = startDateFilter ? new Date(startDateFilter).setHours(0, 0, 0, 0) : null;
        const filterEnd = endDateFilter ? new Date(endDateFilter).setHours(0, 0, 0, 0) : null;

        const matchesStartDate = !filterStart || pStart >= filterStart;
        const matchesEndDate = !filterEnd || pEnd <= filterEnd;

        return matchesSearch && matchesStatus && matchesRank && matchesStartDate && matchesEndDate;
    });

    const totalPages = Math.ceil(filteredPromos.length / ITEMS_PER_PAGE);
    const paginatedPromos = filteredPromos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // --- LOGIC THỐNG KÊ (STATS) ---
    const getStats = () => {
        return {
            total: promotions.length,
            active: promotions.filter(p => p.status === 'active').length,
            expired: promotions.filter(p => p.status === 'expired').length,
            used: promotions.reduce((acc, p) => acc + (p.usedCount || 0), 0)
        };
    };

    const stats = getStats();

    return (
        <div className="p-8 bg-[#f5f7f9] dark:bg-slate-900 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">Quản lý khuyến mãi</h2>
                        <p className="text-[#595c5e] dark:text-slate-400 mt-1 font-['Inter',sans-serif]">Tạo và vận hành các chiến dịch ưu đãi, voucher giảm giá cho khách hàng.</p>
                    </div>
                    <button
                        onClick={() => { setIsEditMode(false); setFormData(emptyForm); setPreview(null); setImageFile(null); setIsModalOpen(true); }}
                        className="bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0050d4]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_card</span>
                        Tạo khuyến mãi mới
                    </button>
                </div>

                {/* Dashboard Overview Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#0050d4] flex items-center justify-center">
                            <span className="material-symbols-outlined">confirmation_number</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Tổng mã KM</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{stats.total}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">campaign</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Đang hiệu lực</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{stats.active}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">event_busy</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Hết hạn/Dừng</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{stats.expired}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">trending_up</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Tổng lượt dùng</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{stats.used}</p>
                        </div>
                    </div>
                </div>

                {/* Table & Filters Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-transparent overflow-hidden shadow-sm">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-[#e5e9eb] dark:border-slate-700 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Search Input */}
                            <div className="relative w-full md:max-w-md">
                                <input
                                    type="text"
                                    placeholder="Tìm mã code hoặc tên chương trình..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-11 pr-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0050d4] transition-all text-[#2c2f31] dark:text-slate-100 placeholder-[#abadaf]"
                                />
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-[20px]">search</span>
                            </div>

                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterStatus('All');
                                    setFilterRank('All');
                                    setStartDateFilter('');
                                    setEndDateFilter('');
                                    setCurrentPage(1);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">filter_alt_off</span>
                                Xóa tất cả bộ lọc
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Status Filter */}
                            <div className="relative">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-1.5 ml-1">Trạng thái</label>
                                <div className="relative">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                        className="w-full appearance-none pl-10 pr-10 py-2.5 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:ring-2 focus:ring-[#0050d4]/20 cursor-pointer transition-all"
                                    >
                                        <option value="All">Tất cả trạng thái</option>
                                        <option value="active">Đang hoạt động</option>
                                        <option value="inactive">Tạm ngưng</option>
                                        <option value="expired">Đã hết hạn</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">filter_list</span>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            {/* Rank Filter */}
                            <div className="relative">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-1.5 ml-1">Hạng thành viên</label>
                                <div className="relative">
                                    <select
                                        value={filterRank}
                                        onChange={(e) => { setFilterRank(e.target.value); setCurrentPage(1); }}
                                        className="w-full appearance-none pl-10 pr-10 py-2.5 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:ring-2 focus:ring-[#0050d4]/20 cursor-pointer transition-all"
                                    >
                                        <option value="All">Tất cả hạng</option>
                                        <option value="0">Hạng: Silver</option>
                                        <option value="1">Hạng: Gold</option>
                                        <option value="2">Hạng: Diamond</option>
                                        <option value="3">Hạng: Platinum</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">stars</span>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            {/* Start Date Filter */}
                            <div className="relative">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-1.5 ml-1">Ngày bắt đầu</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={startDateFilter}
                                        onChange={(e) => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-10 pr-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:outline-none focus:border-[#0050d4] transition-all"
                                    />
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">calendar_today</span>
                                </div>
                            </div>

                            {/* End Date Filter */}
                            <div className="relative">
                                <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-1.5 ml-1">Ngày kết thúc</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={endDateFilter}
                                        onChange={(e) => { setEndDateFilter(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-10 pr-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:outline-none focus:border-[#0050d4] transition-all"
                                    />
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">event</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Content */}
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="w-12 h-12 bg-[#e5e9eb] dark:bg-slate-700 rounded-full mb-4"></div>
                                <p className="text-[#747779] dark:text-slate-400 text-sm font-medium">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : filteredPromos.length === 0 ? (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-5xl text-[#abadaf] dark:text-slate-500 mb-3">money_off</span>
                            <p className="text-[#747779] dark:text-slate-400 text-sm font-medium">Không tìm thấy mã khuyến mãi nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#eef1f3]/50 dark:bg-slate-900/50">
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Chiến dịch</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Mức giảm</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Điều kiện</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Loại phòng áp dụng</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Thời gian</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Lượt dùng</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Trạng thái</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider text-right font-['Manrope',sans-serif]">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e9eb] dark:divide-slate-700">
                                    {paginatedPromos.map((promo) => {
                                        const statusInfo = getStatusInfo(promo.status);
                                        return (
                                            <tr key={promo._id} className="hover:bg-[#f5f7f9] dark:hover:bg-slate-900/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-[#eef1f3] dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-600 shadow-sm">
                                                            {promo.image ? (
                                                                <img src={promo.image} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[#abadaf] dark:text-slate-500">
                                                                    <span className="material-symbols-outlined">image</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-mono tracking-wider">
                                                                    {promo.code}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-bold text-[#2c2f31] dark:text-slate-100 line-clamp-1">{promo.title}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-black text-rose-600 dark:text-rose-400">{promo.discountPercent}%</span>
                                                        {promo.maxDiscountAmount > 0 && (
                                                            <span className="text-[10px] text-[#747779] dark:text-slate-500 font-medium">Toàn sàn: Max {new Intl.NumberFormat('vi-VN').format(promo.maxDiscountAmount)}₫</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-[#4e5c71] dark:text-slate-400 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">shopping_cart_checkout</span>
                                                            Min: {new Intl.NumberFormat('vi-VN').format(promo.minOrderValue)}₫
                                                        </p>
                                                        <p className={`text-xs flex items-center gap-1 font-bold ${promo.minGeniusLevel > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-[#abadaf]'}`}>
                                                            <span className="material-symbols-outlined text-[14px]">stars</span>
                                                            {promo.minGeniusLevel == 0 ? 'Tất cả Member' : promo.minGeniusLevel == 1 ? 'Gold+' : promo.minGeniusLevel == 2 ? 'Diamond+' : 'Platinum'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {(!promo.roomTypes || promo.roomTypes.length === 0) ? (
                                                            <span className="text-xs text-[#abadaf] italic">Áp dụng tất cả loại phòng</span>
                                                        ) : (
                                                            promo.roomTypes.slice(0, 2).map((rt: any) => (
                                                                <span key={typeof rt === 'string' ? rt : rt._id} className="text-[10px] px-1.5 py-0.5 bg-[#eef1f3] dark:bg-slate-700 text-[#595c5e] dark:text-slate-300 rounded font-bold">
                                                                    {typeof rt === 'string' ? '...' : rt.name}
                                                                </span>
                                                            ))
                                                        )}
                                                        {promo.roomTypes && promo.roomTypes.length > 2 && (
                                                            <span className="text-[10px] text-[#abadaf] font-bold">+{promo.roomTypes.length - 2}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-xs space-y-0.5">
                                                        <span className="text-[#4e5c71] dark:text-slate-300 font-bold">{new Date(promo.startDate).toLocaleDateString('vi-VN')}</span>
                                                        <span className="text-[#abadaf]">đến</span>
                                                        <span className="text-[#4e5c71] dark:text-slate-300 font-bold">{new Date(promo.endDate).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-[#2c2f31] dark:text-slate-100">{promo.usedCount}</span>
                                                            <span className="text-[10px] text-[#abadaf] font-bold uppercase tracking-wider">Lượt dùng</span>
                                                        </div>
                                                        <div className="w-px h-6 bg-[#e5e9eb] dark:bg-slate-700 mx-1"></div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-[#747779] dark:text-slate-400">{promo.usageLimit === 0 ? '∞' : promo.usageLimit}</span>
                                                            <span className="text-[10px] text-[#abadaf] font-bold uppercase tracking-wider">Hạn mức</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`}></span>
                                                        {statusInfo.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-1 justify-end">
                                                        <button
                                                            onClick={() => toggleStatus(promo._id)}
                                                            disabled={promo.status === 'expired'}
                                                            className={`p-2 rounded-lg transition-all ${promo.status === 'active' ? 'hover:bg-amber-50 text-[#747779] hover:text-amber-600 dark:hover:bg-amber-900/20' : 'hover:bg-green-50 text-[#747779] hover:text-green-600 dark:hover:bg-green-900/20'} disabled:opacity-30 disabled:hover:bg-transparent`}
                                                        >
                                                            <span className="material-symbols-outlined text-xl">{promo.status === 'active' ? 'pause' : 'play_circle'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(promo)}
                                                            className="p-2 hover:bg-[#eef1f3] dark:hover:bg-slate-700 rounded-lg text-[#747779] hover:text-[#0050d4] transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => { setDeleteTargetId(promo._id); setDeleteTargetCode(promo.code); }}
                                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[#747779] hover:text-red-600 transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">delete</span>
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
                    {filteredPromos.length > 0 && (
                        <div className="px-6 py-4 border-t border-[#e5e9eb] dark:border-slate-700 flex items-center justify-between">
                            <p className="text-xs font-medium text-[#747779] dark:text-slate-400">
                                Hiển thị <span className="text-[#2c2f31] dark:text-slate-100">{paginatedPromos.length}</span> trên <span className="text-[#2c2f31] dark:text-slate-100">{filteredPromos.length}</span> khuyến mãi
                            </p>
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

                {/* Footer Insight / Bento Item */}
                <div className="mt-8 bg-[#eef1f3]/50 dark:bg-slate-800/50 p-8 rounded-2xl border border-dashed border-[#d9dde0] dark:border-slate-700 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-[#d40078]">
                        <span className="material-symbols-outlined text-3xl">loyalty</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">Cá nhân hóa ưu đãi</h3>
                        <p className="text-sm text-[#4e5c71] dark:text-slate-400 max-w-md mx-auto">Tăng doanh thu bằng cách tạo các mã giảm giá đặc biệt cho từng nhóm khách hàng Platinum hoặc theo từng loại phòng cụ thể.</p>
                    </div>
                </div>
            </div>

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl my-auto animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-[#e5e9eb] dark:border-slate-700 px-8 py-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">
                                    {isEditMode ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi mới'}
                                </h2>
                                <p className="text-xs text-[#747779] dark:text-slate-400 mt-1 font-medium">Chi tiết thông tin chiến dịch ưu đãi</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-[#747779] hover:text-[#2c2f31] dark:hover:text-slate-200 hover:bg-[#f5f7f9] dark:hover:bg-slate-700 rounded-xl transition-all text-3xl font-light">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            {/* Promo Image */}
                            <div className="flex flex-col items-center gap-4 bg-[#fbfcfd] dark:bg-slate-900/40 p-6 rounded-3xl border border-dashed border-[#d9dde0] dark:border-slate-700">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-900 flex items-center justify-center text-[#abadaf] dark:text-slate-600 overflow-hidden shadow-inner border border-slate-100 dark:border-slate-700">
                                        {preview ? (
                                            <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <span className="material-symbols-outlined text-5xl">add_photo_alternate</span>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-[#0050d4] to-[#0046bb] rounded-full flex items-center justify-center cursor-pointer hover:shadow-lg transition-all shadow-md group">
                                        <span className="material-symbols-outlined text-white text-xl">upload_file</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-bold text-[#2c2f31] dark:text-slate-100">Banner Khuyến Mãi</p>
                                    <p className="text-[10px] text-[#abadaf] dark:text-slate-500 mt-1 uppercase tracking-widest font-bold">JPG, PNG, WEBP (Max 5MB)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 mb-2 uppercase tracking-widest">Tiêu đề chương trình *</label>
                                    <input
                                        name="title"
                                        className="w-full px-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 focus:outline-none focus:border-[#0050d4] transition-all outline-none"
                                        placeholder="Ví dụ: Ưu đãi mùa hè 2024 - Giảm 15%"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 mb-2 uppercase tracking-widest">Mã Voucher (Code) *</label>
                                    <input
                                        name="code"
                                        className="w-full px-5 py-3.5 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/30 rounded-2xl text-base font-black text-amber-700 dark:text-amber-400 font-mono tracking-widest focus:outline-none focus:border-amber-500 transition-all outline-none uppercase"
                                        placeholder="SUMMER24"
                                        required
                                        value={formData.code}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 mb-2 uppercase tracking-widest">Mức giảm giá (%) *</label>
                                    <div className="relative">
                                        <input
                                            name="discountPercent"
                                            type="number"
                                            min="1"
                                            max="100"
                                            className="w-full px-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-base font-black text-rose-600 dark:text-rose-400 focus:outline-none focus:border-[#0050d4] transition-all outline-none"
                                            placeholder="15"
                                            required
                                            value={formData.discountPercent}
                                            onChange={handleChange}
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-rose-400 text-lg">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 mb-2 uppercase tracking-widest">Ngày bắt đầu *</label>
                                    <input
                                        name="startDate"
                                        type="date"
                                        className="w-full px-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 outline-none focus:border-[#0050d4] transition-all"
                                        required
                                        value={formData.startDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 mb-2 uppercase tracking-widest">Ngày kết thúc *</label>
                                    <input
                                        name="endDate"
                                        type="date"
                                        className="w-full px-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 outline-none focus:border-[#0050d4] transition-all"
                                        required
                                        value={formData.endDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 mb-2 uppercase tracking-widest">Đơn hàng tối thiểu (₫)</label>
                                    <input
                                        name="minOrderValue"
                                        type="number"
                                        className="w-full px-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 outline-none focus:border-[#0050d4] transition-all"
                                        placeholder="0"
                                        value={formData.minOrderValue}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 mb-2 uppercase tracking-widest">Số tiền giảm tối đa (₫)</label>
                                    <input
                                        name="maxDiscountAmount"
                                        type="number"
                                        className="w-full px-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 outline-none focus:border-[#0050d4] transition-all"
                                        placeholder="Để 0 nếu không giới hạn"
                                        value={formData.maxDiscountAmount}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 mb-2 uppercase tracking-widest">Giới hạn số lượt dùng</label>
                                    <input
                                        name="usageLimit"
                                        type="number"
                                        className="w-full px-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 outline-none focus:border-[#0050d4] transition-all"
                                        placeholder="Để 0 nếu không giới hạn"
                                        value={formData.usageLimit}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 mb-2 uppercase tracking-widest">Hạng Member áp dụng</label>
                                    <select
                                        name="minGeniusLevel"
                                        className="w-full px-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 outline-none focus:border-[#0050d4] transition-all cursor-pointer"
                                        value={formData.minGeniusLevel}
                                        onChange={handleChange}
                                    >
                                        <option value="0">Mặc định (Hạng Silver trở lên)</option>
                                        <option value="1">Yêu cầu hạng Gold+</option>
                                        <option value="2">Yêu cầu hạng Diamond+</option>
                                        <option value="3">Dành riêng cho Platinum</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 mb-3 uppercase tracking-widest">Loại phòng được sử dụng mã</label>
                                    <div className="grid grid-cols-2 gap-3 p-5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-3xl max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                                        {roomTypesList.map((rt) => (
                                            <button
                                                key={rt._id}
                                                type="button"
                                                onClick={() => {
                                                    const newRoomTypes = formData.roomTypes.includes(rt._id)
                                                        ? formData.roomTypes.filter(id => id !== rt._id)
                                                        : [...formData.roomTypes, rt._id];
                                                    setFormData({ ...formData, roomTypes: newRoomTypes });
                                                }}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-xs font-bold ${formData.roomTypes.includes(rt._id)
                                                    ? 'bg-blue-50/50 border-[#0050d4] text-[#0050d4] dark:bg-blue-900/10 dark:text-blue-400'
                                                    : 'bg-white border-slate-50 text-[#747779] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 hover:border-[#abadaf]'
                                                    }`}
                                            >
                                                <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${formData.roomTypes.includes(rt._id) ? 'border-[#0050d4] bg-[#0050d4]' : 'border-[#abadaf]'}`}>
                                                    {formData.roomTypes.includes(rt._id) && <span className="material-symbols-outlined text-[10px] text-white">check</span>}
                                                </span>
                                                {rt.name}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-[#abadaf] dark:text-slate-500 mt-2 font-medium italic">* Nếu không chọn loại phòng nào, hệ thống mặc định áp dụng cho TẤT CẢ các loại phòng hiện có.</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 mb-2 uppercase tracking-widest">Thể lệ / Mô tả chi tiết</label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        className="w-full px-5 py-4 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 focus:outline-none focus:border-[#0050d4] transition-all resize-none leading-relaxed shadow-inner"
                                        placeholder="Mô tả các điều kiện đi kèm, hướng dẫn sử dụng voucher cho khách hàng..."
                                        value={formData.description}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 bg-[#f5f7f9] dark:bg-slate-700 text-[#4e5c71] dark:text-slate-200 text-sm font-black rounded-2xl hover:bg-[#eef1f3] dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white text-sm font-black rounded-2xl shadow-xl shadow-[#0050d4]/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
                                >
                                    {isEditMode ? 'Cập nhật khuyến mãi' : 'Kích hoạt chiến dịch'}
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
                message={`Bạn có chắc chắn muốn xóa mã "${deleteTargetCode}"? Hành động này không thể hoàn tác và sẽ ảnh hưởng đến các đơn hàng đang chờ.`}
                onConfirm={() => deleteTargetId && deletePromo(deleteTargetId)}
                onCancel={() => { setDeleteTargetId(null); setDeleteTargetCode(''); }}
            />
        </div>
    );
};

export default PromotionAdmin;