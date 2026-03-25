import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { ApiResponse } from '../types';
import authService from '../api/authService';

const Forgot: React.FC = () => {
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
            const data = await authService.sendOTP(formData.email);
            if (data.success) {
                toast.success(data.message);
                setStep(2);
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
            const data = await authService.verifyOTPOnly(formData.email, formData.otp);
            if (data.success) {
                toast.success("Mã xác thực chính xác");
                setStep(3);
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
            const data = await authService.resetPassword(formData);
            if (data.success) {
                toast.success("Thay đổi mật khẩu thành công");
                navigate('/login');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi đặt lại mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {/* Animated Wave Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-blue-200/30 to-transparent"></div>
                <svg className="absolute bottom-0 left-0 w-full h-48" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="rgba(59, 130, 246, 0.1)" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo Section */}
                <div className="text-center mb-8 animate-fade-in">
                    <Link to="/" className="inline-flex items-center justify-center gap-2 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-xl shadow-lg">
                                <span className="material-symbols-outlined text-white text-2xl">bed</span>
                            </div>
                        </div>
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-cyan-700 bg-clip-text text-transparent tracking-tight">QuickStay</span>
                    </Link>
                </div>

                {/* Main Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-blue-200/50 border border-blue-100 overflow-hidden transform transition-all duration-300 hover:shadow-blue-300/30">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-4 backdrop-blur-sm">
                                <span className="material-symbols-outlined text-4xl">lock_reset</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Quên mật khẩu?</h2>
                            <p className="text-blue-50 text-sm">Chúng tôi sẽ giúp bạn khôi phục lại tài khoản</p>
                        </div>
                        {/* Decorative waves */}
                        <div className="absolute bottom-0 left-0 right-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-12 opacity-20">
                                <path fill="white" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                            </svg>
                        </div>
                    </div>

                    <div className="p-8 sm:p-10">
                        {step === 1 && (
                            <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in duration-500">
                                <div>
                                    <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor="email">
                                        Địa chỉ email
                                    </label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 text-xl transition-colors">
                                            email
                                        </span>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            required
                                            className="w-full pl-12 pr-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-800 placeholder:text-blue-300"
                                            placeholder="your-email@gmail.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <p className="text-xs text-blue-500/60 mt-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">info</span>
                                        Mã xác thực sẽ được gửi đến email này
                                    </p>
                                </div>
                                <button
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                    type="submit"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Đang gửi...</span>
                                        </div>
                                    ) : (
                                        <span>Gửi mã xác thực</span>
                                    )}
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right duration-500">
                                <div>
                                    <label className="block text-sm font-semibold text-blue-900 mb-2 text-center" htmlFor="otp">
                                        Mã xác thực OTP
                                    </label>
                                    <input
                                        type="text"
                                        name="otp"
                                        id="otp"
                                        maxLength={6}
                                        required
                                        className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-center text-2xl font-mono tracking-wider text-blue-900"
                                        placeholder="000000"
                                        value={formData.otp}
                                        onChange={handleChange}
                                    />
                                    <p className="text-xs text-blue-500/60 mt-2 text-center">
                                        Chúng tôi đã gửi mã gồm 6 chữ số đến email{' '}
                                        <span className="font-semibold text-blue-600">{formData.email}</span>
                                    </p>
                                </div>
                                <button
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                    type="submit"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Đang kiểm tra...</span>
                                        </div>
                                    ) : (
                                        <span>Tiếp tục</span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors py-2 flex items-center justify-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-base">arrow_back</span>
                                    Quay lại nhập email
                                </button>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-right duration-500">
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor="newPassword">
                                            Mật khẩu mới
                                        </label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 text-xl transition-colors">
                                                lock
                                            </span>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                id="newPassword"
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-800 placeholder:text-blue-300"
                                                placeholder="••••••••"
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor="confirmPassword">
                                            Xác nhận mật khẩu
                                        </label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 text-xl transition-colors">
                                                verified
                                            </span>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                id="confirmPassword"
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-800 placeholder:text-blue-300"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                    type="submit"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Đang cập nhật...</span>
                                        </div>
                                    ) : (
                                        <span>Hoàn tất đặt lại mật khẩu</span>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Back to Login Link */}
                        <div className="mt-8 text-center pt-4 border-t border-blue-100">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
                            >
                                <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">
                                    arrow_back
                                </span>
                                Về trang đăng nhập
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-blue-500/60 tracking-wide">
                        QuickStay Premium • Hỗ trợ khách hàng 24/7
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Forgot;