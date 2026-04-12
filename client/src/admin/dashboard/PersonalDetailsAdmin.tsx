import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import { selectAuthUser } from '../../lib/redux/reducers/auth/selectors';
import { updateUserThunk } from '../../lib/redux/reducers/user';
import { getProfileThunk } from '../../lib/redux/reducers/auth';

const PersonalDetailsAdmin: React.FC = () => {
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

        if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
            toast.error("Số điện thoại không hợp lệ");
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
        <div className="p-6 md:p-8 bg-gradient-to-br from-[#f5f7f9] to-[#eef2f5] min-h-screen font-['Inter',sans-serif]">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 md:mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h1 className="text-2xl md:text-3xl font-black text-[#2c2f31] tracking-tight font-['Manrope',sans-serif]">
                        Thông tin cá nhân
                    </h1>
                    <p className="text-sm md:text-base text-[#595c5e] mt-1.5 md:mt-2 font-medium">
                        Quản lý hồ sơ định danh và thông tin xác thực của bạn trên hệ thống
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                    {/* Profile Card */}
                    <div className="lg:col-span-1 space-y-5 md:space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="bg-white rounded-2xl md:rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                            <div className="relative group mb-5 md:mb-6">
                                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl md:rounded-[40px] bg-gradient-to-br from-blue-50 to-indigo-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            className="w-full h-full object-cover"
                                            alt="Profile"
                                        />
                                    ) : (
                                        <span className="text-3xl md:text-4xl font-black text-blue-600 uppercase">
                                            {user.full_name?.charAt(0) || 'U'}
                                        </span>
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute -bottom-2 -right-2 w-9 h-9 md:w-10 md:h-10 bg-blue-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center cursor-pointer hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-105">
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/jpeg,image/png,image/jpg,image/webp"
                                            onChange={handleAvatarChange}
                                        />
                                    </label>
                                )}
                            </div>

                            <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
                                {user.full_name || 'Chưa cập nhật'}
                            </h2>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 md:px-3 py-0.5 md:py-1 bg-blue-50 text-blue-700 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                    {user.role === 'admin' ? 'Quản trị viên' : user.role === 'staff' ? 'Nhân viên' : user.role || 'Thành viên'}
                                </span>
                            </div>

                            <div className="w-full mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-100 space-y-3 md:space-y-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest">Trạng thái</span>
                                    <span className="flex items-center gap-1.5 text-emerald-600 font-black">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        Đã xác thực
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest">Ngày tham gia</span>
                                    <span className="text-slate-600 font-bold">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full py-3.5 md:py-4 bg-white border border-slate-200 text-slate-600 font-black text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] rounded-xl md:rounded-2xl hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow"
                            >
                                Hiệu chỉnh hồ sơ
                            </button>
                        )}
                    </div>

                    {/* Information Form */}
                    <div className="lg:col-span-2 animate-in fade-in slide-in-from-right-4 duration-700">
                        <form onSubmit={handleSave} className="bg-white rounded-2xl md:rounded-[32px] p-6 md:p-10 shadow-sm border border-slate-100">
                            <h3 className="text-[10px] md:text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-6 md:mb-8">
                                Thông tin chi tiết tài khoản
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
                                        Họ và tên đầy đủ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        className="w-full p-3.5 md:p-4 bg-slate-50/50 border border-slate-100 rounded-xl md:rounded-2xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
                                        Địa chỉ Email
                                    </label>
                                    <input
                                        type="email"
                                        disabled={true}
                                        className="w-full p-3.5 md:p-4 bg-slate-100/50 border border-slate-200 rounded-xl md:rounded-2xl text-sm font-semibold text-slate-500 outline-none cursor-not-allowed"
                                        value={formData.email}
                                    />
                                    <p className="text-[10px] text-slate-400 px-1">Email không thể thay đổi</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
                                        Số điện thoại liên lạc
                                    </label>
                                    <input
                                        type="tel"
                                        disabled={!isEditing}
                                        placeholder="Chưa cập nhật"
                                        className="w-full p-3.5 md:p-4 bg-slate-50/50 border border-slate-100 rounded-xl md:rounded-2xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
                                        Phân quyền tài khoản
                                    </label>
                                    <div className="w-full p-3.5 md:p-4 bg-slate-50/50 border border-slate-100 rounded-xl md:rounded-2xl text-sm font-semibold text-slate-600 flex items-center justify-between">
                                        <span className="capitalize">
                                            {user.role === 'admin' ? 'Quản trị viên' : user.role === 'staff' ? 'Nhân viên' : user.role || 'Thành viên'}
                                        </span>
                                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-6 md:px-8 py-2.5 md:py-3 bg-slate-50 text-slate-600 font-black text-[10px] md:text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-all duration-200 order-2 sm:order-1"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className={`px-8 md:px-10 py-2.5 md:py-3 bg-blue-600 text-white font-black text-[10px] md:text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 order-1 sm:order-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'
                                            }`}
                                    >
                                        {isSaving && (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                        {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            )}

                            {!isEditing && (
                                <div className="mt-8 md:mt-12 p-5 md:p-6 bg-amber-50/80 rounded-xl md:rounded-2xl border border-amber-100 flex items-start gap-3 md:gap-4">
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-[10px] md:text-[11px] font-black text-amber-800 uppercase tracking-wider mb-1">
                                            Mẹo bảo mật
                                        </p>
                                        <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                            Để đảm bảo an toàn, địa chỉ email là thông tin không thể thay đổi.
                                            Hãy liên hệ với Quản trị viên cấp cao nếu cần yêu cầu thay đổi email đăng nhập.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalDetailsAdmin;