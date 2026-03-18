import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, UserData } from '../../types';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

interface UserForm {
    full_name: string;
    email: string;
    phone: string;
    password?: string;
    role: 'customer' | 'staff' | 'admin' | 'hotelOwner';
    balance: string;
    totalRecharged: string;
}



const UserAdmin: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 5;
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
        balance: '0',
        totalRecharged: '0'
    });



    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const fetchUsers = async (): Promise<void> => {
        setLoading(true);
        try {
            const response = await axios.get<ApiResponse<UserData[]>>(`${backendUrl}/api/user/all-users`);
            if (response.data.success && response.data.users) {
                setUsers(response.data.users);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleInvite = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        try {
            let response;
            if (isEditMode && selectedUser) {
                const data = new FormData();
                data.append('userId', selectedUser._id || selectedUser.id);
                data.append('full_name', formData.full_name);
                data.append('email', formData.email);
                data.append('phone', formData.phone);
                data.append('role', formData.role);
                data.append('balance', formData.balance);
                data.append('totalRecharged', formData.totalRecharged);

                if (avatarFile) data.append('avatar', avatarFile);

                response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/user/admin-update-user`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                // Update password if provided
                if (newPassword.trim()) {
                    await axios.post<ApiResponse<any>>(`${backendUrl}/api/user/admin-update-password`, {
                        userId: selectedUser._id || selectedUser.id,
                        newPassword: newPassword
                    });
                }
            } else {
                const data = new FormData();
                data.append('full_name', formData.full_name);
                data.append('email', formData.email);
                data.append('phone', formData.phone);
                data.append('role', formData.role);
                data.append('balance', formData.balance);
                data.append('totalRecharged', formData.totalRecharged);

                // Ensure password is sent

                data.append('password', formData.password || '');
                if (avatarFile) data.append('avatar', avatarFile);
                response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/user/admin-create-user`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }


            if (response.data.success) {
                toast.success(response.data.message);
                setIsModalOpen(false);
                setAvatarFile(null);
                setAvatarPreview(null);
                setNewPassword('');
                fetchUsers();
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Đã xảy ra lỗi");
        }
    };

    const handleDelete = async (userId: string): Promise<void> => {
        try {
            const response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/user/delete-user`, { userId });
            if (response.data.success) {
                toast.success(response.data.message);
                fetchUsers();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa");
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
            balance: (user.balance || 0).toString(),
            totalRecharged: (user.totalRecharged || 0).toString()
        });


        setSelectedUser(user);
        setAvatarFile(null);
        setAvatarPreview(user.avatar || null);
        setNewPassword('');
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const filteredUsers = users.filter(u => 
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (currentPage > 1 && currentPage > totalPages) {
            setCurrentPage(totalPages || 1);
        }
    }, [totalPages, currentPage]);

    return (
        <div className="p-8 bg-[#f5f5f5] min-h-screen font-sans">
            <div className="max-w-[1600px] mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-[900] text-[#003580] tracking-tight">Quản lý người dùng</h1>
                        <p className="text-sm font-medium text-gray-500">Xem và quản lý tất cả tài khoản trong hệ thống của bạn.</p>
                    </div>
                    <button 
                        onClick={() => { setIsEditMode(false); setFormData({full_name:'', email:'', phone:'', password:'', role:'customer', balance: '0', totalRecharged: '0'}); setAvatarFile(null); setAvatarPreview(null); setIsModalOpen(true); }}
                        className="bg-[#003580] text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-[#002a6b] transition-all shadow-md active:scale-95 flex items-center gap-2"


                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Thêm người dùng mới
                    </button>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center gap-4">
                        <div className="flex-1 relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                            <input 
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc email..."
                                className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-gray-100 placeholder-gray-400 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#003580]/5 border-b border-gray-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Người dùng</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vai trò</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Số dư</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng nạp</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cấp độ</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Thao tác</th>

                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-10 text-center text-gray-400 font-medium">Đang tải dữ liệu...</td>
                                    </tr>
                                ) : paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((user) => (
                                        <tr key={user._id || user.id} className="hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 overflow-hidden group-hover:scale-105 transition-transform border border-gray-100 shadow-sm">
                                                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">{user.full_name}</p>
                                                        <p className="text-xs font-bold text-gray-400 lowercase tracking-tighter">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                                    user.role === 'admin' ? 'bg-purple-50 text-purple-500' :
                                                    user.role === 'hotelOwner' ? 'bg-indigo-50 text-indigo-500' :
                                                    'bg-emerald-50 text-emerald-500'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-black text-gray-900">{new Intl.NumberFormat('vi-VN').format(user.balance || 0)}đ</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-black text-emerald-600">{new Intl.NumberFormat('vi-VN').format(user.totalRecharged || 0)}đ</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                {(() => {
                                                    const total = user.totalRecharged || 0;
                                                    let level = 0;
                                                    if (total >= 100000) {
                                                        if (total < 500000) level = 1;
                                                        else level = Math.min(Math.floor(total / 500000) + 1, 10);
                                                    }
                                                    return (
                                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${level > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                                                            {level > 0 ? `Genius Lvl ${level}` : 'Member'}
                                                        </span>
                                                    );
                                                })()}
                                            </td>

                                            <td className="px-8 py-5 text-right">
                                                <div className="flex gap-2 justify-end transition-opacity">
                                                    <button 
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 bg-[#003580] text-white rounded-lg hover:bg-[#002a6b] transition-all active:scale-90"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => { setDeleteTargetId(user._id || user.id); setDeleteTargetName(user.full_name); }}
                                                        className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all active:scale-90"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-10 text-center text-gray-400 font-medium">Không tìm thấy người dùng nào.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredUsers.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#003580]">
                            <div>
                                <h2 className="text-xl font-[900] text-white tracking-tight">{isEditMode ? 'Cập nhật người dùng' : 'Tạo người dùng mới'}</h2>
                                <p className="text-xs font-bold text-white/60 mt-1 uppercase tracking-widest">Thông tin tài khoản hệ thống</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-all">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleInvite} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            <span className="material-symbols-outlined text-gray-300 text-4xl">person</span>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#003580] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#002a6b] transition-colors shadow-md border-2 border-white">
                                        <span className="material-symbols-outlined text-white text-[16px]">photo_camera</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-bold text-gray-500">Ảnh đại diện</p>
                                    <p className="text-[10px] text-gray-400">JPG, PNG, GIF · Tối đa 5MB</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và tên</label>
                                <input 
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all outline-none" 
                                    placeholder="Nguyễn Văn A" 
                                    required 
                                    value={formData.full_name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email liên hệ</label>
                                <input 
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all outline-none" 
                                    placeholder="example@gmail.com" 
                                    type="email" 
                                    required 
                                    value={formData.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                                    <input 
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all outline-none" 
                                        placeholder="0123 456 789" 
                                        value={formData.phone}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vai trò</label>
                                    <select 
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-black focus:ring-2 focus:ring-gray-100 transition-all outline-none appearance-none"
                                        value={formData.role}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, role: e.target.value as any})}
                                    >
                                        <option value="customer">Khách hàng</option>
                                        <option value="hotelOwner">Chủ khách sạn</option>
                                        <option value="staff">Nhân viên</option>
                                        <option value="admin">Quản trị viên</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số dư tài khoản (VNĐ)</label>
                                <input 
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all outline-none" 
                                    placeholder="0" 
                                    type="number"
                                    value={formData.balance}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, balance: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tổng tiền đã nạp (Genius - VNĐ)</label>
                                <input 
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all outline-none border-2 border-emerald-100" 
                                    placeholder="0" 
                                    type="number"
                                    value={formData.totalRecharged}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, totalRecharged: e.target.value})}
                                />
                            </div>


                            
                            {!isEditMode ? (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu khởi tạo</label>
                                    <input 
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all outline-none" 
                                        placeholder="••••••••" 
                                        type="password" 
                                        required
                                        value={formData.password}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu mới (để trống nếu không đổi)</label>
                                    <input 
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-gray-100 transition-all outline-none" 
                                        placeholder="Nhập mật khẩu mới..." 
                                        type="password" 
                                        value={newPassword}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                                    />
                                </div>
                            )}

                            <button className="w-full mt-4 py-4 bg-[#003580] text-white rounded-lg font-bold text-sm hover:bg-[#002a6b] transition-all active:scale-[0.98] shadow-lg">
                                {isEditMode ? 'Lưu thay đổi' : 'Tạo tài khoản ngay'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

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
