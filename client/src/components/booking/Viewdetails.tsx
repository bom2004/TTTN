import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Room } from '../../types';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { useAppSelector } from '../../lib/redux/store';
import { selectIsLoggedIn } from '../../lib/redux/reducers/auth/selectors';
import CommentSection from '../comment/comment';


interface ViewdetailsProps {
    room: any;
    onClose?: () => void;
    checkIn?: string;
    checkOut?: string;
}

const Viewdetails: React.FC<ViewdetailsProps> = ({ room, onClose, checkIn, checkOut }) => {
    const navigate = useNavigate();
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [currentImageIdx, setCurrentImageIdx] = useState(0);

    const isLoggedIn = useAppSelector(selectIsLoggedIn);

    if (!room) return null;


    // Xử lý an toàn dữ liệu từ bảng loại phòng (roomTypeId)
    // Nếu room đã là một object Loại phòng (từ tìm kiếm), ta dùng chính nó
    const roomTypeObj = (room as any).roomTypeId || room || {};
    const amenitiesObj = (() => {
        let am = roomTypeObj.amenities;
        if (typeof am === 'string') {
            try { am = JSON.parse(am); } catch (e) { }
        }
        return am && typeof am === 'object' ? am : {};
    })();

    const safeAmenities = {
        wifi: !!amenitiesObj.wifi,
        airConditioner: !!amenitiesObj.airConditioner,
        breakfast: !!amenitiesObj.breakfast,
        minibar: !!amenitiesObj.minibar,
        tv: !!amenitiesObj.tv,
        balcony: !!amenitiesObj.balcony
    };

    const allImages = [roomTypeObj.image, ...(roomTypeObj.images || [])].filter(Boolean);
    if (allImages.length === 0) {
        allImages.push('https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=800');
    }
    const displayImages = allImages.slice(0, 5);
    const extraImagesCount = allImages.length > 5 ? allImages.length - 5 : 0;

    const typeName = roomTypeObj.name || 'Tiêu chuẩn';
    const roomName = (room as any).roomNumber ? `Phòng ${(room as any).roomNumber}` : typeName;
    const basePrice = (roomTypeObj as any).basePrice || (room as any).price || 0;

    const getPriceUnit = () => {
        const typeStr = typeName.toLowerCase();
        if (typeStr.includes('karaoke')) return 'tiếng';
        if (typeStr.includes('tiệc')) return 'buổi';
        return 'ngày';
    };

    const priceUnit = getPriceUnit();
    const safeRating = (room as any).rating !== undefined ? Number((room as any).rating) : 5;
    const safeReviewCount = (room as any).reviewCount !== undefined ? Number((room as any).reviewCount) : 124;

    const openGallery = (idx: number) => {
        setCurrentImageIdx(idx);
        setIsGalleryOpen(true);
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIdx((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIdx((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    const handleBookingClick = () => {
        if (!isLoggedIn) {
            navigate('/login');
        } else {
            // Đảm bảo object room truyền sang trang booking có thuộc tính price (được map từ basePrice nếu cần)
            const roomWithPrice = { 
                ...room, 
                price: (room as any).price || (room as any).basePrice || 0 
            };
            navigate('/booking', { state: { room: roomWithPrice, checkIn, checkOut } });
        }
    };

    return (
        <div className="bg-[#f8f6f6] min-h-screen font-['Public_Sans',_sans-serif] text-slate-900 pb-0">
            <Navbar />

            {/* Thanh tiêu đề phụ với nút quay lại */}
            <div className="bg-[#003580] text-white px-4 md:px-10 py-3 border-t border-white/10 shadow-lg sticky top-[132px] md:top-[145px] z-40">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold leading-tight tracking-tight">Chi tiết phòng: {roomName}</h1>
                </div>
            </div>


            <main className="max-w-[1140px] mx-auto px-4 py-6 flex flex-col gap-6">
                {/* Thanh tiến trình các bước đặt phòng */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#003580]">Bước 1: Xem thông tin phòng</span>
                        <span className="text-sm font-medium text-slate-500">Hoàn thành 33%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#003580] h-full w-[33%]"></div>
                    </div>
                </div>

                {/* Lưới hiển thị thư viện hình ảnh */}
                <section className="grid grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[450px] overflow-hidden rounded-xl">
                    <div
                        className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden bg-gray-200"
                        onClick={() => openGallery(0)}
                    >
                        <img
                            alt={roomName}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            src={displayImages[0] || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=800'}
                        />
                    </div>
                    {displayImages.slice(1, 4).map((img, idx) => (
                        <div
                            key={idx}
                            className="col-span-1 row-span-1 relative group cursor-pointer overflow-hidden bg-gray-200"
                            onClick={() => openGallery(idx + 1)}
                        >
                            <img
                                alt={`${roomName} ${idx + 2}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                src={img}
                            />
                        </div>
                    ))}
                    {displayImages[4] && (
                        <div
                            className="col-span-1 row-span-1 relative group cursor-pointer overflow-hidden bg-gray-200"
                            onClick={() => openGallery(4)}
                        >
                            {extraImagesCount > 0 && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-lg z-10">
                                    +{extraImagesCount} ảnh
                                </div>
                            )}
                            <img
                                alt={`${roomName} 5`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                src={displayImages[4]}
                            />
                        </div>
                    )}
                </section>


                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Nội dung bên trái: Thông tin chi tiết và Tiện nghi */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-[#ec5b13]/10 text-[#ec5b13] text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                    {typeName}
                                </span>
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`material-symbols-outlined ${i < Math.floor(safeRating) ? 'fill-[1]' : ''}`}>
                                            {i < Math.floor(safeRating) ? 'star' : (safeRating % 1 !== 0 && i === Math.floor(safeRating) ? 'star_half' : 'star')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900">{roomName}</h2>
                            <p className="text-slate-500 mt-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-base">location_on</span>
                                Vinh, Nghệ An
                            </p>
                        </div>

                        {/* Các nhãn trạng thái đã được gỡ bỏ theo yêu cầu để ẩn thông tin còn/hết phòng với khách */}

                        <section>
                            <h3 className="text-xl font-bold mb-4">Mô tả phòng</h3>
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                                    {roomTypeObj.description || "Tận hưởng không gian nghỉ ngơi tuyệt vời được thiết kế tinh tế và hiện đại. Mang đến sự thoải mái tối đa cho quý khách trong suốt thời gian lưu trú."}
                                </p>
                                <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-400">square_foot</span>
                                        <span className="text-sm font-medium text-gray-600">Diện tích: {roomTypeObj.size || '35'}m²</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-400">king_bed</span>
                                        <span className="text-sm font-medium text-gray-600">Giường: {roomTypeObj.bedType || 'King / Twin'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-400">group</span>
                                        <span className="text-sm font-medium text-gray-600">Sức chứa: {roomTypeObj.capacity || 2} người</span>
                                    </div>
                                    {roomTypeObj.view && (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-gray-400">visibility</span>
                                            <span className="text-sm font-medium text-gray-600">Hướng: {roomTypeObj.view}</span>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold mb-4">Tiện nghi có sẵn</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {safeAmenities.wifi && (
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                        <span className="material-symbols-outlined text-[#ec5b13]">wifi</span>
                                        <span className="text-sm font-medium">WiFi miễn phí</span>
                                    </div>
                                )}
                                {safeAmenities.airConditioner && (
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                        <span className="material-symbols-outlined text-[#ec5b13]">ac_unit</span>
                                        <span className="text-sm font-medium">Điều hòa</span>
                                    </div>
                                )}
                                {safeAmenities.breakfast && (
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                        <span className="material-symbols-outlined text-[#ec5b13]">flatware</span>
                                        <span className="text-sm font-medium">Bữa sáng</span>
                                    </div>
                                )}
                                {safeAmenities.minibar && (
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                        <span className="material-symbols-outlined text-[#ec5b13]">liquor</span>
                                        <span className="text-sm font-medium">Minibar</span>
                                    </div>
                                )}
                                {safeAmenities.tv && (
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                        <span className="material-symbols-outlined text-[#ec5b13]">tv</span>
                                        <span className="text-sm font-medium">TV cáp</span>
                                    </div>
                                )}
                                {safeAmenities.balcony && (
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                        <span className="material-symbols-outlined text-[#ec5b13]">balcony</span>
                                        <span className="text-sm font-medium">Ban công</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Phần Đánh giá của khách hàng (Dynamic) */}
                        <section className="border-t border-slate-200 pt-10">
                            <CommentSection roomTypeId={roomTypeObj._id || room._id} />
                        </section>
                    </div>

                    {/* Nội dung bên phải: Thẻ đặt phòng (Booking Card) */}
                    <aside className="w-full lg:w-[360px] relative">
                        <div className="sticky top-[180px] md:top-[200px] space-y-6">
                            {/* Thẻ đặt phòng hiển thị giá và nút CTA */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xl bg-white">
                                <div className="bg-[#003580] p-5 text-white">
                                    <p className="text-xs uppercase tracking-widest opacity-80 mb-1">Giá mỗi {priceUnit}</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black">{new Intl.NumberFormat('vi-VN').format(basePrice)}₫</span>
                                        <span className="text-sm line-through opacity-60 decoration-white/50">{new Intl.NumberFormat('vi-VN').format(basePrice * 1.2)}₫</span>
                                    </div>
                                    <div className="mt-2 inline-block bg-[#ec5b13] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                        Đang có ưu đãi hấp dẫn
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-3">
                                        <hr className="border-slate-100" />
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900 text-sm">Tổng cộng (1 {priceUnit})</span>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-[#ec5b13]">{new Intl.NumberFormat('vi-VN').format(basePrice)}₫</p>
                                                <p className="text-[10px] text-slate-400">Bao gồm tất cả thuế & phí</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            Miễn phí hủy phòng trước 24h
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            Thanh toán toàn bộ hoặc cọc trước đều được
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleBookingClick}
                                        className={`w-full font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider ${isLoggedIn
                                            ? 'bg-[#ec5b13] hover:bg-[#d44d0b] text-white shadow-orange-100 active:scale-95'
                                            : 'bg-slate-800 hover:bg-slate-700 text-white active:scale-95'
                                            }`}
                                    >
                                        {isLoggedIn ? 'Tiến hành đặt phòng' : 'Đăng nhập để tiếp tục'}
                                        <span className="material-symbols-outlined font-bold">{isLoggedIn ? 'arrow_forward' : 'login'}</span>
                                    </button>

                                    <div className="bg-gray-50 p-3 rounded-lg flex gap-3 items-start">
                                        <span className="material-symbols-outlined text-blue-500 text-sm">info</span>
                                        <p className="text-[10px] text-gray-400 leading-normal italic">
                                            Bằng cách nhấn "Tiến hành đặt phòng", bạn đồng ý với các điều khoản bảo mật và chính sách đặt phòng của QuickStay.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bản đồ xem trước vị trí khách sạn */}
                            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="h-32 bg-slate-100 relative group">
                                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=400')" }}></div>
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-white p-2 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-[#ec5b13]">location_on</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-white text-center">
                                    <button className="text-[#003580] text-xs font-black uppercase tracking-widest hover:text-[#002a6b] transition-colors">Xem trên bản đồ</button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />

            {/* Modal hiển thị thư viện ảnh (Lightbox) */}
            {isGalleryOpen && (
                <div
                    className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
                    onClick={() => setIsGalleryOpen(false)}
                >
                    {/* Nút đóng Modal */}
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
                        onClick={() => setIsGalleryOpen(false)}
                    >
                        <span className="material-symbols-outlined text-4xl">close</span>
                    </button>

                    {/* Bộ đếm số lượng hình ảnh */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white/60 font-medium tracking-widest text-sm uppercase">
                        Hình ảnh {currentImageIdx + 1} / {allImages.length}
                    </div>

                    {/* Khu vực hiển thị ảnh chính */}
                    <div className="relative w-full max-w-5xl h-full flex items-center justify-center pointer-events-none">
                        <img
                            src={allImages[currentImageIdx]}
                            alt={`Gallery ${currentImageIdx + 1}`}
                            className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300 pointer-events-auto"
                        />

                        {/* Các nút điều hướng ảnh trước/sau */}
                        <button
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-all transform -translate-x-4 md:-translate-x-12 pointer-events-auto group"
                            onClick={prevImage}
                        >
                            <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">chevron_left</span>
                        </button>
                        <button
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-all transform translate-x-4 md:translate-x-12 pointer-events-auto group"
                            onClick={nextImage}
                        >
                            <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">chevron_right</span>
                        </button>
                    </div>

                    {/* Dải ảnh thu nhỏ bên dưới (Thumbnail Strip) */}
                    <div className="mt-8 flex gap-2 overflow-x-auto p-2 no-scrollbar max-w-full">
                        {allImages.map((img, i) => (
                            <div
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setCurrentImageIdx(i); }}
                                className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer transition-all border-2 ${i === currentImageIdx ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-70'}`}
                            >
                                <img src={img} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};




export default Viewdetails;
