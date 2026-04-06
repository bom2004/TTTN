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
import { selectOnlineUserIds } from '../../lib/redux/reducers/user/selectors';

interface StaffForm {
    full_name: string;
    email: string;
    phone: string;
    password?: string;
    role: 'staff' | 'admin' | 'receptionist' | 'accountant';
    salary_base: number;
}

const StaffAdmin: React.FC = () => {
    const dispatch = useAppDispatch();
    const allUsers = useAppSelector(selectAllUsers);
    const loading = useAppSelector(selectUserLoading);
    const onlineUserIds = useAppSelector(selectOnlineUserIds);

    // Filter only staff members
    const staffMembers = allUsers.filter(u => ['staff', 'receptionist', 'accountant'].includes(u.role));

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 10;
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [selectedStaff, setSelectedStaff] = useState<UserData | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');

    const [formData, setFormData] = useState<StaffForm>({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'staff',
        salary_base: 0
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

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('full_name', formData.full_name);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('role', formData.role);

            if (avatarFile) data.append('avatar', avatarFile);

            if (isEditMode && selectedStaff) {
                data.append('userId', selectedStaff._id || selectedStaff.id);
                await dispatch(updateUserThunk(data)).unwrap();

                if (newPassword.trim()) {
                    await dispatch(adminUpdatePasswordThunk({
                        userId: selectedStaff._id || selectedStaff.id,
                        newPassword: newPassword
                    })).unwrap();
                }
                toast.success("Cập nhật thông tin nhân viên thành công");
            } else {
                data.append('password', formData.password || '');
                await dispatch(createUserThunk(data)).unwrap();
                toast.success("Tạo nhân viên mới thành công");
            }

            setIsModalOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error || "Đã xảy ra lỗi");
        }
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            password: '',
            role: 'staff',
            salary_base: 0
        });
        setAvatarFile(null);
        setAvatarPreview(null);
        setNewPassword('');
        setIsEditMode(false);
    };

    const openEditModal = (staff: UserData): void => {
        setFormData({
            full_name: staff.full_name,
            email: staff.email,
            phone: staff.phone || '',
            role: staff.role as any,
            salary_base: 0
        });

        setSelectedStaff(staff);
        setAvatarPreview(staff.avatar || null);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (userId: string): Promise<void> => {
        try {
            await dispatch(deleteUserThunk(userId)).unwrap();
            toast.success("Xóa nhân viên thành công");
        } catch (error: any) {
            toast.error(error || "Lỗi khi xóa");
        } finally {
            setDeleteTargetId(null);
            setDeleteTargetName('');
        }
    };

    const getRoleLabel = (role: string): string => {
        switch (role) {
            case 'staff': return 'Quản lý';
            case 'receptionist': return 'Lễ tân';
            case 'accountant': return 'Kế toán';
            default: return role;
        }
    };

    const getRoleColor = (role: string): string => {
        switch (role) {
            case 'staff': return 'text-blue-600 bg-blue-50';
            case 'receptionist': return 'text-amber-600 bg-amber-50';
            case 'accountant': return 'text-indigo-600 bg-indigo-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const filteredStaff = staffMembers.filter(u => {
        const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === '' || u.role === roleFilter;

        const staffId = u._id || u.id;
        const isOnline = onlineUserIds.includes(staffId);
        const matchesStatus = statusFilter === '' ||
            (statusFilter === 'online' ? isOnline : !isOnline);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE);
    const paginatedStaff = filteredStaff.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Quản lý nhân viên</h1>
                <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản đội ngũ nhân viên trong hệ thống</p>
            </div>

            {/* Search and Add Button */}
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
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                >
                    <option value="">Tất cả vai trò</option>
                    <option value="staff">Quản lý</option>
                    <option value="receptionist">Lễ tân</option>
                    <option value="accountant">Kế toán</option>
                </select>
                <select
                    className="px-4 py-2 border border-gray-200 rounded-md text-sm bg-white text-gray-700 focus:outline-none focus:border-gray-400"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                </select>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition ml-auto"
                >
                    + Thêm nhân viên
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-400 text-sm">Đang tải...</p>
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className="bg-white rounded-md border border-gray-200 text-center py-12">
                    <p className="text-gray-400 text-sm">Không tìm thấy nhân viên nào</p>
                </div>
            ) : (
                <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedStaff.map((staff) => {
                                const staffId = staff._id || staff.id;
                                const isOnline = onlineUserIds.includes(staffId);
                                return (
                                    <tr key={staffId} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium overflow-hidden">
                                                        {staff.avatar ? (
                                                            <img src={staff.avatar} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            staff.full_name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{staff.full_name}</p>
                                                    <p className="text-xs text-gray-400">{staff.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(staff.role)}`}>
                                                {getRoleLabel(staff.role)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                                                {isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-gray-600">{staff.phone || '—'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => openEditModal(staff)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => { setDeleteTargetId(staff._id || staff.id); setDeleteTargetName(staff.full_name); }}
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
            {filteredStaff.length > 0 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredStaff.length}
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
                                    {isEditMode ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Thông tin tài khoản nhân viên</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Avatar Upload */}
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
                                    placeholder="nhanvien@example.com"
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
                                        <option value="staff">Quản lý</option>
                                        <option value="receptionist">Lễ tân</option>
                                        <option value="accountant">Kế toán</option>
                                    </select>
                                </div>
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
                message={`Bạn có chắc chắn muốn xóa nhân viên "${deleteTargetName}" khỏi hệ thống?`}
                onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)}
                onCancel={() => { setDeleteTargetId(null); setDeleteTargetName(''); }}
            />
        </div>
    );
};

export default StaffAdmin;