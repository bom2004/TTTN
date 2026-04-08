import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { UserData } from '../../types';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import {
    fetchAllUsersThunk,
    createUserThunk,
    updateUserThunk,
    deleteUserThunk,
    adminUpdatePasswordThunk,
    selectAllUsers,
    selectUserLoading,
} from '../../lib/redux/reducers/user';

interface UserForm {
    full_name: string;
    email: string;
    phone: string;
    password?: string;
    role: 'customer' | 'staff' | 'admin' | 'hotelOwner' | 'receptionist' | 'accountant';
    totalSpent: string;
}

const UserAdmin: React.FC = () => {
    const dispatch = useAppDispatch();
    const users = useAppSelector(selectAllUsers);
    const loading = useAppSelector(selectUserLoading);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterRole, setFilterRole] = useState<string>('');
    const [filterGenius, setFilterGenius] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 10;
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');

    const [formData, setFormData] = useState<UserForm>({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'customer',
        totalSpent: '0'
    });

    useEffect(() => {
        dispatch(fetchAllUsersThunk());
    }, [dispatch]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleInvite = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        try {
            if (isEditMode && selectedUser) {
                const data = new FormData();
                data.append('userId', selectedUser._id || selectedUser.id);
                data.append('full_name', formData.full_name);
                data.append('email', formData.email);
                data.append('phone', formData.phone);
                data.append('role', formData.role);
                data.append('totalSpent', formData.totalSpent);
                if (avatarFile) data.append('avatar', avatarFile);

                await dispatch(updateUserThunk(data)).unwrap();

                if (newPassword.trim()) {
                    await dispatch(adminUpdatePasswordThunk({
                        userId: selectedUser._id || selectedUser.id,
                        newPassword: newPassword
                    })).unwrap();
                }
                toast.success("Cập nhật người dùng thành công");
            } else {
                const data = new FormData();
                data.append('full_name', formData.full_name);
                data.append('email', formData.email);
                data.append('phone', formData.phone);
                data.append('role', formData.role);
                data.append('totalSpent', formData.totalSpent);
                data.append('password', formData.password || '');
                if (avatarFile) data.append('avatar', avatarFile);

                await dispatch(createUserThunk(data)).unwrap();
                toast.success("Tạo người dùng thành công");
            }

            setIsModalOpen(false);
            setAvatarFile(null);
            setAvatarPreview(null);
            setNewPassword('');
        } catch (error: any) {
            toast.error(error || "Đã xảy ra lỗi");
        }
    };

    const handleDelete = async (userId: string): Promise<void> => {
        try {
            await dispatch(deleteUserThunk(userId)).unwrap();
            toast.success("Xóa người dùng thành công");
        } catch (error: any) {
            toast.error(error || "Lỗi khi xóa");
        } finally {
            setDeleteTargetId(null);
            setDeleteTargetName('');
        }
    };

    const openEditModal = (user: UserData): void => {
        setFormData({
            full_name: user.full_name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            totalSpent: ((user as any).totalSpent || 0).toString()
        });

        setSelectedUser(user);
        setAvatarFile(null);
        setAvatarPreview(user.avatar || null);
        setNewPassword('');
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const getRoleLabel = (role: string): string => {
        switch (role) {
            case 'admin': return 'Quản trị viên';
            case 'hotelOwner': return 'Chủ khách sạn';
            case 'staff': return 'Quản lý';
            case 'receptionist': return 'Lễ tân';
            case 'accountant': return 'Kế toán';
            default: return 'Khách hàng';
        }
    };

    const getRoleColor = (role: string): string => {
        switch (role) {
            case 'admin': return 'text-purple-600 bg-purple-50';
            case 'hotelOwner': return 'text-indigo-600 bg-indigo-50';
            case 'staff': return 'text-emerald-600 bg-emerald-50';
            case 'receptionist': return 'text-blue-600 bg-blue-50';
            case 'accountant': return 'text-amber-600 bg-amber-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getUserLevel = (totalSpent: number): { level: number; label: string } => {
        if (totalSpent < 2000000) return { level: 0, label: 'Silver' };
        if (totalSpent < 7000000) return { level: 1, label: 'Gold' };
        if (totalSpent < 12000000) return { level: 2, label: 'Diamond' };
        return { level: 3, label: `Platinum` };
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === '' || u.role === filterRole;
        const userLevel = getUserLevel((u as any).totalSpent || 0).level.toString();
        const matchesGenius = filterGenius === '' || userLevel === filterGenius;
        return matchesSearch && matchesRole && matchesGenius;
    });

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Quản lý người dùng</h1>
                <p className="text-sm text-gray-500 mt-1">Quản lý tất cả tài khoản người dùng và hạng thành viên</p>
            </div>

            {/* Search and Filters */}
            <div className="mb-4 flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Tìm theo tên hoặc email..."
                        className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <select
                    className="px-4 py-2 border border-gray-200 rounded-md text-sm bg-white text-gray-700 focus:outline-none focus:border-gray-400"
                    value={filterRole}
                    onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
                >
                    <option value="">Tất cả vai trò</option>
                    <option value="customer">Khách hàng</option>
                    <option value="hotelOwner">Chủ khách sạn</option>
                    <option value="admin">Quản trị viên</option>
                    <option value="staff">Quản lý</option>
                    <option value="receptionist">Lễ tân</option>
                    <option value="accountant">Kế toán</option>
                </select>
                <select
                    className="px-4 py-2 border border-gray-200 rounded-md text-sm bg-white text-gray-700 focus:outline-none focus:border-gray-400"
                    value={filterGenius}
                    onChange={(e) => { setFilterGenius(e.target.value); setCurrentPage(1); }}
                >
                    <option value="">Mọi cấp độ</option>
                    <option value="0">Silver</option>
                    <option value="1">Gold</option>
                    <option value="2">Diamond</option>
                    <option value="3">Platinum</option>
                </select>
                <button
                    onClick={() => { setIsEditMode(false); setFormData({ full_name: '', email: '', phone: '', password: '', role: 'customer', totalSpent: '0' }); setAvatarFile(null); setAvatarPreview(null); setIsModalOpen(true); }}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition ml-auto"
                >
                    + Thêm người dùng
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-400 text-sm">Đang tải...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-md border border-gray-200 text-center py-12">
                    <p className="text-gray-400 text-sm">Không tìm thấy người dùng nào</p>
                </div>
            ) : (
                <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng chi tiêu</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cấp độ</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedUsers.map((user) => {
                                const levelInfo = getUserLevel((user as any).totalSpent || 0);
                                return (
                                    <tr key={user._id || user.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium overflow-hidden">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        user.full_name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.full_name}</p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <p className="font-medium text-emerald-600">{new Intl.NumberFormat('vi-VN').format((user as any).totalSpent || 0)}₫</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium 
                                                ${levelInfo.level === 0 ? 'bg-gray-100 text-gray-600' : 
                                                  levelInfo.level === 1 ? 'bg-yellow-100 text-yellow-700' : 
                                                  levelInfo.level === 2 ? 'bg-blue-100 text-blue-700' : 
                                                  'bg-purple-100 text-purple-700'}`}>
                                                {levelInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => { setDeleteTargetId(user._id || user.id); setDeleteTargetName(user.full_name); }}
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
            )}

            {/* Pagination */}
            {filteredUsers.length > 0 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredUsers.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {isEditMode ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Thông tin tài khoản</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleInvite} className="p-6 space-y-4">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl overflow-hidden">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            <span className="material-symbols-outlined text-3xl">person</span>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition">
                                        <span className="material-symbols-outlined text-white text-[14px]">photo_camera</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                                <p className="text-[10px] text-gray-400">Ảnh đại diện (tùy chọn)</p>
                            </div>

                            {/* Form fields */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Họ và tên *</label>
                                <input
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                    placeholder="Nguyễn Văn A"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                                <input
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                    placeholder="example@gmail.com"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Số điện thoại</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        placeholder="0123456789"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Vai trò</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-gray-400"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                    >
                                        <option value="customer">Khách hàng</option>
                                        <option value="hotelOwner">Chủ khách sạn</option>
                                        <option value="staff">Quản lý</option>
                                        <option value="receptionist">Lễ tân</option>
                                        <option value="accountant">Kế toán</option>
                                        <option value="admin">Quản trị viên</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Tổng chi tiêu (VNĐ)</label>
                                <input
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                    type="number"
                                    value={formData.totalSpent}
                                    onChange={(e) => setFormData({ ...formData, totalSpent: e.target.value })}
                                />
                            </div>

                            {!isEditMode ? (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Mật khẩu *</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        placeholder="••••••••"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Mật khẩu mới</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                        placeholder="Để trống nếu không đổi"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                            )}

                            <button className="w-full mt-2 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition">
                                {isEditMode ? 'Cập nhật' : 'Tạo tài khoản'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteTargetId}
                title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa người dùng "${deleteTargetName}"? Hành động này không thể hoàn tác.`}
                onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)}
                onCancel={() => { setDeleteTargetId(null); setDeleteTargetName(''); }}
            />
        </div>
    );
};

export default UserAdmin;