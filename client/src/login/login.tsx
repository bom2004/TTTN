import React, { useState } from 'react';
import { assets } from '../assets/assets';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserData } from '../types';

import { useAppDispatch } from '../lib/redux/store';
import { loginThunk, sendOTPThunk, verifyOTPThunk } from '../lib/redux/reducers/auth';

const Login: React.FC = () => {

    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [isOtpMode, setIsOtpMode] = useState<boolean>(false);
    const [otpSent, setOtpSent] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        otp: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errorMsg) setErrorMsg('');
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await dispatch(loginThunk({
                email: formData.email,
                password: formData.password
            })).unwrap();

            if (data.success) {
                toast.success("Đăng nhập thành công!");
                window.location.href = '/';
            } else {
                toast.error(data.message);
            }
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error || "Tên đăng nhập hoặc mật khẩu không chính xác");
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
            const data = await dispatch(sendOTPThunk({ email: formData.email, checkExist: false })).unwrap();
            if (data.success) {
                toast.success(data.message);
                setOtpSent(true);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error || "Lỗi khi gửi OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await dispatch(verifyOTPThunk({
                email: formData.email,
                otp: formData.otp
            })).unwrap();

            if (data.success) {
                toast.success("Xác thực & Đăng nhập thành công");

                const userData = data.userData;
                if (userData?.role === 'staff') {
                    window.location.href = '/staff';
                } else if (userData?.role === 'admin' || userData?.role === 'hotelOwner') {
                    window.location.href = '/owner';
                } else {
                    window.location.href = '/';
                }
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error || "Mã OTP không đúng");
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
                    <div className="p-8 sm:p-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-800 to-cyan-700 bg-clip-text mb-2 tracking-tight">
                                {isOtpMode ? "Xác thực đăng nhập" : "Chào mừng trở lại"}
                            </h2>
                            <p className="text-blue-600/70 text-sm">
                                {isOtpMode
                                    ? "Nhập mã xác thực được gửi đến email của bạn"
                                    : "Đăng nhập để tiếp tục trải nghiệm dịch vụ cao cấp"}
                            </p>
                        </div>

                        {!isOtpMode ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {errorMsg && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-shake">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-red-500 text-sm">error_outline</span>
                                            <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Email Field */}
                                <div>
                                    <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor="email">
                                        Địa chỉ email
                                    </label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 text-xl transition-colors">
                                            email
                                        </span>
                                        <input
                                            className="w-full pl-12 pr-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all outline-none text-slate-800 placeholder:text-blue-300"
                                            id="email"
                                            name="email"
                                            placeholder="your@email.com"
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold text-blue-900" htmlFor="password">
                                            Mật khẩu
                                        </label>
                                        <Link to="/forgot" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                                            Quên mật khẩu?
                                        </Link>
                                    </div>
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

                                {/* Submit Button */}
                                <button
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                    type="submit"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Đang xử lý...</span>
                                        </div>
                                    ) : (
                                        <span>Đăng nhập</span>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                {/* Email Field with OTP Button */}
                                <div>
                                    <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor="email-otp">
                                        Địa chỉ email
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
                                                placeholder="your@email.com"
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
                                            <label className="block text-sm font-semibold text-blue-900 mb-2" htmlFor="otp">
                                                Mã xác thực
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
                                        {loading ? "Đang xác thực..." : "Xác nhận & Đăng nhập"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setIsOtpMode(false); setOtpSent(false); }}
                                        className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors py-2"
                                    >
                                        ← Quay lại đăng nhập bằng mật khẩu
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

                        {/* Google Login */}
                        {!isOtpMode && (
                            <button
                                onClick={() => setIsOtpMode(true)}
                                className="w-full flex items-center justify-center gap-3 py-3 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                                <span className="text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                                    Đăng nhập với Google
                                </span>
                            </button>
                        )}

                        {/* Sign Up Link */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-blue-600/70">
                                Chưa có tài khoản?{' '}
                                <Link className="text-blue-600 hover:text-blue-700 font-semibold transition-colors" to="/register">
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-blue-500/60 tracking-wide">
                        QuickStay Premium • Trải nghiệm đẳng cấp
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
