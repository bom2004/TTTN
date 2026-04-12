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
    role: 'customer' | 'staff' | 'admin';
    totalSpent: string;
}

const UserAdmin: React.FC = () => {
    const dispatch = useAppDispatch();
    const users = useAppSelector(selectAllUsers);
    const loading = useAppSelector(selectUserLoading);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterRole, setFilterRole] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
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

    const handleToggleLock = async (user: UserData): Promise<void> => {
        try {
            const currentStatus = user.isActive !== false;
            const data = new FormData();
            data.append('userId', user._id || user.id);
            data.append('isActive', currentStatus ? 'false' : 'true');
            
            await dispatch(updateUserThunk(data)).unwrap();
            toast.success(currentStatus ? "Đã khóa tài khoản thành công" : "Tài khoản đã được mở khóa");
            dispatch(fetchAllUsersThunk());
        } catch (error: any) {
            toast.error(error || "Đã xảy ra lỗi khi đổi trạng thái khóa");
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

    const handleExportCSV = (): void => {
        try {
            const headers = ["Họ tên", "Email", "Số điện thoại", "Vai trò", "Tổng chi tiêu", "Cấp độ", "Trạng thái", "Ngày tham gia"];
            const csvRows = filteredUsers.map(u => [
                u.full_name,
                u.email,
                u.phone || "",
                getRoleLabel(u.role),
                u.totalSpent || 0,
                getUserLevel((u as any).totalSpent || 0).label,
                u.isActive !== false ? "Đang hoạt động" : "Đã khóa",
                u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : ""
            ].join(","));

            const csvContent = [headers.join(","), ...csvRows].join("\n");
            const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `danh_sach_nguoi_dung_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Đã xuất file CSV thành công");
        } catch (error) {
            toast.error("Lỗi khi xuất file");
        }
    };

    const getRoleLabel = (role: string): string => {
        switch (role) {
            case 'admin': return 'Quản trị viên';
            case 'staff': return 'Nhân viên';
            default: return 'Khách hàng';
        }
    };

    const getRoleColor = (role: string): string => {
        switch (role) {
            case 'admin': return 'text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400';
            case 'staff': return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400';
            default: return 'text-[#4e5c71] bg-[#e5e9eb] dark:bg-slate-700 dark:text-slate-400';
        }
    };

    const getUserLevel = (totalSpent: number): { level: number; label: string } => {
        if (totalSpent < 2000000) return { level: 0, label: 'Silver' };
        if (totalSpent < 7000000) return { level: 1, label: 'Gold' };
        if (totalSpent < 12000000) return { level: 2, label: 'Diamond' };
        return { level: 3, label: `Platinum` };
    };

    const getUserStatus = (user: UserData): { status: string; color: string; dotColor: string } => {
        // Giả định logic - có thể thay đổi dựa trên dữ liệu thực tế
        const isActive = user.isActive !== false;
        if (isActive) {
            return {
                status: 'Đang hoạt động',
                color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                dotColor: 'bg-green-600'
            };
        }
        return {
            status: 'Đã khóa',
            color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            dotColor: 'bg-red-600'
        };
    };

    const getTotalUsers = () => users.length;
    const getActiveUsers = () => users.filter(u => u.isActive !== false).length;
    const getVipUsers = () => users.filter(u => getUserLevel((u as any).totalSpent || 0).level >= 2).length;
    const getLockedUsers = () => users.filter(u => u.isActive === false).length;

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === '' || u.role === filterRole;
        const userLevel = getUserLevel((u as any).totalSpent || 0).level.toString();
        const matchesGenius = filterStatus === '' || userLevel === filterStatus;
        return matchesSearch && matchesRole && matchesGenius;
    });

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="p-8 bg-[#f5f7f9] dark:bg-slate-900 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">Quản lý người dùng</h2>
                        <p className="text-[#595c5e] dark:text-slate-400 mt-1 font-['Inter',sans-serif]">Danh sách tất cả người dùng và khách hàng trong hệ thống.</p>
                    </div>
                    <button
                        onClick={() => { setIsEditMode(false); setFormData({ full_name: '', email: '', phone: '', password: '', role: 'customer', totalSpent: '0' }); setAvatarFile(null); setAvatarPreview(null); setIsModalOpen(true); }}
                        className="bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0050d4]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                        Thêm người dùng mới
                    </button>
                </div>

                {/* Dashboard Overview Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#0050d4] flex items-center justify-center">
                            <span className="material-symbols-outlined">person</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Tổng người dùng</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{getTotalUsers()}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">how_to_reg</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Đang hoạt động</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{getActiveUsers()}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-[#fe9cf4]/20 dark:bg-[#8e3a8a]/20 text-[#8e3a8a] flex items-center justify-center">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Khách hàng VIP</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{getVipUsers()}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">person_off</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Đã khóa</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{getLockedUsers()}</p>
                        </div>
                    </div>
                </div>

                {/* Table & Filters Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-transparent overflow-hidden shadow-sm">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-[#e5e9eb] dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Search Input */}
                        <div className="relative w-full md:max-w-md">
                            <input
                                type="text"
                                placeholder="Tìm tên hoặc email người dùng..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-11 pr-4 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0050d4] transition-all text-[#2c2f31] dark:text-slate-100 placeholder-[#abadaf]"
                            />
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-[20px]">search</span>
                        </div>

                        {/* Filters & Actions */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* Role Filter */}
                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={filterRole}
                                    onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
                                    className="w-full appearance-none pl-10 pr-10 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:ring-2 focus:ring-[#0050d4]/20 cursor-pointer transition-all"
                                >
                                    <option value="">Vai trò: Tất cả</option>
                                    <option value="customer">Khách hàng</option>
                                    <option value="staff">Nhân viên</option>
                                    <option value="admin">Quản trị viên</option>
                                </select>
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">admin_panel_settings</span>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">expand_more</span>
                            </div>

                            {/* Level Filter */}
                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                    className="w-full appearance-none pl-10 pr-10 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:ring-2 focus:ring-[#0050d4]/20 cursor-pointer transition-all"
                                >
                                    <option value="">Cấp độ: Tất cả</option>
                                    <option value="0">Cấp độ: Silver</option>
                                    <option value="1">Cấp độ: Gold</option>
                                    <option value="2">Cấp độ: Diamond</option>
                                    <option value="3">Cấp độ: Platinum</option>
                                </select>
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">filter_list</span>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">expand_more</span>
                            </div>

                            {/* Export Data */}
                            <button 
                                onClick={handleExportCSV}
                                title="Xuất dữ liệu CSV" 
                                className="w-10 h-10 flex items-center justify-center border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl hover:bg-[#eef1f3] dark:hover:bg-slate-700 text-[#4e5c71] dark:text-slate-400 transition-all shadow-sm active:scale-90"
                            >
                                <span className="material-symbols-outlined text-[20px]">download</span>
                            </button>
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
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-5xl text-[#abadaf] dark:text-slate-500 mb-3">person_off</span>
                            <p className="text-[#747779] dark:text-slate-400 text-sm font-medium">Không tìm thấy người dùng nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#eef1f3]/50 dark:bg-slate-900/50">
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Họ tên</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Email</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Số điện thoại</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Vai trò</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Chi tiêu</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Cấp độ</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Ngày tham gia</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Trạng thái</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider text-right font-['Manrope',sans-serif]">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e9eb] dark:divide-slate-700">
                                    {paginatedUsers.map((u) => {
                                        const levelInfo = getUserLevel(u.totalSpent || 0);
                                        const statusInfo = getUserStatus(u);
                                        return (
                                            <tr key={u._id || u.id} className="hover:bg-[#f5f7f9] dark:hover:bg-slate-900/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[#e5e9eb] dark:bg-slate-700 overflow-hidden">
                                                            {u.avatar ? (
                                                                <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[#595c5e] dark:text-slate-400 font-bold">
                                                                    {u.full_name.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#2c2f31] dark:text-slate-100">{u.full_name}</p>
                                                            <p className="text-xs text-[#747779] dark:text-slate-400">{levelInfo.label === 'Platinum' ? 'Khách hàng VIP' : (u.role === 'customer' ? 'Khách hàng' : getRoleLabel(u.role))}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#4e5c71] dark:text-slate-400 font-medium">{u.email}</td>
                                                <td className="px-6 py-4 text-sm text-[#4e5c71] dark:text-slate-400">{u.phone || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getRoleColor(u.role)}`}>
                                                        {getRoleLabel(u.role)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-[#0050d4] dark:text-[#7b9cff] font-['Inter',sans-serif]">
                                                        {new Intl.NumberFormat('vi-VN').format(u.totalSpent || 0)}₫
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold 
                                                        ${levelInfo.level === 0 ? 'bg-[#e5e9eb] text-[#4e5c71] dark:bg-slate-700 dark:text-slate-400' :
                                                            levelInfo.level === 1 ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                levelInfo.level === 2 ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                    'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                                        {levelInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#4e5c71] dark:text-slate-400 font-medium">
                                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`}></span>
                                                        {statusInfo.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-1 justify-end">
                                                        <button
                                                            onClick={() => handleToggleLock(u)}
                                                            className={`p-2 rounded-lg transition-all ${u.isActive !== false ? 'hover:bg-amber-50 text-[#747779] hover:text-amber-600 dark:hover:bg-amber-900/20' : 'hover:bg-green-50 text-[#747779] hover:text-green-600 dark:hover:bg-green-900/20'}`}
                                                            title={u.isActive !== false ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                                        >
                                                            <span className="material-symbols-outlined text-xl">{u.isActive !== false ? "lock" : "lock_open"}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(u)}
                                                            className="p-2 hover:bg-[#eef1f3] dark:hover:bg-slate-700 rounded-lg text-[#747779] hover:text-[#0050d4] transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => { setDeleteTargetId(u._id || u.id); setDeleteTargetName(u.full_name); }}
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
                    {filteredUsers.length > 0 && (
                        <div className="px-6 py-4 border-t border-[#e5e9eb] dark:border-slate-700 flex items-center justify-between">
                            <p className="text-xs font-medium text-[#747779] dark:text-slate-400">
                                Hiển thị <span className="text-[#2c2f31] dark:text-slate-100">{paginatedUsers.length}</span> trên <span className="text-[#2c2f31] dark:text-slate-100">{filteredUsers.length}</span> người dùng
                            </p>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredUsers.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {/* Recent Activity / Bento Item */}
                <div className="mt-8 bg-[#eef1f3]/50 dark:bg-slate-800/50 p-8 rounded-2xl border border-dashed border-[#d9dde0] dark:border-slate-700 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-[#0050d4]">
                        <span className="material-symbols-outlined text-3xl">insights</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">Phân tích hành vi người dùng</h3>
                        <p className="text-sm text-[#4e5c71] dark:text-slate-400 max-w-md mx-auto">Sử dụng dữ liệu để cải thiện dịch vụ và tăng tỷ lệ khách hàng quay lại. Xem báo cáo chi tiết tại mục Thống kê.</p>
                    </div>
                    <button className="mt-2 text-sm font-bold text-[#0050d4] hover:underline">Xem báo cáo chi tiết →</button>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-[#e5e9eb] dark:border-slate-700 rounded-t-2xl px-6 py-5 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-extrabold text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">
                                    {isEditMode ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}
                                </h2>
                                <p className="text-xs text-[#747779] dark:text-slate-400 mt-0.5 font-medium">Thông tin tài khoản</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-[#747779] hover:text-[#2c2f31] dark:hover:text-slate-200 hover:bg-[#eef1f3] dark:hover:bg-slate-700 rounded-lg transition-all text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleInvite} className="p-6 space-y-5">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-2xl bg-[#eef1f3] dark:bg-slate-700 flex items-center justify-center text-[#abadaf] dark:text-slate-500 overflow-hidden">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl">person</span>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-[#0050d4] to-[#0046bb] rounded-full flex items-center justify-center cursor-pointer hover:shadow-lg transition-all shadow-md">
                                        <span className="material-symbols-outlined text-white text-sm">photo_camera</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                                <p className="text-[10px] font-medium text-[#747779] dark:text-slate-400">Ảnh đại diện (tùy chọn)</p>
                            </div>

                            {/* Form fields */}
                            <div>
                                <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-1.5 uppercase tracking-wide">Họ và tên *</label>
                                <input
                                    className="w-full px-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0050d4] transition-all"
                                    placeholder="Nguyễn Văn A"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email *</label>
                                <input
                                    className="w-full px-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0050d4] transition-all"
                                    placeholder="example@gmail.com"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-1.5 uppercase tracking-wide">Số điện thoại</label>
                                    <input
                                        className="w-full px-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0050d4] transition-all"
                                        placeholder="0123456789"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-1.5 uppercase tracking-wide">Vai trò</label>
                                    <select
                                        className="w-full px-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0050d4] transition-all cursor-pointer"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                    >
                                        <option value="customer">Khách hàng</option>
                                        <option value="staff">Nhân viên</option>
                                        <option value="admin">Quản trị viên</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-1.5 uppercase tracking-wide">Tổng chi tiêu (VNĐ)</label>
                                <input
                                    className="w-full px-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0050d4] transition-all"
                                    type="number"
                                    value={formData.totalSpent}
                                    onChange={(e) => setFormData({ ...formData, totalSpent: e.target.value })}
                                />
                            </div>

                            {!isEditMode ? (
                                <div>
                                    <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-1.5 uppercase tracking-wide">Mật khẩu *</label>
                                    <input
                                        className="w-full px-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0050d4] transition-all"
                                        placeholder="••••••••"
                                        type="password"
                                        required={!isEditMode}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-1.5 uppercase tracking-wide">Mật khẩu mới</label>
                                    <input
                                        className="w-full px-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0050d4] transition-all"
                                        placeholder="Để trống nếu không đổi"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                            )}

                            <button className="w-full mt-4 py-3 bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 shadow-md">
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