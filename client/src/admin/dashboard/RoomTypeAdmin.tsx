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
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 5;
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

        // Tách ảnh cũ và ảnh mới
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

    const getPriceUnit = (typeName: string) => {
        const lowerName = typeName.toLowerCase();
        if (lowerName.includes('karaoke')) return 'tiếng';
        if (lowerName.includes('tiệc')) return 'buổi';
        return 'ngày';
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive
            ? { text: 'Đang kinh doanh', color: 'text-emerald-600 bg-emerald-50' }
            : { text: 'Tạm ngưng', color: 'text-rose-600 bg-rose-50' };
    };

    const filteredTypes = roomTypes.filter(type => {
        const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' ||
            (filterStatus === 'active' && type.isActive) ||
            (filterStatus === 'inactive' && !type.isActive);
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredTypes.length / ITEMS_PER_PAGE);
    const paginatedTypes = filteredTypes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Loại phòng khách sạn</h1>
                    <p className="text-sm text-gray-500 mt-1">Định nghĩa các tiêu chuẩn phòng và giá cơ bản</p>
                </div>

                {/* Search and Filters */}
                <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Tìm theo tên loại phòng..."
                            className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="flex gap-1">
                        {[
                            { value: 'All', label: 'Tất cả' },
                            { value: 'active', label: 'Đang kinh doanh' },
                            { value: 'inactive', label: 'Tạm ngưng' }
                        ].map((status) => (
                            <button
                                key={status.value}
                                onClick={() => { setFilterStatus(status.value); setCurrentPage(1); }}
                                className={`px-3 py-1.5 text-sm rounded-md transition ${filterStatus === status.value
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
                    >
                        + Thêm loại phòng
                    </button>
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
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedTypes.map((type) => {
                                    const statusBadge = getStatusBadge(type.isActive);
                                    return (
                                        <tr key={type._id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                        <img
                                                            src={type.image || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=100&h=100&fit=crop'}
                                                            className="w-full h-full object-cover"
                                                            alt={type.name}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{type.name}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-[200px]">
                                                            {type.description || 'Chưa có mô tả'}
                                                        </p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                {type.capacity ?? 2} người
                                                            </span>
                                                            {type.size && (
                                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                    {type.size}m²
                                                                </span>
                                                            )}
                                                            {type.bedType && (
                                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                    {type.bedType}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-bold text-gray-900">
                                                        {new Intl.NumberFormat('vi-VN').format(type.basePrice)}₫
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">/ {getPriceUnit(type.name)}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-gray-700">{type.totalInventory ?? 0} phòng</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                                    {statusBadge.text}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => toggleStatus(type._id)}
                                                        className={`p-1.5 text-xs font-medium rounded-md transition ${type.isActive
                                                                ? 'text-amber-600 hover:bg-amber-50'
                                                                : 'text-emerald-600 hover:bg-emerald-50'
                                                            }`}
                                                        title={type.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">
                                                            {type.isActive ? 'pause' : 'play_arrow'}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(type)}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                                                        title="Sửa"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteTargetId(type._id); setDeleteTargetName(type.name); }}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 transition"
                                                        title="Xóa"
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
            </div>

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
                    <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {isEditMode ? 'Chỉnh sửa loại phòng' : 'Thêm loại phòng mới'}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Thông tin chi tiết loại phòng</p>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Hình ảnh loại phòng</label>
                                <div className="flex flex-wrap gap-3">
                                    <label className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition bg-gray-50">
                                        <span className="material-symbols-outlined text-gray-400 text-2xl">add_photo_alternate</span>
                                        <span className="text-[9px] text-gray-400">Thêm</span>
                                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                                    </label>

                                    {previews.map((src, idx) => (
                                        <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden border-2 border-gray-200 group">
                                            <img src={src} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                                            {mainImageIndex === idx && (
                                                <div className="absolute top-0 left-0 right-0 bg-gray-900/70 text-white text-[8px] font-medium text-center py-0.5">
                                                    Ảnh chính
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-0 right-0 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition"
                                            >
                                                ×
                                            </button>
                                            {!mainImageIndex && idx === 0 && previews.length === 1 && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[8px] font-medium text-center py-0.5">
                                                    Ảnh chính
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {previews.length > 0 && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[10px] text-gray-500">Chọn ảnh chính:</span>
                                        <select
                                            value={mainImageIndex}
                                            onChange={(e) => setMainImageIndex(parseInt(e.target.value))}
                                            className="text-xs border border-gray-200 rounded px-2 py-1"
                                        >
                                            {previews.map((_, idx) => (
                                                <option key={idx} value={idx}>Ảnh {idx + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <p className="text-[10px] text-gray-400 mt-1">Có thể chọn nhiều ảnh. Ảnh đầu tiên sẽ là ảnh đại diện mặc định</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Tên loại phòng *</label>
                                    <input
                                        name="name"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        placeholder="Ví dụ: Deluxe Sea View"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Giá cơ bản (VNĐ) *</label>
                                    <input
                                        name="basePrice"
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        placeholder="500000"
                                        required
                                        value={formData.basePrice}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Tổng số phòng</label>
                                    <input
                                        name="totalInventory"
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-500"
                                        placeholder="0"
                                        disabled
                                        value={formData.totalInventory}
                                        onChange={handleChange}
                                    />
                                    <p className="text-[9px] text-gray-400 mt-0.5">(Tự động từ Quản lý phòng)</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Sức chứa (người)</label>
                                    <input
                                        name="capacity"
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        value={formData.capacity}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Diện tích (m²)</label>
                                    <input
                                        name="size"
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        placeholder="25"
                                        value={formData.size}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Loại giường</label>
                                    <select
                                        name="bedType"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-gray-400"
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
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Hướng nhìn</label>
                                    <input
                                        name="view"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        placeholder="Hướng biển, Hướng phố..."
                                        value={formData.view}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Amenities */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Tiện nghi</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {[
                                        { key: 'wifi', label: 'Wi-Fi' },
                                        { key: 'airConditioner', label: 'Điều hòa' },
                                        { key: 'breakfast', label: 'Bữa sáng' },
                                        { key: 'minibar', label: 'Minibar' },
                                        { key: 'tv', label: 'TV' },
                                        { key: 'balcony', label: 'Ban công' }
                                    ].map(amenity => {
                                        const isChecked = formData.amenities[amenity.key as keyof typeof formData.amenities];
                                        return (
                                            <label key={amenity.key} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleAmenitiesChange(amenity.key as any)}
                                                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                                                />
                                                <span className="text-sm text-gray-700">{amenity.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Mô tả chi tiết</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition resize-none"
                                    placeholder="Mô tả đặc điểm nổi bật của loại phòng..."
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
                                >
                                    {isEditMode ? 'Cập nhật' : 'Thêm loại phòng'}
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
                message={`Bạn có chắc chắn muốn xóa loại phòng "${deleteTargetName}"? Hành động này không thể hoàn tác.`}
                onConfirm={() => deleteTargetId && deleteRoomType(deleteTargetId)}
                onCancel={() => { setDeleteTargetId(null); setDeleteTargetName(''); }}
            />
        </div>
    );
};

export default RoomTypeAdmin;