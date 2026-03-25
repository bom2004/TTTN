import React, { useState } from 'react';
import { assets } from '../assets/assets';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, UserData } from '../types';
import authService from '../api/authService';

const Register: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const navigate = useNavigate();
    const [isOtpMode, setIsOtpMode] = useState<boolean>(false);
    const [otpSent, setOtpSent] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [acceptTerms, setAcceptTerms] = useState<boolean>(false);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
        otp: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (formData.password !== formData.confirm_password) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }

        if (!acceptTerms) {
            toast.error("Vui lòng đồng ý với Điều khoản & Điều kiện để đăng ký!");
            return;
        }

        setLoading(true);
        try {
            const data = await authService.register(formData);

            if (data.success) {
                toast.success(data.message);
                localStorage.setItem('token', data.token || '');
                localStorage.setItem('userData', JSON.stringify(data.userData || {}));
                window.location.href = '/';
            } else {
                toast.error(data.message);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi đăng ký");
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (): Promise<void> => {
        if (!formData.email) {
            toast.warning("Vui lòng nhập email trước");
            return;
        }
        setLoading(true);
        try {
            const data = await authService.sendOTP(formData.email, true);
            if (data.success) {
                toast.success(data.message);
                setOtpSent(true);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Lỗi khi gửi OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await authService.verifyOTP(formData.email, formData.otp);

            if (data.success) {
                toast.success("Đăng ký & Đăng nhập thành công");
                localStorage.setItem('token', data.token || '');
                localStorage.setItem('userData', JSON.stringify(data.userData || {}));
                window.location.href = '/';
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Mã OTP không đúng");
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

            <div className="w-full max-w-xl relative z-10">
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
                    <div className="p-8 sm:p-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-800 to-cyan-700 bg-clip-text mb-2 tracking-tight">
                                {isOtpMode ? "Đăng ký nhanh" : "Tạo tài khoản mới"}
                            </h2>
                            <p className="text-blue-600/70 text-sm">
                                {isOtpMode
                                    ? "Sử dụng email Google để tạo tài khoản trong vài giây"
                                    : "Khám phá hàng ngàn khách sạn ưu đãi với tài khoản QuickStay của bạn"}
                            </p>
                        </div>

                        {!isOtpMode ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Full Name Field */}
                                <div>
                                    <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor="full_name">
                                        Họ và tên
                                    </label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 text-xl transition-colors">
                                            person
                                        </span>
                                        <input
                                            className="w-full pl-12 pr-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-800 placeholder:text-blue-300"
                                            id="full_name"
                                            name="full_name"
                                            placeholder="Nguyễn Văn A"
                                            required
                                            type="text"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Email and Phone Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor="email">
                                            Email
                                        </label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 text-xl transition-colors">
                                                email
                                            </span>
                                            <input
                                                className="w-full pl-12 pr-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-800 placeholder:text-blue-300"
                                                id="email"
                                                name="email"
                                                placeholder="example@gmail.com"
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor="phone">
                                            Số điện thoại
                                        </label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 text-xl transition-colors">
                                                phone
                                            </span>
                                            <input
                                                className="w-full pl-12 pr-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-800 placeholder:text-blue-300"
                                                id="phone"
                                                name="phone"
                                                placeholder="0123 456 789"
                                                required
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Password and Confirm Password Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor="password">
                                            Mật khẩu
                                        </label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 text-xl transition-colors">
                                                lock
                                            </span>
                                            <input
                                                className="w-full pl-12 pr-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-800 placeholder:text-blue-300"
                                                id="password"
                                                name="password"
                                                placeholder="••••••••"
                                                required
                                                type="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor="confirm_password">
                                            Xác nhận mật khẩu
                                        </label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 text-xl transition-colors">
                                                verified
                                            </span>
                                            <input
                                                className="w-full pl-12 pr-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-800 placeholder:text-blue-300"
                                                id="confirm_password"
                                                name="confirm_password"
                                                placeholder="••••••••"
                                                required
                                                type="password"
                                                value={formData.confirm_password}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Terms and Conditions */}
                                <div className="flex items-start gap-3 pt-2">
                                    <input
                                        type="checkbox"
                                        id="acceptTerms"
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="acceptTerms" className="text-xs text-blue-600/70 font-medium leading-relaxed cursor-pointer">
                                        Bằng việc tạo tài khoản, bạn đồng ý với{' '}
                                        <span className="text-blue-600 hover:text-blue-700 font-semibold">Điều khoản & Điều kiện</span>{' '}
                                        và{' '}
                                        <span className="text-blue-600 hover:text-blue-700 font-semibold">Chính sách Bảo mật</span>{' '}
                                        của chúng tôi.
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <button
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] mt-4"
                                    type="submit"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Đang xử lý...</span>
                                        </div>
                                    ) : (
                                        <span>Tạo tài khoản của bạn</span>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                {/* Email Field with OTP Button */}
                                <div>
                                    <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor="email-otp">
                                        Địa chỉ email Google
                                    </label>
                                    <div className="flex gap-3">
                                        <div className="flex-1 relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-xl">
                                                email
                                            </span>
                                            <input
                                                className="w-full pl-12 pr-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-800 disabled:bg-blue-100/50 disabled:text-slate-500"
                                                id="email-otp"
                                                name="email"
                                                placeholder="your-google@gmail.com"
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={otpSent}
                                            />
                                        </div>
                                        {!otpSent && (
                                            <button
                                                type="button"
                                                onClick={handleSendOtp}
                                                disabled={loading}
                                                className="px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 whitespace-nowrap shadow-md"
                                            >
                                                {loading ? "Đang gửi..." : "Gửi mã"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* OTP Field */}
                                {otpSent && (
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                        <div>
                                            <label className="block text-sm font-semibold text-blue-900 mb-2 text-center" htmlFor="otp">
                                                Mã xác thực sáu số
                                            </label>
                                            <input
                                                className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-center text-2xl font-mono tracking-wider text-blue-900"
                                                id="otp"
                                                name="otp"
                                                placeholder="000000"
                                                maxLength={6}
                                                required
                                                type="text"
                                                value={formData.otp}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* Resend Button */}
                                        <div className="text-center">
                                            <button
                                                type="button"
                                                onClick={handleSendOtp}
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                            >
                                                Gửi lại mã xác thực
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Submit and Back Buttons */}
                                <div className="space-y-3 pt-4">
                                    <button
                                        disabled={loading || !otpSent}
                                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                        type="submit"
                                    >
                                        {loading ? "Đang xác thực..." : "Xác nhận & Hoàn tất"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setIsOtpMode(false); setOtpSent(false); }}
                                        className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors py-2"
                                    >
                                        ← Quay lại đăng ký bằng mật khẩu
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-blue-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-4 bg-white text-blue-400">HOẶC</span>
                            </div>
                        </div>

                        {/* Google Register */}
                        {!isOtpMode && (
                            <button
                                onClick={() => setIsOtpMode(true)}
                                className="w-full flex items-center justify-center gap-3 py-3 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                                <span className="text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                                    Tiếp tục bằng tài khoản Google
                                </span>
                            </button>
                        )}

                        {/* Login Link */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-blue-600/70">
                                Đã có tài khoản?{' '}
                                <Link className="text-blue-600 hover:text-blue-700 font-semibold transition-colors" to="/login">
                                    Đăng nhập tại đây
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-blue-500/60 tracking-wide">
                        QuickStay International Group • Bảo mật & An toàn
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;