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
            case 'staff': return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'receptionist': return 'text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
            case 'accountant': return 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'text-[#4e5c71] bg-[#e5e9eb] dark:bg-slate-700 dark:text-slate-400';
        }
    };

    const getStaffStats = () => {
        const total = staffMembers.length;
        const online = staffMembers.filter(u => onlineUserIds.includes(u._id || u.id)).length;
        const managers = staffMembers.filter(u => u.role === 'staff').length;
        const others = total - managers;
        return { total, online, managers, others };
    };

    const handleExportCSV = (): void => {
        try {
            const headers = ["Nhân viên", "Email", "Số điện thoại", "Vai trò", "Trạng thái"];
            const csvRows = filteredStaff.map(s => {
                const isOnline = onlineUserIds.includes(s._id || s.id);
                return [
                    s.full_name,
                    s.email,
                    s.phone || "",
                    getRoleLabel(s.role),
                    isOnline ? "Online" : "Offline"
                ].join(",");
            });

            const csvContent = [headers.join(","), ...csvRows].join("\n");
            const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `danh_sach_nhan_vien_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Đã xuất file CSV thành công");
        } catch (error) {
            toast.error("Lỗi khi xuất file");
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
    const stats = getStaffStats();

    return (
        <div className="p-8 bg-[#f5f7f9] dark:bg-slate-900 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">Quản lý nhân viên</h2>
                        <p className="text-[#595c5e] dark:text-slate-400 mt-1 font-['Inter',sans-serif]">Quản lý tài khoản đội ngũ nhân viên và điều phối quyền truy cập.</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0050d4]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                        Thêm nhân viên mới
                    </button>
                </div>

                {/* Dashboard Overview Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm group hover:shadow-md transition-all">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#0050d4] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">badge</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Tổng nhân viên</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{stats.total}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm group hover:shadow-md transition-all">
                        <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">sensors</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Đang Online</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{stats.online}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm group hover:shadow-md transition-all">
                        <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">manage_accounts</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Cấp quản lý</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{stats.managers}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm group hover:shadow-md transition-all">
                        <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">engineering</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Nhân viên khác</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{stats.others}</p>
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
                                placeholder="Tìm tên hoặc email nhân viên..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-11 pr-4 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0050d4] transition-all text-[#2c2f31] dark:text-slate-100 placeholder-[#abadaf]"
                            />
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-[20px]">search</span>
                        </div>

                        {/* Filters & Actions */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={roleFilter}
                                    onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                                    className="w-full appearance-none pl-10 pr-10 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:ring-2 focus:ring-[#0050d4]/20 cursor-pointer transition-all"
                                >
                                    <option value="">Vai trò: Tất cả</option>
                                    <option value="staff">Vị trí: Quản lý</option>
                                    <option value="receptionist">Vị trí: Lễ tân</option>
                                    <option value="accountant">Vị trí: Kế toán</option>
                                </select>
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">group_work</span>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">expand_more</span>
                            </div>

                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                    className="w-full appearance-none pl-10 pr-10 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:ring-2 focus:ring-[#0050d4]/20 cursor-pointer transition-all"
                                >
                                    <option value="">Trạng thái: Tất cả</option>
                                    <option value="online">Đang Online</option>
                                    <option value="offline">Đang Offline</option>
                                </select>
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">fiber_manual_record</span>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">expand_more</span>
                            </div>

                            <button onClick={handleExportCSV} title="Xuất báo cáo nhân sự" className="w-10 h-10 flex items-center justify-center border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl hover:bg-[#eef1f3] dark:hover:bg-slate-700 text-[#4e5c71] dark:text-slate-400 transition-all shadow-sm active:scale-90">
                                <span className="material-symbols-outlined text-[20px]">download</span>
                            </button>
                        </div>
                    </div>

                    {/* Table Content */}
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="w-12 h-12 bg-[#e5e9eb] dark:bg-slate-700 rounded-full mb-4"></div>
                                <p className="text-[#747779] dark:text-slate-400 text-sm font-medium">Đang truy xuất dữ liệu nhân sự...</p>
                            </div>
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-5xl text-[#abadaf] dark:text-slate-500 mb-3">badge</span>
                            <p className="text-[#747779] dark:text-slate-400 text-sm font-medium">Không tìm thấy nhân viên phù hợp</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#eef1f3]/50 dark:bg-slate-900/50">
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Nhân viên</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Vai trò</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Trạng thái</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Số điện thoại</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider text-right font-['Manrope',sans-serif]">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e9eb] dark:divide-slate-700">
                                    {paginatedStaff.map((staff) => {
                                        const staffId = staff._id || staff.id;
                                        const isOnline = onlineUserIds.includes(staffId);
                                        return (
                                            <tr key={staffId} className="hover:bg-[#f5f7f9] dark:hover:bg-slate-900/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <div className="w-11 h-11 rounded-xl bg-[#e5e9eb] dark:bg-slate-700 overflow-hidden shadow-sm">
                                                                {staff.avatar ? (
                                                                    <img src={staff.avatar} className="w-full h-full object-cover" alt="" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[#595c5e] dark:text-slate-400 font-bold bg-gradient-to-br from-[#e5e9eb] to-slate-200">
                                                                        {staff.full_name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#2c2f31] dark:text-slate-100">{staff.full_name}</p>
                                                            <p className="text-xs text-[#747779] dark:text-slate-400">{staff.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-bold ${getRoleColor(staff.role)}`}>
                                                        {getRoleLabel(staff.role)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${isOnline ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'bg-slate-100 text-[#747779] dark:bg-slate-700'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                        {isOnline ? 'Đang Online' : 'Ngoại tuyến'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#4e5c71] dark:text-slate-400 font-bold font-['Inter',sans-serif]">
                                                    {staff.phone || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-1 justify-end">
                                                        <button
                                                            onClick={() => openEditModal(staff)}
                                                            className="p-2 hover:bg-[#eef1f3] dark:hover:bg-slate-700 rounded-lg text-[#747779] hover:text-[#0050d4] transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => { setDeleteTargetId(staff._id || staff.id); setDeleteTargetName(staff.full_name); }}
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
                {filteredStaff.length > 0 && (
                    <div className="px-6 py-4 border-t border-[#e5e9eb] dark:border-slate-700 flex items-center justify-between">
                        <p className="text-xs font-medium text-[#747779] dark:text-slate-400">
                            Hiển thị <span className="text-[#2c2f31] dark:text-slate-100">{paginatedStaff.length}</span> trên <span className="text-[#2c2f31] dark:text-slate-100">{filteredStaff.length}</span> nhân viên
                        </p>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredStaff.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-[#e5e9eb] dark:border-slate-700 rounded-t-2xl px-6 py-5 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-extrabold text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">
                                    {isEditMode ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
                                </h2>
                                <p className="text-xs text-[#747779] dark:text-slate-400 mt-0.5 font-medium">Thông tin tài khoản nhân viên</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-[#747779] hover:text-[#2c2f31] dark:hover:text-slate-200 hover:bg-[#eef1f3] dark:hover:bg-slate-700 rounded-lg transition-all text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-2xl bg-[#eef1f3] dark:bg-slate-700 flex items-center justify-center text-[#abadaf] dark:text-slate-500 overflow-hidden shadow-inner">
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
                                <p className="text-[10px] font-medium text-[#747779] dark:text-slate-400">Ảnh chân dung nhân viên</p>
                            </div>

                            {/* Form fields */}
                            <div className="space-y-4">
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
                                    <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email liên hệ *</label>
                                    <input
                                        className="w-full px-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0050d4] transition-all"
                                        placeholder="nhanvien@example.com"
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
                                            <option value="staff">Quản lý</option>
                                            <option value="receptionist">Lễ tân</option>
                                            <option value="accountant">Kế toán</option>
                                        </select>
                                    </div>
                                </div>

                                {!isEditMode ? (
                                    <div>
                                        <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-1.5 uppercase tracking-wide">Mật khẩu khởi tạo *</label>
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
                                        <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 mb-1.5 uppercase tracking-wide">Thay đổi mật khẩu</label>
                                        <input
                                            className="w-full px-4 py-2.5 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0050d4] transition-all"
                                            placeholder="Để trống nếu không đổi"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <button className="w-full mt-4 py-3 bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 shadow-md shadow-blue-500/20">
                                {isEditMode ? 'Xác nhận cập nhật' : 'Tạo tài khoản nhân viên'}
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
        </div>
    );
};

export default StaffAdmin;