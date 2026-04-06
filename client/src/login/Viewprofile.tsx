import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../lib/redux/store';
import { selectAuthUser, selectAuthLoading, sendOTPThunk, updateProfileThunk } from '../lib/redux/reducers/auth';

const ViewProfile: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const userData = useAppSelector(selectAuthUser);
    const authLoading = useAppSelector(selectAuthLoading);

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    // Form states
    const [phone, setPhone] = useState<string>('');
    const [fullName, setFullName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [otp, setOtp] = useState<string>('');
    const [showOtpInput, setShowOtpInput] = useState<boolean>(false);
    const [oldPassword, setOldPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const getMembershipInfo = (total: number) => {
        if (!total || total < 10000000) return 'Silver';
        if (total < 50000000) return 'Gold';
        if (total < 150000000) return 'Diamond';
        return 'Platinum';
    };

    useEffect(() => {
        if (userData) {
            setPhone(userData.phone || '');
            setFullName(userData.full_name || '');
            setEmail(userData.email || '');
        } else {
            navigate('/login');
        }
    }, [userData, navigate]);

    const handleSendOtp = async (): Promise<void> => {
        if (!email) {
            toast.error("Vui lòng nhập email mới");
            return;
        }
        try {
            await dispatch(sendOTPThunk({ email, checkExist: true })).unwrap();
            toast.success("Mã OTP đã được gửi đến email của bạn");
            setShowOtpInput(true);
        } catch (error: any) {
            toast.error(error || "Lỗi gửi OTP");
        }
    };

    const handleUpdate = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (newPassword && newPassword !== confirmNewPassword) {
            toast.error("Mật khẩu mới không khớp!");
            return;
        }

        const uid = userData?.id || (userData as any)?._id;
        if (!uid) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('userId', uid);
            formData.append('phone', phone);
            formData.append('full_name', fullName);
            formData.append('email', email);
            if (email !== userData?.email) {
                formData.append('otp', otp);
            }

            if (oldPassword && newPassword) {
                formData.append('oldPassword', oldPassword);
                formData.append('newPassword', newPassword);
            }
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            await dispatch(updateProfileThunk(formData)).unwrap();

            toast.success("Cập nhật hồ sơ thành công");
            setIsEditing(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setAvatarFile(null);
            setShowOtpInput(false);
            setOtp('');
        } catch (error: any) {
            toast.error(error || "Lỗi cập nhật hồ sơ");
        } finally {
            setLoading(false);
        }
    };

    if (!userData) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 py-12 px-4">
            {/* Animated Wave Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-blue-200/30 to-transparent"></div>
                <svg className="absolute bottom-0 left-0 w-full h-48" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="rgba(59, 130, 246, 0.1)" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>

            <main className="w-full max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row gap-8">
                {/* Left Side: Basic Info & Avatar */}
                <aside className="w-full lg:w-80 shrink-0">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-200/50 border border-blue-100 overflow-hidden sticky top-8">
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 h-32 relative">
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                <div className="relative group">
                                    {(preview || userData.avatar) ? (
                                        <img
                                            src={preview || userData.avatar}
                                            alt="profile"
                                            className="h-24 w-24 rounded-full border-4 border-white shadow-lg mx-auto object-cover"
                                        />
                                    ) : (
                                        <div className="h-24 w-24 rounded-full border-4 border-white shadow-lg mx-auto flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-3xl font-bold">
                                            {userData.full_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {isEditing && (
                                        <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                                            <input
                                                type="file"
                                                id="avatar-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setAvatarFile(file);
                                                        setPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="pt-16 pb-8 px-6 text-center">
                            <h1 className="text-xl font-bold text-slate-800 mb-1">{userData.full_name}</h1>
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                                {userData.role === 'hotelOwner' ? 'Chủ khách sạn' :
                                    `Thành viên VIP Hạng ${getMembershipInfo(userData.totalRecharged || 0)}`}
                            </p>

                            <div className="mt-6 flex flex-col gap-3">
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 text-left">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Ví tiền</p>
                                    <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-800 to-cyan-700 bg-clip-text">
                                        {new Intl.NumberFormat('vi-VN').format(userData.balance || 0)} ₫
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/topup')}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">add_card</span>
                                    Nạp tiền ngay
                                </button>
                                <button
                                    onClick={() => navigate('/my-bookings')}
                                    className="w-full py-3 bg-white text-blue-600 border-2 border-blue-200 font-bold text-sm rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">luggage</span>
                                    Đặt chỗ của tôi
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Side: Details & Form */}
                <div className="flex-1">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-200/50 border border-blue-100 p-8 md:p-10">
                        <header className="mb-8 flex justify-between items-center border-b border-blue-100 pb-6">
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-cyan-700 bg-clip-text text-transparent tracking-tight">
                                    Cài đặt hồ sơ
                                </h2>
                                <p className="text-sm text-blue-500/70 font-medium mt-1">Quản lý thông tin cá nhân và tài khoản của bạn</p>
                            </div>
                            {!isEditing && (
                                <button
                                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md flex items-center gap-2"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <span className="material-symbols-outlined text-lg">edit_note</span>
                                    Sửa thông tin
                                </button>
                            )}
                        </header>

                        {!isEditing ? (
                            /* VIEW MODE */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider ml-1">Họ và tên</label>
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl text-slate-700 font-semibold border border-blue-100">
                                        {userData.full_name}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider ml-1">Địa chỉ Email</label>
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl text-slate-700 font-semibold border border-blue-100 truncate" title={userData.email}>
                                        {userData.email}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider ml-1">Số điện thoại</label>
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl text-slate-700 font-semibold border border-blue-100">
                                        {userData.phone || 'Chưa cập nhật'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider ml-1">Loại tài khoản</label>
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl text-slate-700 font-semibold border border-blue-100">
                                        {userData.role === 'hotelOwner' ? 'Cộng tác viên / Chủ khách sạn' : 'Người dùng cá nhân'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* EDIT MODE */
                            <form onSubmit={handleUpdate} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider ml-1">Họ và tên</label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 text-xl transition-colors">
                                                person
                                            </span>
                                            <input
                                                type="text"
                                                className="w-full pl-12 pr-4 py-3.5 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-700 font-medium placeholder:text-blue-300"
                                                value={fullName}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                                                placeholder="Họ và tên của bạn"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider ml-1">Địa chỉ Email</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative group">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 text-xl transition-colors">
                                                    email
                                                </span>
                                                <input
                                                    type="email"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-700 font-medium placeholder:text-blue-300"
                                                    value={email}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                        setEmail(e.target.value);
                                                        setShowOtpInput(false);
                                                        setOtp('');
                                                    }}
                                                    placeholder="your@email.com"
                                                />
                                            </div>
                                            {email !== userData.email && (
                                                <button
                                                    type="button"
                                                    onClick={handleSendOtp}
                                                    className="px-5 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-xl whitespace-nowrap hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md"
                                                >
                                                    Gửi OTP
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {showOtpInput && email !== userData.email && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider ml-1">Mã OTP xác thực Email</label>
                                            <div className="relative group">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-xl">
                                                    pin
                                                </span>
                                                <input
                                                    type="text"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-700 font-medium text-center tracking-wider"
                                                    value={otp}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                                                    placeholder="000000"
                                                    maxLength={6}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider ml-1">Số điện thoại</label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 text-xl transition-colors">
                                                phone
                                            </span>
                                            <input
                                                type="tel"
                                                className="w-full pl-12 pr-4 py-3.5 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-700 font-medium placeholder:text-blue-300"
                                                value={phone}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                                                placeholder="0123 456 789"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-blue-100">
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-blue-500">lock</span>
                                        <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Đổi mật khẩu bảo mật</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider ml-1">Mật khẩu cũ</label>
                                            <div className="relative group">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-xl">
                                                    lock_open
                                                </span>
                                                <input
                                                    type="password"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-700 font-medium"
                                                    value={oldPassword}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider ml-1">Mật khẩu mới</label>
                                            <div className="relative group">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-xl">
                                                    lock
                                                </span>
                                                <input
                                                    type="password"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-700 font-medium"
                                                    value={newPassword}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider ml-1">Xác nhận lại</label>
                                            <div className="relative group">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-xl">
                                                    verified
                                                </span>
                                                <input
                                                    type="password"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-700 font-medium"
                                                    value={confirmNewPassword}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmNewPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setShowOtpInput(false);
                                            setOtp('');
                                            setOldPassword('');
                                            setNewPassword('');
                                            setConfirmNewPassword('');
                                            setAvatarFile(null);
                                            setPreview(null);
                                        }}
                                        className="px-8 py-3.5 bg-gray-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Đang xử lý...</span>
                                            </div>
                                        ) : (
                                            'Lưu tất cả thay đổi'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ViewProfile;
