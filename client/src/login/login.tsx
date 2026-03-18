import React, { useState } from 'react';
import { assets } from '../assets/assets';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, UserData } from '../types';

const Login: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const navigate = useNavigate();
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
            const response = await axios.post<ApiResponse<UserData>>(`${backendUrl}/api/user/login`, {
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                toast.success(response.data.message);
                localStorage.setItem('token', response.data.token || '');
                const userData = response.data.userData;
                localStorage.setItem('userData', JSON.stringify(userData || {}));
                
                // Redirect based on role
                if (userData?.role === 'staff') {
                    window.location.href = '/staff';
                } else if (userData?.role === 'admin' || userData?.role === 'hotelOwner') {
                    window.location.href = '/owner';
                } else {
                    window.location.href = '/';
                }
            } else {
                setErrorMsg(response.data.message);
            }
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.response?.data?.message || "Tên đăng nhập hoặc mật khẩu không chính xác");
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
            const response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/user/send-otp`, { email: formData.email });
            if (response.data.success) {
                toast.success(response.data.message);
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
            const response = await axios.post<ApiResponse<UserData>>(`${backendUrl}/api/user/verify-otp`, {
                email: formData.email,
                otp: formData.otp
            });

            if (response.data.success) {
                toast.success(response.data.message);
                localStorage.setItem('token', response.data.token || '');
                const userData = response.data.userData;
                localStorage.setItem('userData', JSON.stringify(userData || {}));
                
                // Redirect based on role
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
            toast.error(error.response?.data?.message || "Mã OTP không đúng");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f5f5f5] font-sans antialiased min-h-screen flex items-center justify-center py-16 px-4">
            <main className="w-full max-w-lg">
                <header className="text-center mb-12">
                    <Link to="/" className="inline-flex items-center justify-center gap-3 group">
                        <div className="bg-[#003580] p-2 rounded-xl shadow-lg ring-4 ring-[#003580]/5">
                            <span className="material-symbols-outlined text-white text-3xl font-black">bed</span>
                        </div>
                        <span className="text-4xl font-[900] text-[#003580] tracking-tighter">QuickStay.com</span>
                    </Link>
                </header>

                <div className="bg-white rounded-[40px] p-10 md:p-14 shadow-2xl shadow-blue-900/5 border border-gray-50 relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#006ce4]/[0.02] rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    
                    <div className="mb-10 text-center md:text-left">
                        <h1 className="text-3xl font-black text-[#1a1a1a] mb-3 leading-tight tracking-tight">
                            {isOtpMode ? "Đăng nhập xác thực" : "Mừng bạn trở lại!"}
                        </h1>
                        <p className="text-gray-500 font-medium text-base">
                            {isOtpMode ? "Nhập mã OTP được gửi tới tài khoản Google của bạn" : "Vui lòng nhập thông tin để tiếp tục trải nghiệm cùng QuickStay"}
                        </p>
                    </div>

                    {!isOtpMode ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {errorMsg && (
                                <div className="bg-[#d4111e]/10 text-[#d4111e] text-xs font-black px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-[#d4111e]/20">
                                    <span className="material-symbols-outlined text-lg">error</span>
                                    {errorMsg}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1" htmlFor="email">Email tài khoản</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#006ce4] transition-colors">alternate_email</span>
                                    <input 
                                        className="w-full pl-14 pr-6 py-4.5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-black text-gray-700 outline-none transition-all placeholder:text-gray-200" 
                                        id="email" 
                                        name="email" 
                                        placeholder="your-email@gmail.com" 
                                        required 
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]" htmlFor="password">Mật khẩu</label>
                                    <Link to="/forgot" className="text-xs font-black text-[#006ce4] hover:underline">Quên mật khẩu?</Link>
                                </div>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#006ce4] transition-colors">lock</span>
                                    <input 
                                        className="w-full pl-14 pr-6 py-4.5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-100 focus:bg-white text-sm font-black text-gray-700 outline-none transition-all placeholder:text-gray-200" 
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

                            <button 
                                disabled={loading}
                                className="w-full bg-[#006ce4] text-white font-black py-5 px-4 rounded-2xl hover:bg-[#0057b8] transition-all shadow-xl shadow-blue-500/10 mt-6 flex items-center justify-center gap-3 group disabled:opacity-70 active:scale-[0.98] transform" 
                                type="submit"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        <span>Đăng nhập ngay</span>
                                        <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">login</span>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-8">
                            <div className="space-y-3 text-center">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]" htmlFor="email-otp">Nhập địa chỉ email đăng ký</label>
                                <div className="relative group overflow-hidden bg-gray-50 rounded-2xl border-2 border-transparent focus-within:border-blue-100 focus-within:bg-white transition-all flex">
                                    <input 
                                        className="flex-1 pl-6 pr-4 py-4.5 bg-transparent text-sm font-black text-gray-700 outline-none disabled:opacity-60" 
                                        id="email-otp" 
                                        name="email" 
                                        placeholder="account@gmail.com" 
                                        required 
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={otpSent}
                                    />
                                    {!otpSent && (
                                        <button 
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={loading}
                                            className="px-8 bg-[#003580] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#002a6b] transition-all disabled:opacity-50"
                                        >
                                            Gửi mã
                                        </button>
                                    )}
                                </div>
                            </div>

                            {otpSent && (
                                <div className="space-y-4 animate-in slide-in-from-top-4 duration-500 text-center">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]" htmlFor="otp">Vui lòng nhập mã OTP</label>
                                    <input 
                                        className="w-full px-5 py-6 bg-gray-50 rounded-2xl border-none text-4xl font-black text-[#003580] tracking-[0.6em] text-center focus:ring-4 focus:ring-blue-50 transition-all outline-none" 
                                        id="otp" 
                                        name="otp" 
                                        placeholder="000000" 
                                        maxLength={6}
                                        required 
                                        type="text"
                                        value={formData.otp}
                                        onChange={handleChange}
                                    />
                                    <p className="mt-4">
                                        <button type="button" onClick={handleSendOtp} className="text-[10px] font-black text-[#006ce4] hover:underline uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full">Gửi lại mã mới</button>
                                    </p>
                                </div>
                            )}

                            <div className="pt-4">
                                <button 
                                    disabled={loading || !otpSent}
                                    className="w-full bg-[#006ce4] text-white font-black py-5 px-4 rounded-2xl hover:bg-[#0057b8] transition-all shadow-xl shadow-blue-500/10 disabled:opacity-50 active:scale-[0.98] transform" 
                                    type="submit"
                                >
                                    {loading ? "Đang xác thực..." : "Xác nhận & Đăng nhập"}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {setIsOtpMode(false); setOtpSent(false);}}
                                    className="w-full mt-6 text-xs font-black text-gray-400 uppercase tracking-[0.2em] hover:text-[#003580] transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">keyboard_backspace</span>
                                    Quay về dùng mật khẩu
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">
                            <span className="px-6 bg-white">Lựa chọn khác</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {!isOtpMode && (
                            <button 
                                onClick={() => setIsOtpMode(true)}
                                className="col-span-2 flex items-center justify-center gap-4 py-4.5 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-100 hover:bg-blue-50/30 transition-all group group"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
                                <span className="text-sm font-black text-[#1a1a1a]">Tiếp tục với Google</span>
                            </button>
                        )}
                        <button className="flex items-center justify-center gap-2 py-4 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.96] transform">
                            <svg className="w-6 h-6" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#1a1a1a]">Facebook</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 py-4 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.96] transform">
                             <svg className="w-6 h-6" fill="#000000" viewBox="0 0 24 24"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"></path></svg>
                             <span className="text-[11px] font-black uppercase tracking-widest text-[#1a1a1a]">Apple</span>
                        </button>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-gray-400 text-sm font-medium">
                            Bạn mới ghé thăm QuickStay? 
                            <Link className="text-[#006ce4] font-black ml-2 hover:underline tracking-tight" to="/register">Đăng ký tài khoản</Link>
                        </p>
                    </div>
                </div>
                
                <footer className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 opacity-60">
                    QuickStay Global - Version 2.0
                </footer>
            </main>
        </div>
    );
};

export default Login;
