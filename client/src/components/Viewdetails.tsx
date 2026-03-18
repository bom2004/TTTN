import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Room } from '../types';
import Navbar from './Navbar';
import Footer from './Footer';


interface ViewdetailsProps {
    room: Room | null;
    onClose?: () => void;
}

const Viewdetails: React.FC<ViewdetailsProps> = ({ room, onClose }) => {
    const navigate = useNavigate();
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [currentImageIdx, setCurrentImageIdx] = useState(0);

    if (!room) return null;


    // Helper to get safe amenities even from old records
    const safeAmenities = (room.amenities && !Array.isArray(room.amenities)) ? room.amenities : {
        wifi: false,
        airConditioner: false,
        breakfast: false,
        minibar: false,
        tv: false,
        balcony: false
    };

    const allImages = [room.thumbnail || (room as any).avatar, ...(room.images || [])].filter(Boolean);
    const displayImages = allImages.slice(0, 5);
    const extraImagesCount = allImages.length > 5 ? allImages.length - 5 : 0;
    
    const getPriceUnit = () => {
        const typeName = (room.roomType || "").toString().toLowerCase();
        if (typeName.includes('karaoke')) return 'tiếng';
        if (typeName.includes('tiệc')) return 'buổi';
        if (typeName.includes('thường') || typeName.includes('vip')) return 'ngày';
        return 'đêm';
    };

    const priceUnit = getPriceUnit();

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


    return (
        <div className="bg-[#f8f6f6] min-h-screen font-['Public_Sans',_sans-serif] text-slate-900 pb-0">
            <Navbar />

            {/* Sub-header with back button */}
            <div className="bg-[#003580] text-white px-4 md:px-10 py-3 border-t border-white/10 shadow-lg sticky top-[132px] md:top-[145px] z-40">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold leading-tight tracking-tight">Chi tiết phòng: {room.name || (room as any).roomNumber}</h1>
                </div>
            </div>


            <main className="max-w-[1140px] mx-auto px-4 py-6 flex flex-col gap-6">
                {/* Progress Stepper */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#003580]">Bước 1: Xem thông tin phòng</span>
                        <span className="text-sm font-medium text-slate-500">Hoàn thành 33%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#003580] h-full w-[33%]"></div>
                    </div>
                </div>

                {/* Image Gallery Grid */}
                <section className="grid grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[450px] overflow-hidden rounded-xl">
                    <div 
                        className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden bg-gray-200"
                        onClick={() => openGallery(0)}
                    >
                        <img
                            alt={room.name}
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
                                alt={`${room.name || 'Room'} ${idx + 2}`}
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
                                alt={`${room.name || 'Room'} 5`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                src={displayImages[4]}
                            />
                        </div>
                    )}
                </section>


                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Content: Info and Amenities */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-[#ec5b13]/10 text-[#ec5b13] text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                    {room.roomType || 'Lựa chọn hàng đầu'}
                                </span>
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`material-symbols-outlined ${i < Math.floor(room.rating || 5) ? 'fill-[1]' : ''}`}>
                                            {i < Math.floor(room.rating || 5) ? 'star' : (room.rating % 1 !== 0 && i === Math.floor(room.rating) ? 'star_half' : 'star')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900">{room.name || (room as any).roomNumber}</h2>
                            <p className="text-slate-500 mt-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-base">location_on</span>
                                Vinh, Nghệ An
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${room.status === 'available'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-rose-100 text-rose-700 border-rose-200'
                                }`}>
                                <span className="material-symbols-outlined">{room.status === 'available' ? 'check_circle' : 'cancel'}</span>
                                <span className="text-sm font-semibold">{room.status === 'available' ? 'Còn trống' : 'Hết phòng'}</span>
                            </div>
                            {room.availableRooms <= 3 && room.availableRooms > 0 && (
                                <div className="flex items-center gap-2 bg-orange-100 text-[#ec5b13] px-3 py-1.5 rounded-lg border border-orange-200">
                                    <span className="material-symbols-outlined">error</span>
                                    <span className="text-sm font-semibold">Chỉ còn {room.availableRooms} phòng cuối cùng!</span>
                                </div>
                            )}
                        </div>

                        <section>
                            <h3 className="text-xl font-bold mb-4">Mô tả phòng</h3>
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                                    {room.description}
                                </p>
                                <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-400">square_foot</span>
                                        <span className="text-sm font-medium text-gray-600">Diện tích: {room.size}m²</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-400">king_bed</span>
                                        <span className="text-sm font-medium text-gray-600">Giường: {room.bedType}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-400">group</span>
                                        <span className="text-sm font-medium text-gray-600">Sức chứa: {room.capacity || 2} người</span>
                                    </div>
                                    {room.view && (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-gray-400">visibility</span>
                                            <span className="text-sm font-medium text-gray-600">Hướng: {room.view}</span>
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

                        {/* Reviews Section */}
                        <section className="border-t border-slate-200 pt-6">

                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Đánh giá khách hàng</h3>
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#003580] text-white font-bold p-2 rounded-lg text-lg">{(room.rating || 5).toFixed(1)}</div>
                                    <div>
                                        <p className="text-sm font-bold leading-tight">
                                            {room.rating >= 9 ? 'Xuất sắc' : room.rating >= 8 ? 'Rất tốt' : 'Hài lòng'}
                                        </p>
                                        <p className="text-xs text-slate-500">{new Intl.NumberFormat().format(room.reviewCount || 0)} đánh giá</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-bold text-[#003580]">
                                                <span className="material-symbols-outlined">person</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">Khách hàng</p>
                                                <p className="text-[10px] text-slate-400">Đã trải nghiệm thực tế</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded text-yellow-700 font-bold text-xs">
                                            <span className="material-symbols-outlined text-xs fill-[1]">star</span>
                                            {(room.rating || 5).toFixed(1)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 italic">"Không gian nghỉ ngơi tuyệt vời, phòng sạch sẽ và đầy đủ các trang thiết bị hiện đại. Dịch vụ rất đáng đồng tiền."</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Content: Booking Card */}
                    <aside className="w-full lg:w-[360px] relative">
                        <div className="sticky top-[180px] md:top-[200px] space-y-6">
                            {/* Booking Card */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xl bg-white">
                                <div className="bg-[#003580] p-5 text-white">
                                    <p className="text-xs uppercase tracking-widest opacity-80 mb-1">Giá mỗi {priceUnit}</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black">{new Intl.NumberFormat('vi-VN').format(room.price)}₫</span>
                                        {room.originalPrice && room.originalPrice > room.price && (
                                            <span className="text-sm line-through opacity-60 decoration-white/50">{new Intl.NumberFormat('vi-VN').format(room.originalPrice)}₫</span>
                                        )}
                                    </div>
                                    {room.originalPrice && room.originalPrice > room.price && (
                                        <div className="mt-2 inline-block bg-[#ec5b13] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                            Giảm {Math.round(((room.originalPrice - room.price) / room.originalPrice) * 100)}% chỉ hôm nay
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-3">
                                        <hr className="border-slate-100" />
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900 text-sm">Tổng cộng (1 {priceUnit})</span>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-[#ec5b13]">{new Intl.NumberFormat('vi-VN').format(room.price)}₫</p>
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
                                        disabled={room.status === 'sold_out' || (room.availableRooms !== undefined && room.availableRooms <= 0 && room.status !== 'available')}
                                        onClick={() => navigate('/booking', { state: { room } })}
                                        className={`w-full font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider ${
                                            (room.status === 'sold_out' || (room.availableRooms !== undefined && room.availableRooms <= 0 && room.status !== 'available'))
                                            ? 'bg-gray-300 cursor-not-allowed text-gray-500 shadow-none'
                                            : 'bg-[#ec5b13] hover:bg-[#d44d0b] text-white shadow-orange-100 active:scale-95'
                                        }`}
                                    >
                                        { (room.status === 'sold_out' || (room.availableRooms !== undefined && room.availableRooms <= 0 && room.status !== 'available')) ? 'Hết phòng' : 'Tiến hành đặt phòng' }
                                        <span className="material-symbols-outlined font-bold">
                                            {(room.status === 'sold_out' || (room.availableRooms !== undefined && room.availableRooms <= 0 && room.status !== 'available')) ? 'block' : 'arrow_forward'}
                                        </span>
                                    </button>

                                    <div className="bg-gray-50 p-3 rounded-lg flex gap-3 items-start">
                                        <span className="material-symbols-outlined text-blue-500 text-sm">info</span>
                                        <p className="text-[10px] text-gray-400 leading-normal italic">
                                            Bằng cách nhấn "Tiến hành đặt phòng", bạn đồng ý với các điều khoản bảo mật và chính sách đặt phòng của QuickStay.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Map Preview */}
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

            {/* Lightbox / Gallery Modal */}
            {isGalleryOpen && (
                <div 
                    className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
                    onClick={() => setIsGalleryOpen(false)}
                >
                    {/* Close button */}
                    <button 
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
                        onClick={() => setIsGalleryOpen(false)}
                    >
                        <span className="material-symbols-outlined text-4xl">close</span>
                    </button>

                    {/* Image Counter */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white/60 font-medium tracking-widest text-sm uppercase">
                        Hình ảnh {currentImageIdx + 1} / {allImages.length}
                    </div>

                    {/* Main Image Container */}
                    <div className="relative w-full max-w-5xl h-full flex items-center justify-center pointer-events-none">
                        <img 
                            src={allImages[currentImageIdx]} 
                            alt={`Gallery ${currentImageIdx + 1}`}
                            className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300 pointer-events-auto"
                        />

                        {/* Navigation Buttons */}
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

                    {/* Thumbnail Strip (Optional) */}
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
