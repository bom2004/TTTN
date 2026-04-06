import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { UserData } from '../../types';
import ConfirmModal from '../../admin/components/ConfirmModal';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import { fetchAllUsersThunk, createUserThunk, updateUserThunk, deleteUserThunk, selectAllUsers, selectUserLoading } from '../../lib/redux/reducers/user';

interface UserForm {
    full_name: string;
    email: string;
    phone: string;
    password?: string;
    role: 'customer';
    balance: string;
    totalRecharged: string;
}

const UserStaff: React.FC = () => {
    const dispatch = useAppDispatch();
    const storeUsers = useAppSelector(selectAllUsers) as unknown as UserData[];
    const loading = useAppSelector(selectUserLoading);
    const users = storeUsers.filter(u => u.role === 'customer');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');

    const [formData, setFormData] = useState<UserForm>({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'customer',
        balance: '0',
        totalRecharged: '0'
    });

    useEffect(() => {
        dispatch(fetchAllUsersThunk()).unwrap().catch(err => {
            console.error("Error fetching users:", err);
            toast.error("Không thể tải danh sách khách hàng");
        });
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

            if (isEditMode && selectedUser) {
                data.append('userId', selectedUser._id || selectedUser.id || '');
                data.append('full_name', formData.full_name);
                data.append('email', formData.email);
                data.append('phone', formData.phone);
                data.append('role', 'customer');
                data.append('balance', formData.balance);
                data.append('totalRecharged', formData.totalRecharged);
                if (formData.password) data.append('password', formData.password);

                if (avatarFile) data.append('avatar', avatarFile);

                await dispatch(updateUserThunk(data)).unwrap();
                toast.success("Cập nhật thành công");
            } else {
                data.append('full_name', formData.full_name);
                data.append('email', formData.email);
                data.append('phone', formData.phone);
                data.append('role', 'customer');
                data.append('balance', formData.balance);
                data.append('totalRecharged', formData.totalRecharged);
                data.append('password', formData.password || '123456');

                if (avatarFile) data.append('avatar', avatarFile);

                await dispatch(createUserThunk(data)).unwrap();
                toast.success("Thêm khách hàng thành công");
            }

            setIsModalOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error || "Đã xảy ra lỗi");
        }
    };

    const handleDelete = async (userId: string): Promise<void> => {
        try {
            await dispatch(deleteUserThunk(userId)).unwrap();
            toast.success("Đã xóa khách hàng thành công");
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
            role: 'customer',
            balance: (user.balance || 0).toString(),
            totalRecharged: (user.totalRecharged || 0).toString()
        });
        setSelectedUser(user);
        setAvatarFile(null);
        setAvatarPreview(user.avatar || null);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            password: '',
            role: 'customer',
            balance: '0',
            totalRecharged: '0'
        });
        setSelectedUser(null);
        setIsEditMode(false);
        setAvatarFile(null);
        setAvatarPreview(null);
    };

    const getUserLevel = (totalRecharged: number): { level: number; label: string; color: string } => {
        if (!totalRecharged || totalRecharged < 10000000) return { level: 0, label: 'Silver', color: 'bg-gray-100 text-gray-600' };
        if (totalRecharged < 50000000) return { level: 1, label: 'Gold', color: 'bg-yellow-100 text-yellow-700' };
        if (totalRecharged < 150000000) return { level: 2, label: 'Diamond', color: 'bg-blue-100 text-blue-700' };
        return { level: 3, label: 'Platinum', color: 'bg-purple-100 text-purple-700' };
    };

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Quản lý khách hàng</h1>
                    <p className="text-sm text-gray-500 mt-1">Xem, thêm, sửa và xóa thông tin khách hàng</p>
                </div>

                {/* Search and Add Button */}
                <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc email..."
                            className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
                    >
                        + Thêm khách hàng
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-12 bg-white rounded-md border border-gray-200">
                        <p className="text-gray-400 text-sm">Đang tải...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-md border border-gray-200 text-center py-12">
                        <p className="text-gray-400 text-sm">Không tìm thấy khách hàng nào</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Số dư</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cấp độ</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map((user) => {
                                    const levelInfo = getUserLevel(user.totalRecharged || 0);
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
                                                        <p className="text-xs text-gray-400">ID: {user._id?.slice(-8).toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-gray-600 text-sm">{user.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-gray-600">{user.phone || '—'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <p className="font-medium text-gray-900">{new Intl.NumberFormat('vi-VN').format(user.balance || 0)}₫</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${levelInfo.color}`}>
                                                    {levelInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                                                        title="Sửa"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteTargetId(user._id || user.id); setDeleteTargetName(user.full_name); }}
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
            </div>

            {/* Modal Create/Edit Customer */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {isEditMode ? 'Cập nhật thông tin' : 'Thêm khách hàng mới'}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Thông tin tài khoản khách hàng</p>
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
                                    placeholder="customer@example.com"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

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
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    {isEditMode ? 'Mật khẩu mới' : 'Mật khẩu'}
                                </label>
                                <input
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                    placeholder={isEditMode ? "Để trống nếu không đổi" : "••••••••"}
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                {!isEditMode && (
                                    <p className="text-[10px] text-gray-400 mt-1">Mặc định: 123456</p>
                                )}
                            </div>

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
                message={`Bạn có chắc chắn muốn xóa khách hàng "${deleteTargetName}"? Hành động này không thể hoàn tác.`}
                onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)}
                onCancel={() => { setDeleteTargetId(null); setDeleteTargetName(''); }}
            />
        </div>
    );
};

export default UserStaff;