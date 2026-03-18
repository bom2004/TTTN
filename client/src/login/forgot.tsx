import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { ApiResponse } from '../types';

const Forgot: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP, 3: New Password
    const [loading, setLoading] = useState<boolean>(false);

    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOtp = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/user/send-otp`, { email: formData.email });
            if (response.data.success) {
                toast.success(response.data.message);
                setStep(2);
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi gửi mã");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/user/verify-otp-only`, {
                email: formData.email,
                otp: formData.otp
            });
            if (response.data.success) {
                toast.success("Mã xác thực chính xác");
                setStep(3);
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Mã không đúng");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Mật khẩu không khớp");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/user/reset-password`, {
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.newPassword
            });
            if (response.data.success) {
                toast.success("Thay đổi mật khẩu thành công");
                navigate('/login');
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi đặt lại mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-yellow-500 p-8 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl">lock_reset</span>
                    </div>
                    <h2 className="text-2xl font-bold">Quên mật khẩu?</h2>
                    <p className="opacity-90">Chúng tôi sẽ giúp bạn khôi phục lại tài khoản</p>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nhập email của bạn</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-500 outline-none transition"
                                    placeholder="your-email@gmail.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                <p className="text-xs text-gray-400 mt-2">Mã xác thực sẽ được gửi đến email này.</p>
                            </div>
                            <button
                                disabled={loading}
                                className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition disabled:opacity-50"
                            >
                                {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nhập mã OTP</label>
                                <input
                                    type="text"
                                    name="otp"
                                    maxLength={6}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-3xl font-black tracking-widest focus:ring-2 focus:ring-yellow-200 focus:border-yellow-500 outline-none transition"
                                    placeholder="000000"
                                    value={formData.otp}
                                    onChange={handleChange}
                                />
                                <p className="text-xs text-gray-400 mt-2 text-center">Chúng tôi đã gửi mã gồm 6 chữ số đến email {formData.email}</p>
                            </div>
                            <button
                                disabled={loading}
                                className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition disabled:opacity-50"
                            >
                                {loading ? 'Đang kiểm tra...' : 'Tiếp tục'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-sm text-gray-500 hover:underline"
                            >
                                Quay lại nhập email
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-right">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-500 outline-none transition"
                                        placeholder="••••••••"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-500 outline-none transition"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <button
                                disabled={loading}
                                className="w-full py-4 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 shadow-lg shadow-yellow-200 transition disabled:opacity-50"
                            >
                                {loading ? 'Đang cập nhật...' : 'Hoàn tất đặt lại mật khẩu'}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center justify-center gap-1 group">
                            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            Về trang đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Forgot;
