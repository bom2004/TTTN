import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { RoomType } from '../../types';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import {
    fetchAllRoomTypesThunk,
    createRoomTypeThunk,
    updateRoomTypeThunk,
    deleteRoomTypeThunk,
    toggleRoomTypeStatusThunk,
    selectAllRoomTypes,
    selectRoomTypeLoading,
} from '../../lib/redux/reducers/room-type';

interface RoomTypeForm {
    name: string;
    description: string;
    basePrice: string;
    totalInventory: string;
    capacity: string;
    size: string;
    bedType: string;
    view: string;
    amenities: {
        wifi: boolean;
        airConditioner: boolean;
        breakfast: boolean;
        minibar: boolean;
        tv: boolean;
        balcony: boolean;
    };
}

const RoomTypeAdmin: React.FC = () => {
    const dispatch = useAppDispatch();
    const roomTypes = useAppSelector(selectAllRoomTypes);
    const loading = useAppSelector(selectRoomTypeLoading);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterRoomName, setFilterRoomName] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 10;

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [selectedType, setSelectedType] = useState<RoomType | null>(null);
    const [images, setImages] = useState<(File | string)[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [mainImageIndex, setMainImageIndex] = useState<number>(0);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');

    const [formData, setFormData] = useState<RoomTypeForm>({
        name: '',
        description: '',
        basePrice: '',
        totalInventory: '0',
        capacity: '2',
        size: '',
        bedType: 'King',
        view: '',
        amenities: {
            wifi: false,
            airConditioner: false,
            breakfast: false,
            minibar: false,
            tv: false,
            balcony: false
        }
    });

    useEffect(() => {
        dispatch(fetchAllRoomTypesThunk());
    }, [dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAmenitiesChange = (key: keyof RoomTypeForm['amenities']) => {
        setFormData(prev => ({
            ...prev,
            amenities: {
                ...prev.amenities,
                [key]: !prev.amenities[key]
            }
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            const filesArray = Array.from(selectedFiles);
            setImages(prev => [...prev, ...filesArray]);

            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setPreviews(prev => prev.filter((_, i) => i !== index));
        setImages(prev => prev.filter((_, i) => i !== index));
        if (mainImageIndex === index) {
            setMainImageIndex(0);
        } else if (mainImageIndex > index) {
            setMainImageIndex(mainImageIndex - 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!formData.name || !formData.basePrice) {
            toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
            return;
        }

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('basePrice', formData.basePrice);
        data.append('totalInventory', formData.totalInventory);
        data.append('capacity', formData.capacity);
        data.append('size', formData.size);
        data.append('bedType', formData.bedType);
        data.append('view', formData.view);
        data.append('amenities', JSON.stringify(formData.amenities));
        data.append('mainImageIndex', mainImageIndex.toString());

        const existingImages = images.filter(img => typeof img === 'string') as string[];
        const newFiles = images.filter(img => typeof img !== 'string') as File[];

        data.append('remainingImages', JSON.stringify(existingImages));
        if (newFiles.length > 0) {
            newFiles.forEach(file => {
                data.append('images', file);
            });
        }

        try {
            if (isEditMode && selectedType) {
                await dispatch(updateRoomTypeThunk({ id: selectedType._id, formData: data })).unwrap();
                toast.success("Cập nhật loại phòng thành công");
            } else {
                await dispatch(createRoomTypeThunk(data)).unwrap();
                toast.success("Thêm loại phòng thành công");
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error?.message || "Đã xảy ra lỗi");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            basePrice: '',
            totalInventory: '0',
            capacity: '2',
            size: '',
            bedType: 'King',
            view: '',
            amenities: {
                wifi: false,
                airConditioner: false,
                breakfast: false,
                minibar: false,
                tv: false,
                balcony: false
            }
        });
        setImages([]);
        setPreviews([]);
        setMainImageIndex(0);
        setSelectedType(null);
        setIsEditMode(false);
    };

    const toggleStatus = async (id: string): Promise<void> => {
        try {
            const currentType = roomTypes.find(t => t._id === id);
            if (!currentType) return;
            await dispatch(toggleRoomTypeStatusThunk({ id, isActive: !currentType.isActive })).unwrap();
            toast.success("Cập nhật trạng thái thành công");
        } catch (error: any) {
            toast.error(error?.message || "Lỗi khi cập nhật trạng thái");
        }
    };

    const deleteRoomType = async (id: string): Promise<void> => {
        try {
            await dispatch(deleteRoomTypeThunk(id)).unwrap();
            toast.success("Xóa loại phòng thành công");
        } catch (error: any) {
            toast.error(error?.message || "Lỗi khi xóa loại phòng");
        } finally {
            setDeleteTargetId(null);
            setDeleteTargetName('');
        }
    };

    const openEditModal = (type: RoomType): void => {
        setFormData({
            name: type.name,
            description: type.description || '',
            basePrice: type.basePrice.toString(),
            totalInventory: (type.totalInventory ?? 0).toString(),
            capacity: (type.capacity ?? 2).toString(),
            size: (type.size ?? 0).toString(),
            bedType: type.bedType || 'King',
            view: type.view || '',
            amenities: type.amenities || {
                wifi: false,
                airConditioner: false,
                breakfast: false,
                minibar: false,
                tv: false,
                balcony: false
            }
        });
        setSelectedType(type);
        const imagesList = type.images && type.images.length > 0 ? type.images : (type.image ? [type.image] : []);
        setImages(imagesList);
        setPreviews(imagesList);
        const currentIndex = imagesList.indexOf(type.image);
        setMainImageIndex(currentIndex >= 0 ? currentIndex : 0);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const filteredTypes = roomTypes.filter(type => {
        const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' ||
            (filterStatus === 'active' && type.isActive) ||
            (filterStatus === 'inactive' && !type.isActive);
        const matchesName = filterRoomName === 'All' || type.name === filterRoomName;
        return matchesSearch && matchesStatus && matchesName;
    });

    const totalPages = Math.ceil(filteredTypes.length / ITEMS_PER_PAGE);
    const paginatedTypes = filteredTypes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // --- LOGIC THỐNG KÊ (STATS) ---
    const getStats = () => {
        return {
            total: roomTypes.length,
            active: roomTypes.filter(t => t.isActive).length,
            inactive: roomTypes.filter(t => !t.isActive).length,
            inventory: roomTypes.reduce((acc, t) => acc + (t.totalInventory || 0), 0)
        };
    };

    const stats = getStats();

    return (
        <div className="p-8 bg-[#f5f7f9] dark:bg-slate-900 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-[#2c2f31] dark:text-slate-100 leading-tight font-['Manrope',sans-serif]">Loại phòng khách sạn</h2>
                        <p className="text-[#595c5e] dark:text-slate-400 mt-1 font-medium font-['Inter',sans-serif]">Định nghĩa các tiêu chuẩn phòng và giá dịch vụ cơ bản.</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white font-bold rounded-xl shadow-lg shadow-[#0050d4]/20 hover:scale-[1.02] transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">add_circle</span>
                        Thêm loại phòng mới
                    </button>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100/50 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300">
                                <span className="material-symbols-outlined text-2xl">category</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng loại phòng</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.total}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100/50 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <span className="material-symbols-outlined text-2xl">check_box</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Đang kinh doanh</p>
                                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.active}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100/50 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <span className="material-symbols-outlined text-2xl">pause_circle</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Tạm ngưng</p>
                                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.inactive}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100/50 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-[#0050d4] dark:text-blue-400">
                                <span className="material-symbols-outlined text-2xl">inventory_2</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#0050d4] dark:text-blue-400 uppercase tracking-wider">Tổng tồn kho</p>
                                <h3 className="text-2xl font-black text-[#2c2f31] dark:text-slate-100">{stats.inventory} phòng</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Table Section */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100/50 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        {/* Search Input */}
                        <div className="relative w-full md:max-w-md">
                            <input
                                type="text"
                                placeholder="Tìm theo tên loại phòng..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-11 pr-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0050d4] transition-all text-[#2c2f31] dark:text-slate-100 placeholder-[#abadaf]"
                            />
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-[20px]">search</span>
                        </div>

                        {/* Filter Selects */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* Status Filter */}
                            <div className="relative flex-1 md:flex-none min-w-[160px]">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                    className="w-full appearance-none pl-10 pr-10 py-2.5 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:ring-2 focus:ring-[#0050d4]/20 cursor-pointer transition-all"
                                >
                                    <option value="All">Trạng thái: Tất cả</option>
                                    <option value="active">Đang kinh doanh</option>
                                    <option value="inactive">Tạm ngưng</option>
                                </select>
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-[20px] pointer-events-none">filter_list</span>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-[20px] pointer-events-none">expand_more</span>
                            </div>

                            {/* Room Name Filter */}
                            <div className="relative flex-1 md:flex-none min-w-[180px]">
                                <select
                                    value={filterRoomName}
                                    onChange={(e) => { setFilterRoomName(e.target.value); setCurrentPage(1); }}
                                    className="w-full appearance-none pl-11 pr-10 py-2.5 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:ring-2 focus:ring-[#0050d4]/20 cursor-pointer transition-all"
                                >
                                    <option value="All">Loại phòng: Tất cả</option>
                                    {[...new Set(roomTypes.map(t => t.name))].map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#747779] text-[20px] pointer-events-none">category</span>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-[20px] pointer-events-none">expand_more</span>
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
                    ) : paginatedTypes.length === 0 ? (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-5xl text-[#abadaf] dark:text-slate-500 mb-3">category</span>
                            <p className="text-[#747779] dark:text-slate-400 text-sm font-medium">Không tìm thấy loại phòng nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[#595c5e] dark:text-slate-400 text-sm uppercase tracking-wider font-semibold">
                                        <th className="pb-6 pl-2">Thông tin loại phòng</th>
                                        <th className="pb-6">Giá cơ bản</th>
                                        <th className="pb-6">Số lượng</th>
                                        <th className="pb-6">Thông số</th>
                                        <th className="pb-6">Trạng thái</th>
                                        <th className="pb-6 text-right pr-2">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e9eb] dark:divide-slate-700">
                                    {paginatedTypes.map((type) => (
                                        <tr key={type._id} className="group hover:bg-[#f5f7f9] dark:hover:bg-slate-900/50 transition-colors">
                                            <td className="py-5 pl-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm bg-[#eef1f3] border border-slate-100 dark:border-slate-700">
                                                        <img
                                                            src={type.image || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=200&h=200&fit=crop'}
                                                            className="w-full h-full object-cover"
                                                            alt={type.name}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[#2c2f31] dark:text-slate-100 text-base">{type.name}</p>
                                                        <p className="text-xs text-[#747779] dark:text-slate-400 mt-0.5 line-clamp-1 max-w-[250px]">
                                                            {type.description || 'Chưa có mô tả'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-black text-[#0050d4] dark:text-blue-400">
                                                        {new Intl.NumberFormat('vi-VN').format(type.basePrice)}₫
                                                    </span>
                                                    <span className="text-[10px] text-[#abadaf] font-bold uppercase tracking-wider">Mỗi đêm</span>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-[#2c2f31] dark:text-slate-300">
                                                        <span className="material-symbols-outlined text-lg">door_open</span>
                                                    </div>
                                                    <span className="font-bold text-[#2c2f31] dark:text-slate-100">{type.totalInventory ?? 0} phòng</span>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#eef1f3] dark:bg-slate-700 text-[11px] font-bold text-[#4e5c71] dark:text-slate-300">
                                                        <span className="material-symbols-outlined text-xs">group</span>
                                                        {type.capacity ?? 2}
                                                    </span>
                                                    {type.size && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#eef1f3] dark:bg-slate-700 text-[11px] font-bold text-[#4e5c71] dark:text-slate-300">
                                                            <span className="material-symbols-outlined text-xs">square_foot</span>
                                                            {type.size}m²
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${type.isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${type.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                    {type.isActive ? 'Kinh doanh' : 'Tạm dừng'}
                                                </span>
                                            </td>
                                            <td className="py-5 text-right pr-2">
                                                <div className="flex gap-1 justify-end">
                                                    <button
                                                        onClick={() => toggleStatus(type._id)}
                                                        className={`p-2 rounded-lg transition-all ${type.isActive ? 'hover:bg-amber-50 text-[#747779] hover:text-amber-600 dark:hover:bg-amber-900/20' : 'hover:bg-emerald-50 text-[#747779] hover:text-emerald-600 dark:hover:bg-emerald-900/20'}`}
                                                        title={type.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                                                    >
                                                        <span className="material-symbols-outlined text-xl">{type.isActive ? 'pause' : 'play_arrow'}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(type)}
                                                        className="p-2 hover:bg-[#eef1f3] dark:hover:bg-slate-700 rounded-lg text-[#747779] hover:text-[#0050d4] transition-all"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">edit_note</span>
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteTargetId(type._id); setDeleteTargetName(type.name); }}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[#747779] hover:text-red-600 transition-all"
                                                        title="Xóa"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredTypes.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-between mt-10">
                            <p className="text-sm text-[#747779] dark:text-slate-400 font-medium">
                                Hiển thị <span className="font-bold text-[#2c2f31] dark:text-slate-100">{paginatedTypes.length}</span> trên <span className="font-bold text-[#2c2f31] dark:text-slate-100">{filteredTypes.length}</span> loại phòng
                            </p>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredTypes.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl my-auto animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-[#e5e9eb] dark:border-slate-700 px-8 py-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">
                                    {isEditMode ? 'Cập nhật loại phòng' : 'Thêm loại phòng mới'}
                                </h2>
                                <p className="text-xs text-[#747779] dark:text-slate-400 mt-1 font-medium italic">Vui lòng điền đầy đủ các thông tin có dấu (*)</p>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="w-10 h-10 flex items-center justify-center text-[#747779] hover:text-[#2c2f31] dark:hover:text-slate-200 hover:bg-[#f5f7f9] dark:hover:bg-slate-700 rounded-xl transition-all text-3xl font-light">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {/* Image Upload Area */}
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 uppercase tracking-widest">Hình ảnh giới thiệu</label>
                                <div className="flex flex-wrap gap-4">
                                    <label className="w-24 h-24 border-2 border-dashed border-[#d9dde0] dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#0050d4] hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all bg-[#fbfcfd] dark:bg-slate-900 shadow-inner">
                                        <span className="material-symbols-outlined text-[#abadaf] text-3xl">add_photo_alternate</span>
                                        <span className="text-[10px] text-[#abadaf] font-bold mt-1">Tải ảnh lên</span>
                                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                                    </label>

                                    {previews.map((src, idx) => (
                                        <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-md group border border-slate-100 dark:border-slate-700">
                                            <img src={src} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setMainImageIndex(idx)}
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${mainImageIndex === idx ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                                                    title="Đặt làm ảnh chính"
                                                >
                                                    <span className="material-symbols-outlined text-sm">{mainImageIndex === idx ? 'check' : 'star'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                            {mainImageIndex === idx && (
                                                <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-[#0050d4]/80 to-transparent py-1.5 text-center">
                                                    <span className="text-[8px] font-black text-white uppercase tracking-tighter">Ảnh đại diện</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-[#abadaf] dark:text-slate-500 font-medium">* Bạn có thể tải nhiều ảnh. Nhấn <span className="text-[#0050d4]">biểu tượng ngôi sao</span> để chọn ảnh đại diện.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 uppercase tracking-widest mb-2">Tên loại phòng *</label>
                                    <input
                                        name="name"
                                        className="w-full px-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 focus:outline-none focus:border-[#0050d4] focus:ring-4 focus:ring-[#0050d4]/5 transition-all outline-none"
                                        placeholder="Ví dụ: Deluxe Sea View"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 uppercase tracking-widest mb-2">Giá cơ bản (VNĐ) *</label>
                                    <div className="relative">
                                        <input
                                            name="basePrice"
                                            type="number"
                                            className="w-full pl-12 pr-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-lg font-black text-[#0050d4] dark:text-blue-400 focus:outline-none focus:border-[#0050d4] transition-all outline-none"
                                            placeholder="500000"
                                            required
                                            value={formData.basePrice}
                                            onChange={handleChange}
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-[#0050d4]/40">₫</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 uppercase tracking-widest mb-2">Sức chứa tối đa *</label>
                                    <div className="relative">
                                        <input
                                            name="capacity"
                                            type="number"
                                            className="w-full pl-12 pr-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 outline-none focus:border-[#0050d4] transition-all"
                                            value={formData.capacity}
                                            onChange={handleChange}
                                        />
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#abadaf] text-xl">person_add</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 uppercase tracking-widest mb-2">Diện tích phòng (m²)</label>
                                    <div className="relative">
                                        <input
                                            name="size"
                                            type="number"
                                            className="w-full pl-12 pr-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 outline-none focus:border-[#0050d4] transition-all"
                                            placeholder="25"
                                            value={formData.size}
                                            onChange={handleChange}
                                        />
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#abadaf] text-xl">square_foot</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 uppercase tracking-widest mb-2">Kiểu giường</label>
                                    <div className="relative">
                                        <select
                                            name="bedType"
                                            className="w-full pl-12 pr-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 cursor-pointer outline-none focus:border-[#0050d4] appearance-none"
                                            value={formData.bedType}
                                            onChange={handleChange}
                                        >
                                            <option value="Single">Single (1 giường đơn)</option>
                                            <option value="Double">Double (1 giường đôi)</option>
                                            <option value="Twin">Twin (2 giường đơn)</option>
                                            <option value="Queen">Queen (1 giường lớn)</option>
                                            <option value="King">King (1 giường siêu lớn)</option>
                                            <option value="Family">Family (2 giường đôi)</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#abadaf] text-xl pointer-events-none">bed</span>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#abadaf] text-xl pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 uppercase tracking-widest mb-2">Hướng nhìn (View)</label>
                                    <div className="relative">
                                        <input
                                            name="view"
                                            className="w-full pl-12 pr-5 py-3.5 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-bold text-[#2c2f31] dark:text-slate-100 outline-none focus:border-[#0050d4] transition-all"
                                            placeholder="Ví dụ: Hướng biển trực diện, Hướng vườn, Hướng phố..."
                                            value={formData.view}
                                            onChange={handleChange}
                                        />
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#abadaf] text-xl">photo_camera_back</span>
                                    </div>
                                </div>
                            </div>

                            {/* Amenities Toggle Area */}
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 uppercase tracking-widest">Tiện nghi phòng</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {[
                                        { key: 'wifi', label: 'Wi-Fi miễn phí', icon: 'wifi' },
                                        { key: 'airConditioner', label: 'Điều hòa nhiệt độ', icon: 'ac_unit' },
                                        { key: 'breakfast', label: 'Bao gồm bữa sáng', icon: 'restaurant' },
                                        { key: 'minibar', label: 'Minibar & Tủ lạnh', icon: 'kitchen' },
                                        { key: 'tv', label: 'Smart TV 4K', icon: 'tv' },
                                        { key: 'balcony', label: 'Ban công ngắm cảnh', icon: 'balcony' }
                                    ].map(amenity => {
                                        const isChecked = formData.amenities[amenity.key as keyof typeof formData.amenities];
                                        return (
                                            <button
                                                key={amenity.key}
                                                type="button"
                                                onClick={() => handleAmenitiesChange(amenity.key as any)}
                                                className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all font-bold text-xs ${isChecked
                                                    ? 'bg-blue-50/50 border-[#0050d4] text-[#0050d4] dark:bg-blue-900/10 dark:text-blue-400'
                                                    : 'bg-white border-slate-100 text-[#747779] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-500 hover:border-[#abadaf]'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-lg">{amenity.icon}</span>
                                                {amenity.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-black text-[#595c5e] dark:text-slate-400 uppercase tracking-widest">Mô tả chi tiết</label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    className="w-full px-5 py-4 bg-[#fbfcfd] dark:bg-slate-900 border border-[#d9dde0] dark:border-slate-700 rounded-2xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 focus:outline-none focus:border-[#0050d4] transition-all resize-none leading-relaxed shadow-inner"
                                    placeholder="Nơi ghi chú những đặc điểm nổi bật nhất của căn phòng..."
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="flex-1 py-4 bg-[#f5f7f9] dark:bg-slate-700 text-[#4e5c71] dark:text-slate-200 text-sm font-black rounded-2xl hover:bg-[#eef1f3] dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white text-sm font-black rounded-2xl shadow-xl shadow-[#0050d4]/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
                                >
                                    {isEditMode ? 'Cập nhật thay đổi' : 'Xác nhận thêm mới'}
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
                message={`Bạn có chắc chắn muốn xóa loại phòng "${deleteTargetName}"? Hành động này sẽ gây lỗi nếu đang có phòng thuộc loại này. Bạn nên Tạm ngưng thay vì xóa.`}
                onConfirm={() => deleteTargetId && deleteRoomType(deleteTargetId)}
                onCancel={() => { setDeleteTargetId(null); setDeleteTargetName(''); }}
            />
        </div>
    );
};

export default RoomTypeAdmin;