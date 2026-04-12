import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import { selectAuthUser } from '../../lib/redux/reducers/auth/selectors';
import { updateUserThunk } from '../../lib/redux/reducers/user';
import { getProfileThunk } from '../../lib/redux/reducers/auth';

const PersonalDetailsStaff: React.FC = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectAuthUser);
    
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        avatar: ''
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || '',
                avatar: user.avatar || ''
            });
            setAvatarPreview(user.avatar || null);
        }
    }, [user]);

    useEffect(() => {
        return () => {
            if (avatarPreview && avatarPreview !== user?.avatar) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview, user?.avatar]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Kích thước ảnh không được vượt quá 5MB");
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error("Vui lòng chọn file ảnh hợp lệ");
                return;
            }

            setAvatarFile(file);
            if (avatarPreview && avatarPreview !== user?.avatar) {
                URL.revokeObjectURL(avatarPreview);
            }
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.full_name.trim()) {
            toast.error("Họ và tên không được để trống");
            return;
        }

        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('userId', user._id || user.id);
            data.append('full_name', formData.full_name.trim());
            data.append('phone', formData.phone);
            if (avatarFile) {
                data.append('avatar', avatarFile);
            }

            await dispatch(updateUserThunk(data)).unwrap();
            await dispatch(getProfileThunk(user._id || user.id)).unwrap();
            
            toast.success("Cập nhật thông tin cá nhân thành công!");
            setIsEditing(false);
            setAvatarFile(null);
        } catch (error: any) {
            toast.error(error?.message || "Cập nhật thất bại");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            full_name: user?.full_name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            avatar: user?.avatar || ''
        });
        if (avatarPreview && avatarPreview !== user?.avatar) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(user?.avatar || null);
        setAvatarFile(null);
    };

    if (!user) return null;

    return (
        <div className="p-6 md:p-8 bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] min-h-screen font-['Inter',sans-serif]">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 md:mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Hồ sơ công việc</h1>
                    <p className="text-sm md:text-base text-slate-500 mt-2 font-medium">Cập nhật thông tin cá nhân dành cho nhân sự khách sạn</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                    <div className="lg:col-span-1 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                            <div className="relative group mb-6">
                                <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-blue-50 to-indigo-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        <span className="text-4xl font-black text-blue-600 uppercase">{user.full_name?.charAt(0) || 'S'}</span>
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center cursor-pointer hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
                                        <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                )}
                            </div>
                            
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">{user.full_name}</h2>
                            <div className="mt-2">
                                <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                    {user.role === 'receptionist' ? 'Lễ tân' : user.role === 'accountant' ? 'Kế toán' : 'Nhân viên'}
                                </span>
                            </div>

                            <div className="w-full mt-8 pt-8 border-t border-slate-50 space-y-4 text-left">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest">Mã nhân sự</span>
                                    <span className="text-slate-800 font-bold">#{user._id?.slice(-6).toUpperCase() || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest">Ngày tham gia</span>
                                    <span className="text-slate-800 font-bold">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}</span>
                                </div>
                            </div>
                        </div>

                        {!isEditing && (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                            >
                                Hiệu chỉnh hồ sơ
                            </button>
                        )}
                    </div>

                    <div className="lg:col-span-2 animate-in fade-in slide-in-from-right-4 duration-700">
                        <form onSubmit={handleSave} className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-slate-100">
                            <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-8">Thông tin định danh</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Họ tên nhân viên</label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email công vụ</label>
                                    <input
                                        type="email"
                                        disabled={true}
                                        className="w-full p-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed"
                                        value={formData.email}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        disabled={!isEditing}
                                        className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Vị trí công tác</label>
                                    <div className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-500 flex items-center justify-between">
                                        <span className="capitalize">{user.role}</span>
                                        <span className="material-symbols-outlined text-blue-500">work_history</span>
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="mt-12 pt-8 border-t border-slate-50 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-8 py-3 bg-slate-50 text-slate-500 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className={`px-10 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 ${isSaving ? 'opacity-70' : ''}`}
                                    >
                                        {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                        Cập nhật hồ sơ
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalDetailsStaff;
