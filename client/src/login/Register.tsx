import React, { useState } from 'react';
import { assets } from '../assets/assets';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, UserData } from '../types';

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
            const response = await axios.post<ApiResponse<UserData>>(`${backendUrl}/api/user/register`, formData);
            
            if (response.data.success) {
                toast.success(response.data.message);
                localStorage.setItem('token', response.data.token || '');
                localStorage.setItem('userData', JSON.stringify(response.data.userData || {}));
                window.location.href = '/';
            } else {
                toast.error(response.data.message);
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
                toast.success("Đăng ký & Đăng nhập thành công");
                localStorage.setItem('token', response.data.token || '');
                localStorage.setItem('userData', JSON.stringify(response.data.userData || {}));
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
        <div className="bg-[#f5f5f5] font-sans antialiased min-h-screen flex items-center justify-center py-12 px-4 shadow-inner">
            <main className="w-full max-w-xl">
                <header className="text-center mb-10">
                    <Link to="/" className="flex items-center justify-center gap-2 group">
                        <div className="bg-[#003580] p-1.5 rounded-lg shadow-lg shadow-blue-900/10 transition-transform group-hover:scale-105">
                            <span className="material-symbols-outlined text-white text-2xl">bed</span>
                        </div>
                        <span className="text-3xl font-black text-[#003580] tracking-tight">QuickStay.com</span>
                    </Link>
                </header>

                <div className="bg-white rounded-xl p-8 md:p-12 shadow-2xl border border-gray-100">
                    <div className="mb-10 text-center md:text-left">
                        <h1 className="text-3xl font-[900] text-[#1a1a1a] mb-3 leading-tight tracking-tight">
                            {isOtpMode ? "Đăng ký nhanh" : "Tạo tài khoản mới"}
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">
                            {isOtpMode ? "Sử dụng email Google để tạo tài khoản trong vài giây" : "Khám phá hàng ngàn khách sạn ưu đãi với tài khoản QuickStay của bạn"}
                        </p>
                    </div>

                    {!isOtpMode ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1" htmlFor="full_name">Họ và tên của bạn</label>
                                <input 
                                    className="w-full px-5 py-4 bg-gray-50 rounded-xl border border-transparent focus:border-[#006ce4]/30 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all placeholder:text-gray-300" 
                                    id="full_name" 
                                    name="full_name" 
                                    placeholder="Nguyễn Văn A" 
                                    required 
                                    type="text"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1" htmlFor="email">Email</label>
                                    <input 
                                        className="w-full px-5 py-4 bg-gray-50 rounded-xl border border-transparent focus:border-[#006ce4]/30 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all placeholder:text-gray-300" 
                                        id="email" 
                                        name="email" 
                                        placeholder="example@gmail.com" 
                                        required 
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1" htmlFor="phone">Số điện thoại</label>
                                    <input 
                                        className="w-full px-5 py-4 bg-gray-50 rounded-xl border border-transparent focus:border-[#006ce4]/30 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all placeholder:text-gray-300" 
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-50 pt-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1" htmlFor="password">Mật khẩu</label>
                                    <input 
                                        className="w-full px-5 py-4 bg-gray-50 rounded-xl border border-transparent focus:border-[#006ce4]/30 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all placeholder:text-gray-300" 
                                        id="password" 
                                        name="password" 
                                        placeholder="••••••••" 
                                        required 
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1" htmlFor="confirm_password">Xác nhận mật khẩu</label>
                                    <input 
                                        className="w-full px-5 py-4 bg-gray-50 rounded-xl border border-transparent focus:border-[#006ce4]/30 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all placeholder:text-gray-300" 
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

                            <div className="pt-4">
                                <button 
                                    disabled={loading}
                                    className="w-full bg-[#006ce4] text-white font-black py-4.5 px-4 rounded-xl hover:bg-[#0057b8] transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 group disabled:opacity-70 text-base" 
                                    type="submit"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>
                                            <span>Tạo tài khoản của bạn</span>
                                            <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">how_to_reg</span>
                                        </>
                                    )}
                                </button>
                                <div className="flex items-start gap-3 mt-6">
                                    <input 
                                        type="checkbox" 
                                        id="acceptTerms" 
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-[#006ce4] border-gray-300 rounded cursor-pointer"
                                    />
                                    <label htmlFor="acceptTerms" className="text-[11px] text-gray-400 font-medium leading-relaxed cursor-pointer">
                                        Bằng việc tạo tài khoản, bạn đồng ý với <span className="text-[#006ce4] hover:underline">Điều khoản & Điều kiện</span> và <span className="text-[#006ce4] hover:underline">Chính sách Bảo mật</span> của chúng tôi.
                                    </label>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1" htmlFor="email-otp">Địa chỉ email Google</label>
                                <div className="flex gap-3">
                                    <input 
                                        className="flex-1 px-5 py-4 bg-gray-50 rounded-xl border border-transparent focus:border-[#006ce4]/30 focus:bg-white text-sm font-bold text-gray-700 outline-none transition-all disabled:opacity-60" 
                                        id="email-otp" 
                                        name="email" 
                                        placeholder="your-google@gmail.com" 
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
                                            className="px-8 py-4 bg-[#003580] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#002a6b] transition-all disabled:opacity-50 shadow-md"
                                        >
                                            Gửi mã
                                        </button>
                                    )}
                                </div>
                            </div>

                            {otpSent && (
                                <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 block text-center" htmlFor="otp">Nhập mã xác thực sáu số</label>
                                    <input 
                                        className="w-full px-5 py-6 bg-gray-50 rounded-2xl border-none text-3xl font-black text-[#003580] tracking-[0.6em] text-center focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                                        id="otp" 
                                        name="otp" 
                                        placeholder="000000" 
                                        maxLength={6}
                                        required 
                                        type="text"
                                        value={formData.otp}
                                        onChange={handleChange}
                                    />
                                    <p className="text-center">
                                        <button type="button" onClick={handleSendOtp} className="text-xs font-bold text-[#006ce4] hover:underline uppercase tracking-widest">Gửi lại mã mới</button>
                                    </p>
                                </div>
                            )}

                            <div className="pt-4">
                                <button 
                                    disabled={loading || !otpSent}
                                    className="w-full bg-[#006ce4] text-white font-black py-4.5 px-4 rounded-xl hover:bg-[#0057b8] transition-all shadow-xl shadow-blue-100 disabled:opacity-50 text-base" 
                                    type="submit"
                                >
                                    {loading ? "Đang xác thực..." : "Xác nhận & Hoàn tất"}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {setIsOtpMode(false); setOtpSent(false);}}
                                    className="w-full mt-6 text-xs font-black text-gray-400 uppercase tracking-[0.25em] hover:text-[#003580] transition"
                                >
                                    Quay về đăng ký mật khẩu
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">
                            <span className="px-6 bg-white">Hoặc tiếp tục với</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {!isOtpMode && (
                            <button 
                                onClick={() => setIsOtpMode(true)}
                                className="col-span-2 flex items-center justify-center gap-3 py-4 border-2 border-gray-50 rounded-xl hover:bg-gray-50 hover:border-gray-100 transition-all group"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                                <span className="text-sm font-bold text-[#1a1a1a]">Tiếp tục bằng tài khoản Google</span>
                            </button>
                        )}
                        <button className="flex items-center justify-center gap-2 py-4 border-2 border-gray-50 rounded-xl hover:bg-gray-50 hover:border-gray-100 transition-all">
                            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
                            <span className="text-xs font-bold text-[#1a1a1a]">Facebook</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 py-4 border-2 border-gray-50 rounded-xl hover:bg-gray-50 hover:border-gray-100 transition-all">
                             <svg className="w-5 h-5" fill="#000000" viewBox="0 0 24 24"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"></path></svg>
                             <span className="text-xs font-bold text-[#1a1a1a]">Apple ID</span>
                        </button>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-gray-400 text-sm font-medium">
                            Đã có tài khoản? 
                            <Link className="text-[#006ce4] font-black ml-2 hover:underline tracking-tight" to="/login">Đăng nhập tại đây</Link>
                        </p>
                    </div>
                </div>

                <footer className="mt-10 text-center space-y-2">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">QuickStay International Group</p>
                    <p className="text-gray-300 text-[10px]">© 2024 Bản quyền thuộc về QuickStay.com</p>
                </footer>
            </main>
        </div>
    );
};

export default Register;
