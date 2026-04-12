import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import { selectAuthUser, selectAuthToken } from '../../lib/redux/reducers/auth';
import { fetchAllPromotionsThunk, selectAllPromotions } from '../../lib/redux/reducers/promotion';
import { Promotion } from '../../lib/redux/reducers/promotion/types';

const Promotions: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const promotionsFromStore = useAppSelector(selectAllPromotions);
    const userData = useAppSelector(selectAuthUser);
    const token = useAppSelector(selectAuthToken);

    const getMembershipLevel = (totalSpent: number): number => {
        if (!totalSpent || totalSpent < 2000000) return 0;
        if (totalSpent < 7000000) return 1;
        if (totalSpent < 12000000) return 2;
        return 3;
    };

    const getMembershipName = (level: number) => ['Silver', 'Gold', 'Diamond', 'Platinum'][level] || 'Silver';

    const userMembershipLevel = userData ? getMembershipLevel(userData.totalSpent || 0) : 0;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activePromotions = promotionsFromStore.filter(p => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        return p.status === 'active' && startDate <= today && endDate >= today;
    });

    const renderablePromotions = activePromotions.filter(promo => {
        // Nếu đã đăng nhập, lọc bỏ các mã đã dùng hoặc hết lượt
        if (token && userData) {
            const hasUsed = (promo.usedBy as any)?.includes(userData.id || userData._id || "");
            const isLimitReached = promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit;
            if (hasUsed || isLimitReached) return false;
        }
        
        // Nếu chưa đăng nhập, show tất cả để khách hàng thấy (có xử lý UI làm mờ)
        return true;
    });

    useEffect(() => {
        dispatch(fetchAllPromotionsThunk());
    }, [dispatch]);

    const renderPromotionsContent = () => {
        if (renderablePromotions.length === 0) {
            return (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-[#ec5b13]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-4xl text-[#ec5b13]">upcoming</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-800">Kho ưu đãi đang được làm mới</h4>
                    <p className="text-slate-500 mt-2 font-medium">Quý khách hãy đợi các khuyến mãi tiếp theo của chúng tôi nhé!</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderablePromotions.map((promo: Promotion, index: number) => {
                    const bgImage = promo.image && promo.image !== "" ? promo.image : defaultImages[index % defaultImages.length];
                    return (
                        <div key={promo._id} className={`bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex flex-col ${promo.minGeniusLevel > userMembershipLevel ? 'opacity-75 grayscale-[0.5]' : 'hover:scale-[1.02]'}`}>
                            <div
                                className="relative h-48 bg-cover bg-center"
                                style={{ backgroundImage: `url('${bgImage}')` }}
                            >
                                <div className="absolute top-3 left-3 bg-[#ec5b13] text-white text-xs font-bold px-2 py-1 rounded">
                                    GIẢM {promo.discountPercent}%
                                </div>
                                {promo.minGeniusLevel > 0 && (
                                    <div className={`absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm ${promo.minGeniusLevel <= userMembershipLevel ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'}`}>
                                        <span className="material-symbols-outlined text-xs">workspace_premium</span>
                                        Hạng {getMembershipName(promo.minGeniusLevel)}
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
                                    {promo.minGeniusLevel > userMembershipLevel && (
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
                                    {promo.maxDiscountAmount > 0 && (
                                        <div className="flex items-center gap-2 text-xs text-amber-600 font-bold">
                                            <span className="material-symbols-outlined text-sm">payments</span>
                                            <span>Giảm tối đa: {new Intl.NumberFormat('vi-VN').format(promo.maxDiscountAmount)}đ</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-rose-500 font-bold mb-4">
                                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                                        <span>Hạn dùng: {new Date(promo.endDate).toLocaleDateString('vi-VN')}</span>
                                    </div>

                                    {promo.minGeniusLevel > userMembershipLevel ? (
                                        <div className="w-full bg-slate-100 text-slate-400 font-bold py-2.5 rounded-lg text-center text-xs uppercase tracking-widest border border-slate-200">
                                            Cần {getMembershipName(promo.minGeniusLevel)}
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
        );
    };

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
                    <h2 className="text-3xl md:text-4xl font-black leading-tight mb-4">Ưu đãi và Khuyến mãi đặc biệt</h2>
                    <p className="text-lg md:text-xl text-blue-100 max-w-2xl">Từ những kỳ nghỉ ngắn ngày đến những chuyến đi xa, chúng tôi luôn có những ưu đãi tốt nhất dành cho bạn.</p>
                </div>
            </section>

            {/* Main Content */}
            <main className="max-w-[1200px] mx-auto px-4 md:px-10 lg:px-0 py-8 space-y-12">
                {/* Breadcrumb Section */}
                <nav className="flex items-center gap-2 pb-6 text-sm">
                    <Link to="/" className="text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-lg">home</span>
                        Trang chủ
                    </Link>
                    <span className="material-symbols-outlined text-gray-300 text-sm">chevron_right</span>
                    <span className="text-indigo-600 font-bold">Khuyến mãi</span>
                </nav>

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

                    {token ? (
                        renderPromotionsContent()
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 text-center animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-orange-400 to-[#ec5b13]"></div>
                            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-5xl text-[#ec5b13]">lock</span>
                            </div>
                            <h2 className="text-2xl font-black text-gray-800 mb-2">Chưa đăng nhập</h2>
                            <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">
                                Kho ưu đãi và mã giảm giá đặc quyền chỉ dành riêng cho thành viên của QuickStay. Vui lòng đăng nhập để xem!
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <button onClick={() => navigate('/login')} className="px-8 py-3.5 bg-[#ec5b13] text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:bg-[#d64f0b] transition-all active:scale-95">
                                    Đăng nhập ngay
                                </button>
                                <button onClick={() => navigate('/register')} className="px-8 py-3.5 bg-white text-[#ec5b13] font-bold rounded-xl border-2 border-orange-100 hover:bg-orange-50 transition-all active:scale-95">
                                    Đăng ký thành viên
                                </button>
                            </div>
                        </div>
                    )}
                </section>


            </main>
        </div>
    );
};

export default Promotions;
