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
    totalSpent: string;
}

const UserStaff: React.FC = () => {
    const dispatch = useAppDispatch();
    const storeUsers = useAppSelector(selectAllUsers) as unknown as UserData[];
    const loading = useAppSelector(selectUserLoading);
    const users = storeUsers.filter(u => u.role === 'customer');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [levelFilter, setLevelFilter] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');

    const [formData, setFormData] = useState<UserForm>({
        full_name: '', email: '', phone: '', password: '', role: 'customer', totalSpent: '0'
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
                data.append('totalSpent', formData.totalSpent);
                if (formData.password) data.append('password', formData.password);
                if (avatarFile) data.append('avatar', avatarFile);
                await dispatch(updateUserThunk(data)).unwrap();
                toast.success("Cập nhật thành công");
            } else {
                data.append('full_name', formData.full_name);
                data.append('email', formData.email);
                data.append('phone', formData.phone);
                data.append('role', 'customer');
                data.append('totalSpent', formData.totalSpent);
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
            full_name: user.full_name, email: user.email, phone: user.phone || '', role: 'customer',
            totalSpent: ((user as any).totalSpent || 0).toString()
        });
        setSelectedUser(user);
        setAvatarFile(null);
        setAvatarPreview(user.avatar || null);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ full_name: '', email: '', phone: '', password: '', role: 'customer', totalSpent: '0' });
        setSelectedUser(null);
        setIsEditMode(false);
        setAvatarFile(null);
        setAvatarPreview(null);
    };

    const getUserLevel = (totalSpent: number): { label: string; color: string; icon: string } => {
        if (!totalSpent || totalSpent < 2000000) return { label: 'Bạc', color: 'text-slate-600 bg-slate-50 border-slate-100', icon: 'military_tech' };
        if (totalSpent < 7000000) return { label: 'Vàng', color: 'text-amber-700 bg-amber-50 border-amber-100', icon: 'workspace_premium' };
        if (totalSpent < 12000000) return { label: 'Kim cương', color: 'text-blue-700 bg-blue-50 border-blue-100', icon: 'diamond' };
        return { label: 'Bạch kim', color: 'text-purple-700 bg-purple-50 border-purple-100', icon: 'grade' };
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'active' && u.isActive !== false) || 
            (statusFilter === 'blocked' && u.isActive === false);
            
        const matchesLevel = levelFilter === 'all' || (() => {
            const spent = (u as any).totalSpent || 0;
            if (levelFilter === 'silver') return spent < 2000000;
            if (levelFilter === 'gold') return spent >= 2000000 && spent < 7000000;
            if (levelFilter === 'diamond') return spent >= 7000000 && spent < 12000000;
            if (levelFilter === 'platinum') return spent >= 12000000;
            return true;
        })();

        return matchesSearch && matchesStatus && matchesLevel;
    });

    return (
        <div className="p-8 bg-[#f5f7f9] min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#2c2f31] tracking-tight font-['Manrope',sans-serif]">Cơ sở dữ liệu khách hàng</h1>
                        <p className="text-[#595c5e] mt-1 font-medium font-['Inter',sans-serif]">Quản lý thông tin định danh, lịch sử chi tiêu và phân hạng thành viên của khách hàng.</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                        <div className="lg:col-span-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Tìm kiếm định danh</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                                <input
                                    type="text"
                                    placeholder="Tên khách hàng, email..."
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Tình trạng tài khoản</label>
                            <select
                                className="w-full px-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer outline-none appearance-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="blocked">Đã bị khóa</option>
                            </select>
                        </div>

                        <div className="lg:col-span-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Phân hạng ưu tiên</label>
                            <select
                                className="w-full px-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer outline-none appearance-none"
                                value={levelFilter}
                                onChange={(e) => setLevelFilter(e.target.value)}
                            >
                                <option value="all">Tất cả xếp hạng</option>
                                <option value="silver">Thành viên Bạc</option>
                                <option value="gold">Thành viên Vàng</option>
                                <option value="diamond">Thành viên Kim cương</option>
                                <option value="platinum">Thành viên Bạch kim</option>
                            </select>
                        </div>

                        <div className="lg:col-span-2 flex gap-3">
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setLevelFilter('all'); }}
                                className="flex-1 h-[48px] flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100"
                                title="Xóa bộ lọc"
                            >
                                <span className="material-symbols-outlined">filter_list_off</span>
                            </button>
                            <button
                                onClick={() => { resetForm(); setIsModalOpen(true); }}
                                className="flex-1 h-[48px] flex items-center justify-center bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                title="Thêm khách hàng"
                            >
                                <span className="material-symbols-outlined">person_add</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Bento */}
                <div className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#f5f7f9]/50 border-b border-[#e5e9eb]">
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Khách hàng</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Liên hệ</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Chi tiêu</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Hạng thành viên</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Trạng thái</th>
                                    <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest text-right font-['Manrope',sans-serif]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e9eb]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="animate-spin inline-block w-10 h-10 border-4 border-[#0050d4] border-t-transparent rounded-full mb-4"></div>
                                            <p className="text-sm font-bold text-[#747779]">Đang truy xuất dữ liệu...</p>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-[#abadaf]">
                                            <span className="material-symbols-outlined text-5xl mb-3">contact_support</span>
                                            <p className="text-sm font-bold">Không tìm thấy dữ liệu khách hàng.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => {
                                        const levelInfo = getUserLevel((user as any).totalSpent || 0);
                                        return (
                                            <tr key={user._id || user.id} className="hover:bg-[#f5f7f9] transition-all duration-300">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 font-bold overflow-hidden">
                                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.full_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-extrabold text-[#2c2f31] font-['Manrope',sans-serif]">{user.full_name}</p>
                                                            <p className="text-[10px] text-[#abadaf] font-black uppercase tracking-widest mt-0.5">UID: {user._id?.slice(-8).toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-sm font-bold text-[#4e5c71]">{user.email}</p>
                                                    <p className="text-xs text-[#747779] font-medium mt-0.5">{user.phone || '—'}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-sm font-black text-[#0050d4] font-['Manrope',sans-serif]">{new Intl.NumberFormat('vi-VN').format((user as any).totalSpent || 0)}₫</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${levelInfo.color}`}>
                                                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{levelInfo.icon}</span>
                                                        {levelInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.isActive !== false ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-rose-700 bg-rose-50 border border-rose-100'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                        {user.isActive !== false ? 'Hoạt động' : 'Đã khóa'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#d9dde0] text-[#747779] hover:text-[#0050d4] hover:border-[#0050d4] hover:bg-blue-50 transition-all shadow-sm active:scale-95"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">edit_note</span>
                                                        </button>
                                                        <button
                                                            onClick={() => { setDeleteTargetId(user._id || user.id); setDeleteTargetName(user.full_name); }}
                                                            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#d9dde0] text-[#747779] hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm active:scale-95"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Premium Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2c2f31]/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-5 duration-300">
                        <div className="px-8 py-6 border-b border-[#e5e9eb] bg-[#f5f7f9]/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-[#2c2f31] font-['Manrope',sans-serif]">{isEditMode ? 'Hiệu chỉnh thông tin' : 'Hồ sơ khách hàng mới'}</h2>
                                <p className="text-[11px] text-[#747779] font-bold uppercase tracking-widest">Dữ liệu tài khoản thành viên</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center text-[#abadaf] hover:text-[#2c2f31] transition-all">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full border-4 border-[#f5f7f9] bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shadow-inner">
                                        {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" alt="" /> : <span className="material-symbols-outlined text-4xl">person</span>}
                                    </div>
                                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#0050d4] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg border-2 border-white">
                                        <span className="material-symbols-outlined text-white text-base">photo_camera</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                                <span className="text-[10px] font-bold text-[#abadaf] uppercase tracking-widest">Ảnh đại diện nhận diện</span>
                            </div>

                            <div className="space-y-4 font-['Inter',sans-serif]">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#747779] uppercase tracking-widest mb-1.5 px-1">Tên khách hàng</label>
                                    <input className="w-full px-4 py-3 bg-[#f5f7f9] border-0 rounded-xl text-sm font-semibold text-[#2c2f31] placeholder-[#abadaf] focus:ring-2 focus:ring-[#0050d4]/20 transition-all font-['Manrope',sans-serif]" required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#747779] uppercase tracking-widest mb-1.5 px-1">Email liên lạc</label>
                                    <input className="w-full px-4 py-3 bg-[#f5f7f9] border-0 rounded-xl text-sm font-semibold text-[#2c2f31] placeholder-[#abadaf] focus:ring-2 focus:ring-[#0050d4]/20 transition-all" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#747779] uppercase tracking-widest mb-1.5 px-1">Số điện thoại</label>
                                        <input className="w-full px-4 py-3 bg-[#f5f7f9] border-0 rounded-xl text-sm font-semibold text-[#2c2f31] placeholder-[#abadaf] focus:ring-2 focus:ring-[#0050d4]/20 transition-all" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#747779] uppercase tracking-widest mb-1.5 px-1">Chi tiêu (VNĐ)</label>
                                        <input className="w-full px-4 py-3 bg-[#f5f7f9] border-0 rounded-xl text-sm font-semibold text-[#2c2f31] placeholder-[#abadaf] focus:ring-2 focus:ring-[#0050d4]/20 transition-all font-['Manrope',sans-serif]" type="number" value={formData.totalSpent} onChange={(e) => setFormData({ ...formData, totalSpent: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#747779] uppercase tracking-widest mb-1.5 px-1">{isEditMode ? 'Cập nhật mật khẩu' : 'Mật khẩu tài khoản'}</label>
                                    <input 
                                        className="w-full px-4 py-3 bg-[#f5f7f9] border-0 rounded-xl text-sm font-semibold text-[#2c2f31] placeholder-[#abadaf] focus:ring-2 focus:ring-[#0050d4]/20 transition-all" 
                                        placeholder={isEditMode ? "Để trống nếu giữ nguyên" : "Tối thiểu 6 ký tự"} 
                                        type="password" 
                                        value={formData.password} 
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                                    />
                                    {!isEditMode && <p className="text-[10px] text-[#abadaf] font-bold mt-1.5 px-1 italic">* Mặc định hệ thống là: 123456</p>}
                                </div>
                            </div>

                            <button className="w-full py-3.5 bg-[#0050d4] text-white font-bold rounded-xl shadow-lg shadow-[#0050d4]/20 hover:bg-[#0046bb] active:scale-[0.98] transition-all mt-4 font-['Manrope',sans-serif]">
                                {isEditMode ? 'Lưu thay đổi hồ sơ' : 'Xác nhận tạo tài khoản'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal isOpen={!!deleteTargetId} title="Xóa dữ liệu khách hàng" message={`Hệ thống sẽ xóa vĩnh viễn khách hàng "${deleteTargetName}". Bạn có chắc chắn muốn thực hiện?`} onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)} onCancel={() => { setDeleteTargetId(null); setDeleteTargetName(''); }} />
        </div>
    );
};

export default UserStaff;