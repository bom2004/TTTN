import React, { useEffect, useState } from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, UserData } from '../types';

const ViewProfile: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData | null>(null);
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

    const calculateGeniusLevel = (total: number): number => {
        if (!total || total < 100000) return 0;
        if (total < 500000) return 1;
        const level = Math.floor(total / 500000) + 1;
        return Math.min(level, 10);
    };

    useEffect(() => {

        const storedUser = localStorage.getItem('userData');
        if (storedUser) {
            const parsedUser: UserData = JSON.parse(storedUser);
            setUserData(parsedUser);
            setPhone(parsedUser.phone || '');
            setFullName(parsedUser.full_name || '');
            setEmail(parsedUser.email || '');
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleSendOtp = async (): Promise<void> => {
        if (!email) {
            toast.error("Vui lòng nhập email mới");
            return;
        }
        try {
            const response = await axios.post(`${backendUrl}/api/user/send-otp`, { email, checkExist: true });
            if (response.data.success) {
                toast.success(response.data.message);
                setShowOtpInput(true);
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
             toast.error(error.response?.data?.message || "Lỗi gửi OTP");
        }
    };

    const handleUpdate = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        
        if (newPassword && newPassword !== confirmNewPassword) {
            toast.error("Mật khẩu mới không khớp!");
            return;
        }

        if (!userData?.id) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('userId', userData.id);
            formData.append('phone', phone);
            formData.append('full_name', fullName);
            formData.append('email', email);
            if (email !== userData.email) {
                formData.append('otp', otp);
            }
            
            if (oldPassword && newPassword) {
                formData.append('oldPassword', oldPassword);
                formData.append('newPassword', newPassword);
            }
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const response = await axios.post<ApiResponse<UserData>>(`${backendUrl}/api/user/update-profile`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data.success && response.data.userData) {
                toast.success(response.data.message);
                const updatedUser: UserData = { ...userData, ...response.data.userData };
                localStorage.setItem('userData', JSON.stringify(updatedUser));
                setUserData(updatedUser);
                setIsEditing(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setAvatarFile(null);
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật hồ sơ");
        } finally {
            setLoading(false);
        }
    };

    if (!userData) return null;

    return (
        <div className="bg-[#f5f5f5] font-sans antialiased min-h-screen py-16 px-4">
            <main className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
                {/* Left Side: Basic Info & Avatar */}
                <aside className="w-full md:w-80 shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-[#003580] h-32 relative">
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                <div className="relative group">
                                    {(preview || userData.avatar) ? (
                                        <img 
                                            src={preview || userData.avatar} 
                                            alt="profile" 
                                            className="h-24 w-24 rounded-full border-4 border-white shadow-md mx-auto object-cover"
                                        />
                                    ) : (
                                        <div className="h-24 w-24 rounded-full border-4 border-white shadow-md mx-auto flex items-center justify-center bg-bookingLightBlue text-white text-3xl font-black">
                                            {userData.full_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {isEditing && (
                                        <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
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
                            <h1 className="text-xl font-black text-gray-900 mb-1">{userData.full_name}</h1>
                            <p className="text-xs text-bookingBlue font-black uppercase tracking-widest">
                                {userData.role === 'hotelOwner' ? 'Chủ khách sạn' : 
                                 `Thành viên Genius Cấp ${calculateGeniusLevel(userData.totalRecharged || 0)}`}
                            </p>

                            
                            <div className="mt-6 flex flex-col gap-2">
                                <div className="p-3 bg-gray-50 rounded-lg text-left">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ví tiền</p>
                                    <p className="text-lg font-black text-[#003580]">{new Intl.NumberFormat('vi-VN').format(userData.balance || 0)} ₫</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/topup')}
                                    className="w-full py-2.5 bg-bookingYellow text-bookingText font-bold text-sm rounded-lg hover:bg-yellow-500 transition shadow-sm flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add_card</span>
                                    Nạp tiền ngay
                                </button>
                                <button 
                                    onClick={() => navigate('/my-bookings')}
                                    className="w-full py-2.5 bg-white text-[#006ce4] border border-[#006ce4] font-bold text-sm rounded-lg hover:bg-blue-50 transition shadow-sm flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">luggage</span>
                                    Đặt chỗ của tôi
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Side: Details & Form */}
                <div className="flex-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-10">
                        <header className="mb-10 flex justify-between items-end border-b border-gray-100 pb-6">
                            <div>
                                <h2 className="text-2xl font-black text-[#003580] tracking-tight">Cài đặt hồ sơ</h2>
                                <p className="text-sm text-gray-400 font-medium">Quản lý thông tin cá nhân và tài khoản của bạn.</p>
                            </div>
                            {!isEditing && (
                                <button 
                                    className="bg-[#003580] text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-[#002a6b] transition active:scale-95 flex items-center gap-2"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                    Sửa thông tin
                                </button>
                            )}
                        </header>

                        {!isEditing ? (
                            /* VIEW MODE */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và tên</label>
                                    <div className="p-4 bg-gray-50 rounded-xl text-gray-700 font-bold border border-transparent">
                                        {userData.full_name}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Địa chỉ Email</label>
                                    <div className="p-4 bg-gray-50 rounded-xl text-gray-700 font-bold border border-transparent truncate" title={userData.email}>
                                        {userData.email}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                                    <div className="p-4 bg-gray-50 rounded-xl text-gray-700 font-bold border border-transparent">
                                        {userData.phone || 'Chưa cập nhật'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Loại tài khoản</label>
                                    <div className="p-4 bg-gray-50 rounded-xl text-gray-700 font-bold border border-transparent">
                                        {userData.role === 'hotelOwner' ? 'Cộng tác viên / Chủ khách sạn' : 'Người dùng cá nhân'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* EDIT MODE */
                            <form onSubmit={handleUpdate} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và tên</label>
                                        <input 
                                            type="text"
                                            className="w-full px-5 py-4 bg-gray-50 rounded-xl text-gray-700 font-bold border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all outline-none"
                                            value={fullName}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                                            placeholder="Gõ họ và tên..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Địa chỉ Email</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="email"
                                                className="w-full px-5 py-4 bg-gray-50 rounded-xl text-gray-700 font-bold border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all outline-none"
                                                value={email}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    setEmail(e.target.value);
                                                    setShowOtpInput(false);
                                                }}
                                                placeholder="Gõ email..."
                                            />
                                            {email !== userData.email && (
                                                <button 
                                                    type="button"
                                                    onClick={handleSendOtp}
                                                    className="px-4 py-4 bg-blue-100 text-[#006ce4] text-xs font-bold rounded-xl whitespace-nowrap hover:bg-blue-200 transition-colors"
                                                >
                                                    Nhận OTP
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {showOtpInput && email !== userData.email && (
                                        <div className="space-y-2 md:col-start-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mã OTP xác thực Email</label>
                                            <input 
                                                type="text"
                                                className="w-full px-5 py-4 bg-gray-50 rounded-xl text-gray-700 font-bold border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all outline-none"
                                                value={otp}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                                                placeholder="Nhập 6 số OTP..."
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại mới</label>
                                        <input 
                                            type="tel"
                                            className="w-full px-5 py-4 bg-gray-50 rounded-xl text-gray-700 font-bold border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all outline-none"
                                            value={phone}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                                            placeholder="Gõ số điện thoại..."
                                        />
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-gray-400">lock</span>
                                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider">Đổi mật khẩu bảo mật</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu cũ</label>
                                            <input 
                                                type="password"
                                                className="w-full px-5 py-4 bg-gray-50 rounded-xl text-gray-700 font-bold border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all outline-none"
                                                value={oldPassword}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                                            <input 
                                                type="password"
                                                className="w-full px-5 py-4 bg-gray-50 rounded-xl text-gray-700 font-bold border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all outline-none"
                                                value={newPassword}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Xác nhận lại</label>
                                            <input 
                                                type="password"
                                                className="w-full px-5 py-4 bg-gray-50 rounded-xl text-gray-700 font-bold border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all outline-none"
                                                value={confirmNewPassword}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-8 py-3.5 bg-gray-100 text-gray-500 font-bold text-sm rounded-lg hover:bg-gray-200 transition"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3.5 bg-[#006ce4] text-white font-bold text-sm rounded-lg hover:bg-[#0052ad] transition shadow-lg shadow-blue-100 disabled:opacity-50"
                                    >
                                        {loading ? 'Đang xử lý...' : 'Lưu tất cả thay đổi'}
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
