import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, UserData } from '../../types';
import ConfirmModal from '../../admin/components/ConfirmModal';

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
    const backendUrl = "http://localhost:3000";
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
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

    const fetchUsers = async (): Promise<void> => {
        setLoading(true);
        try {
            const response = await axios.get<ApiResponse<UserData[]>>(`${backendUrl}/api/user/all-users`);
            if (response.data.success && response.data.data) {
                const customersOnly = response.data.data.filter(u => u.role === 'customer');
                setUsers(customersOnly);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Không thể tải danh sách khách hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

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
            let response;
            const data = new FormData();
            
            if (isEditMode && selectedUser) {
                data.append('userId', selectedUser._id || selectedUser.id);
                data.append('full_name', formData.full_name);
                data.append('email', formData.email);
                data.append('phone', formData.phone);
                data.append('role', 'customer');
                data.append('balance', formData.balance);
                data.append('totalRecharged', formData.totalRecharged);
                if (formData.password) data.append('password', formData.password);

                if (avatarFile) data.append('avatar', avatarFile);

                response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/user/admin-update-user`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                data.append('full_name', formData.full_name);
                data.append('email', formData.email);
                data.append('phone', formData.phone);
                data.append('role', 'customer');
                data.append('balance', formData.balance);
                data.append('totalRecharged', formData.totalRecharged);
                data.append('password', formData.password || '123456');

                if (avatarFile) data.append('avatar', avatarFile);

                response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/user/admin-create-user`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (response.data.success) {
                toast.success(isEditMode ? "Cập nhật thành công" : "Thêm khách hàng thành công");
                setIsModalOpen(false);
                resetForm();
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
                toast.success("Đã xóa khách hàng thành công");
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

    const filteredUsers = users.filter(u => 
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 bg-[#f5f5f5] min-h-screen font-sans text-left">
            <div className="max-w-[1600px] mx-auto">
                <header className="flex justify-between items-center mb-10 text-left">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-[900] text-[#003580] tracking-tight">Quản lý khách hàng</h1>
                        <p className="text-sm font-medium text-gray-500">Xem, thêm, sửa và xóa thông tin khách hàng (Chế độ nhân viên). </p>
                    </div>
                    <button 
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-[#003580] text-white px-6 py-3.5 rounded-2xl font-black text-xs hover:bg-[#002a6b] transition-all shadow-xl shadow-blue-500/10 active:scale-95 flex items-center gap-2 uppercase tracking-widest"
                    >
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Thêm khách hàng mới
                    </button>
                </header>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center gap-4">
                        <div className="flex-1 relative text-left">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                            <input 
                                type="text"
                                placeholder="Tìm kiếm khách hàng theo tên hoặc email..."
                                className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-gray-100 placeholder-gray-400 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto text-left">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#003580]/5 border-b border-gray-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Khách hàng</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Số điện thoại</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Số dư</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cấp độ Genius</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-10 text-center text-gray-400 font-medium italic">Đang tải dữ liệu khách hàng...</td>
                                    </tr>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user._id || user.id} className="hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className="w-12 h-12 rounded-2xl bg-[#003580]/5 flex items-center justify-center font-black text-[#003580] overflow-hidden group-hover:scale-105 transition-transform border border-gray-100 shadow-sm">
                                                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.full_name.charAt(0)}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-black text-gray-900">{user.full_name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {user._id?.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-left">
                                                <p className="text-sm font-medium text-gray-600">{user.email}</p>
                                            </td>
                                            <td className="px-8 py-5 text-left">
                                                <p className="text-sm font-medium text-gray-600">{user.phone || 'Chưa cập nhật'}</p>
                                            </td>
                                            <td className="px-8 py-5 text-left">
                                                <p className="text-sm font-black text-[#003580]">{new Intl.NumberFormat('vi-VN').format(user.balance || 0)}đ</p>
                                            </td>
                                            <td className="px-8 py-5 text-left">
                                                {(() => {
                                                    const total = user.totalRecharged || 0;
                                                    let level = 0;
                                                    if (total >= 100000) {
                                                        if (total < 500000) level = 1;
                                                        else level = Math.min(Math.floor(total / 500000) + 1, 10);
                                                    }
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${level > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                                                                {level > 0 ? `Genius Lvl ${level}` : 'Thành viên'}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                                        title="Sửa thông tin"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => { setDeleteTargetId(user._id || user.id); setDeleteTargetName(user.full_name); }}
                                                        className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                                        title="Xóa khách hàng"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-10 text-center text-gray-400 font-medium">Không tìm thấy khách hàng nào phù hợp.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Create/Edit Customer */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#001533]/40 backdrop-blur-md">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
                        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-[#003580] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <div className="relative z-10 text-left">
                                <h2 className="text-2xl font-[900] text-white tracking-tight">{isEditMode ? 'Cập nhật thông tin' : 'Thêm khách hàng mới'}</h2>
                                <p className="text-[10px] font-black text-white/50 mt-1 uppercase tracking-[0.2em]">
                                    {isEditMode ? 'Chỉ cho phép sửa tên, email và số điện thoại' : 'Khởi tạo tài khoản thành viên QuickStay'}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="relative z-10 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar text-left">
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center gap-4 mb-8">
                                <div className="relative group">
                                    <div className="w-28 h-28 rounded-[32px] overflow-hidden bg-gray-50 border-4 border-gray-50 shadow-inner flex items-center justify-center group-hover:border-blue-50 transition-all">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            <span className="material-symbols-outlined text-gray-200 text-5xl font-thin">add_a_photo</span>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#003580] rounded-2xl flex items-center justify-center cursor-pointer hover:bg-[#002a6b] transition-all shadow-xl border-4 border-white active:scale-90">
                                        <span className="material-symbols-outlined text-white text-lg">edit</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Họ và tên khách hàng</label>
                                <input 
                                    className="w-full px-8 py-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-50 focus:bg-white text-sm font-black text-gray-700 transition-all outline-none placeholder:text-gray-300" 
                                    placeholder="Vd: Nguyễn Văn A" 
                                    required 
                                    value={formData.full_name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>
                            
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Địa chỉ Email</label>
                                <input 
                                    className="w-full px-8 py-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-50 focus:bg-white text-sm font-black text-gray-700 transition-all outline-none placeholder:text-gray-300" 
                                    placeholder="customer@gmail.com" 
                                    type="email" 
                                    required 
                                    value={formData.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 text-left">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Số điện thoại</label>
                                    <input 
                                        className="w-full px-8 py-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-50 focus:bg-white text-sm font-black text-gray-700 transition-all outline-none placeholder:text-gray-300" 
                                        placeholder="0123 456 789" 
                                        value={formData.phone}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Mật khẩu mới</label>
                                    <input 
                                        className="w-full px-8 py-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-50 focus:bg-white text-sm font-black text-gray-700 transition-all outline-none placeholder:text-gray-300" 
                                        placeholder={isEditMode ? "Để trống nếu không đổi mật khẩu" : "Khuyên dùng: 123456"} 
                                        type="password"
                                        value={formData.password}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-6">
                                <button className="w-full py-6 bg-[#003580] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:bg-[#002a6b] transition-all active:scale-[0.98] shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3">
                                    <span>{isEditMode ? 'Lưu cập nhật' : 'Tạo tài khoản khách hàng'}</span>
                                    <span className="material-symbols-outlined text-lg">{isEditMode ? 'sync' : 'arrow_forward'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
