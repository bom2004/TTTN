import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { IPromotion, ApiResponse, UserData } from '../types';

const Promotions: React.FC = () => {
    const [promotions, setPromotions] = useState<IPromotion[]>([]);
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [userData, setUserData] = useState<UserData | null>(null);
    const backendUrl = "http://localhost:3000";
    const navigate = useNavigate();

    const calculateGeniusLevel = (totalRecharged: number): number => {
        if (!totalRecharged || totalRecharged < 100000) return 0;
        if (totalRecharged < 500000) return 1;
        const level = Math.floor(totalRecharged / 500000) + 1;
        return Math.min(level, 10);
    };

    const userGeniusLevel = userData ? calculateGeniusLevel(userData.totalRecharged || 0) : 0;


    useEffect(() => {
        const fetchPromotions = async () => {
            try {
                const res = await axios.get<ApiResponse<IPromotion[]>>(`${backendUrl}/api/promotions`);
                if (res.data.success && res.data.data) {
                    const activePromos = res.data.data.filter(p =>
                        p.status === 'active' &&
                        new Date(p.startDate) <= new Date() &&
                        new Date(p.endDate) >= new Date()
                    );
                    setPromotions(activePromos);
                }
            } catch (error) {
                console.error("Lỗi khi tải danh sách khuyến mãi:", error);
            }
        };

        const fetchUser = async () => {
            const storedUser = localStorage.getItem('userData');
            if (token && storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    const res = await axios.get<ApiResponse<any>>(`${backendUrl}/api/user/profile/${parsed.id || parsed._id}`);
                    if (res.data.success && res.data.user) {
                        setUserData(res.data.user);
                    }
                } catch (error) {
                    console.error("Lỗi khi tải thông tin người dùng:", error);
                }
            }
        };

        fetchPromotions();
        fetchUser();
    }, [token]);

    const handleCopy = (code: string) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(code).then(() => {
                toast.success(`Đã copy mã: ${code}`, {
                    position: "top-center",
                    autoClose: 2000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: false,
                    theme: "colored",
                });
            }).catch(err => {
                console.error('Failed to copy: ', err);
                fallbackCopy(code);
            });
        } else {
            fallbackCopy(code);
        }
    };

    const fallbackCopy = (code: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            toast.success(`Đã copy mã: ${code}`, {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                theme: "colored",
            });
        } catch (err) {
            console.error('Fallback copy failed', err);
            toast.error("Không thể copy mã");
        }
        document.body.removeChild(textArea);
    };

    const defaultImages = [
        "https://images.unsplash.com/photo-1542314831-c6a4d14fff88?q=80&w=800",
        "https://images.unsplash.com/photo-1517840901100-8179e982acb7?q=80&w=800",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800",
        "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=800",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=800"
    ];

    return (
        <div className="bg-[#f8f6f6] dark:bg-[#221610] text-slate-900 dark:text-slate-100 min-h-screen font-sans">
            {/* Hero Section */}
            <section className="bg-[#003580] text-white py-12 px-4 md:px-10 lg:px-40">
                <div className="max-w-[1200px] mx-auto">
                    <nav aria-label="Breadcrumb" className="flex text-sm mb-4 opacity-80">
                        <ol className="flex list-none p-0">
                            <li className="flex items-center">
                                <span className="hover:underline cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
                                <span className="material-symbols-outlined text-sm mx-2">chevron_right</span>
                            </li>
                            <li>Ưu đãi</li>
                        </ol>
                    </nav>
                    <h2 className="text-3xl md:text-4xl font-black leading-tight mb-4">Ưu đãi và Khuyến mãi đặc biệt</h2>
                    <p className="text-lg md:text-xl text-blue-100 max-w-2xl">Từ những kỳ nghỉ ngắn ngày đến những chuyến đi xa, chúng tôi luôn có những ưu đãi tốt nhất dành cho bạn.</p>
                </div>
            </section>

            {/* Main Content */}
            <main className="max-w-[1200px] mx-auto px-4 md:px-10 lg:px-0 py-8 space-y-12">

                {/* Khuyến mãi từ DB */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Khuyến mãi đang có</h3>
                            <p className="text-slate-600 dark:text-slate-400">Các mã giảm giá tuyệt vời đang chờ bạn áp dụng</p>
                        </div>
                        {token && (
                            <button 
                                onClick={() => navigate('/promotion-history')}
                                className="flex items-center gap-2 text-[#006ce4] hover:text-[#0052ad] font-black text-sm uppercase tracking-widest transition-all group/hist"
                            >
                                <span className="material-symbols-outlined transition-transform group-hover/hist:rotate-12">history</span>
                                Mã khuyến mãi đã sử dụng
                            </button>
                        )}
                    </div>

                    {!token ? (
                        <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-200">
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">lock</span>
                            <p className="text-slate-600 font-medium mb-4">Vui lòng đăng nhập để xem và nhận các mã khuyến mãi dành riêng cho bạn.</p>
                            <button className="bg-[#ec5b13] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-[#ec5b13]/90 transform transition hover:scale-105 active:scale-95" onClick={() => navigate('/login')}>
                                Đăng nhập ngay
                            </button>
                        </div>
                    ) : promotions.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-200">
                            <p className="text-slate-500">Hiện tại chưa có mã khuyến mãi nào.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {promotions
                                .filter(promo => {
                                    const hasUsed = promo.usedBy && userData && promo.usedBy.includes(userData.id || userData._id || "");
                                    const isLimitReached = promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit;
                                    return !hasUsed && !isLimitReached;
                                })
                                .map((promo, index) => {
                                const bgImage = promo.image && promo.image !== "" ? promo.image : defaultImages[index % defaultImages.length];
                                return (
                                    <div key={promo._id} className={`bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex flex-col ${promo.minGeniusLevel > userGeniusLevel ? 'opacity-75 grayscale-[0.5]' : 'hover:scale-[1.02]'}`}>
                                        <div
                                            className="relative h-48 bg-cover bg-center"
                                            style={{ backgroundImage: `url('${bgImage}')` }}
                                        >
                                            <div className="absolute top-3 left-3 bg-[#ec5b13] text-white text-xs font-bold px-2 py-1 rounded">
                                                GIẢM {promo.discountPercent}%
                                            </div>
                                            {promo.minGeniusLevel > 0 && (
                                                <div className={`absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm ${promo.minGeniusLevel <= userGeniusLevel ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'}`}>
                                                    <span className="material-symbols-outlined text-xs">workspace_premium</span>
                                                    Genius {promo.minGeniusLevel}
                                                </div>
                                            )}
                                            <div 
                                                onClick={() => handleCopy(promo.code)}
                                                className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-sm backdrop-blur-sm border border-white/20 cursor-pointer flex items-center gap-1.5 transition-all group/code active:scale-95"
                                                title="Click để copy mã"
                                            >
                                                <span className="material-symbols-outlined text-[14px] text-[#ec5b13] group-hover/code:rotate-12 transition-transform">content_copy</span>
                                                {promo.code}
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h4 className="text-lg font-bold mb-2 break-words flex items-center gap-2">
                                                {promo.title}
                                                {promo.minGeniusLevel > userGeniusLevel && (
                                                    <span className="material-symbols-outlined text-slate-400 text-sm">lock</span>
                                                )}
                                            </h4>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                                                {promo.description || "Hãy sử dụng mã này để tiết kiệm hơn cho chuyến đi của bạn."}
                                            </p>

                                            <div className="mt-auto space-y-3">
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                    <span className="material-symbols-outlined text-sm">shopping_cart_checkout</span>
                                                    <span>Đơn tối thiểu: {new Intl.NumberFormat('vi-VN').format(promo.minOrderValue)}đ</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-rose-500 font-bold mb-4">
                                                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                                                    <span>Hạn dùng: {new Date(promo.endDate).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                
                                                {promo.minGeniusLevel > userGeniusLevel ? (
                                                    <div className="w-full bg-slate-100 text-slate-400 font-bold py-2.5 rounded-lg text-center text-xs uppercase tracking-widest border border-slate-200">
                                                        Cần hạng Genius {promo.minGeniusLevel}
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleCopy(promo.code)}
                                                        className="w-full bg-[#ec5b13] text-white font-bold py-2.5 rounded-lg hover:bg-[#d64f0b] transition-all uppercase tracking-widest text-sm shadow-md active:scale-95 flex items-center justify-center gap-2 group/btn"
                                                    >
                                                        <span className="material-symbols-outlined text-lg group-hover/btn:scale-110 transition-transform">content_copy</span>
                                                        Copy mã: {promo.code}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Member Only Deals */}
                {!token && (
                    <section className="bg-[#ec5b13]/5 dark:bg-[#ec5b13]/10 rounded-2xl p-6 md:p-10 border border-[#ec5b13]/20">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <div className="inline-flex items-center gap-2 bg-[#ec5b13] text-white px-3 py-1 rounded-full text-xs font-bold">
                                    <span className="material-symbols-outlined text-xs">grade</span>
                                    QUYỀN LỢI THÀNH VIÊN
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Giảm thêm 10% cho thành viên mới</h3>
                                <p className="text-slate-700 dark:text-slate-300">Đăng nhập để xem giá dành riêng cho thành viên và nhận các ưu đãi nâng cấp phòng miễn phí tại hàng ngàn chỗ nghỉ trên toàn thế giới.</p>
                                <div className="flex flex-wrap gap-4 pt-2">
                                    <button className="bg-[#ec5b13] text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-[#ec5b13]/90" onClick={() => navigate('/login')}>Đăng nhập ngay</button>
                                    <button className="border border-[#ec5b13] text-[#ec5b13] px-6 py-3 rounded-lg font-bold hover:bg-[#ec5b13]/10" onClick={() => navigate('/register')}>Đăng ký thành viên</button>
                                </div>
                            </div>
                            <div className="w-full md:w-1/3 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl border border-[#ec5b13]/10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-[#ec5b13]/20 flex items-center justify-center text-[#ec5b13]">
                                            <span className="material-symbols-outlined">local_offer</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">Giảm giá trực tiếp</p>
                                            <p className="text-xs text-slate-500">Áp dụng ngay khi thanh toán</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-[#ec5b13]/20 flex items-center justify-center text-[#ec5b13]">
                                            <span className="material-symbols-outlined">upgrade</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">Nâng cấp hạng phòng</p>
                                            <p className="text-xs text-slate-500">Tại các đối tác chọn lọc</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-[#ec5b13]/20 flex items-center justify-center text-[#ec5b13]">
                                            <span className="material-symbols-outlined">restaurant</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">Bữa sáng miễn phí</p>
                                            <p className="text-xs text-slate-500">Khởi đầu ngày mới tràn năng lượng</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default Promotions;
