import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { assets, cities } from '../../assets/assets';
import { Room, RoomType, ApiResponse } from '../../types';
import Viewdetails from '../Viewdetails';
import { toast } from 'react-toastify';


const SearchPage: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Khởi tạo các biến trạng thái (State)
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const roomsPerPage = 5;

    // Trạng thái hiển thị Chi tiết phòng (View Details)
    const [selectedRoomForDetails, setSelectedRoomForDetails] = useState<Room | null>(null);
    const [showDetails, setShowDetails] = useState<boolean>(false);

    // Tự động mở chi tiết phòng nếu quay lại từ bước đặt phòng (thông qua state điều hướng)
    useEffect(() => {
        if (location.state?.openRoom) {
            setSelectedRoomForDetails(location.state.openRoom);
            setShowDetails(true);
            // Tùy chọn: xóa trạng thái điều hướng để tránh việc tự động mở lại khi làm mới trang (refresh)
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);


    // Các trạng thái của bộ lọc tìm kiếm (Filters)
    const [query, setQuery] = useState<string>(searchParams.get('query') || '');
    const [capacity, setCapacity] = useState<string>(searchParams.get('capacity') || '');
    const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || '');
    const [checkIn, setCheckIn] = useState<string>(searchParams.get('checkIn') || '');
    const [checkOut, setCheckOut] = useState<string>(searchParams.get('checkOut') || '');
    const [minPrice, setMinPrice] = useState<number>(Number(searchParams.get('minPrice')) || 0);
    const [maxPrice, setMaxPrice] = useState<number>(Number(searchParams.get('maxPrice')) || 5000000);
    const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'newest');

    const fetchInitialData = async (): Promise<void> => {
        try {
            const typesRes = await axios.get<ApiResponse<RoomType[]>>(`${backendUrl}/api/room-types`);
            if (typesRes.data.success && typesRes.data.data) {
                setRoomTypes(typesRes.data.data.filter(t => t.isActive));
            }
        } catch (error) {
            console.error("Error loading types:", error);
        }
    };

    const fetchRooms = async (): Promise<void> => {
        setLoading(true);
        try {
            const params = {
                query: searchParams.get('query') || '',
                capacity: searchParams.get('capacity') || '',
                type: searchParams.get('type') || '',
                checkIn: searchParams.get('checkIn') || '',
                checkOut: searchParams.get('checkOut') || '',
                minPrice: searchParams.get('minPrice') || '0',
                maxPrice: searchParams.get('maxPrice') || '5000000',
                sort: searchParams.get('sort') || 'newest'
            };
            const response = await axios.get<ApiResponse<Room[]>>(`${backendUrl}/api/rooms/search`, { params });
            if (response.data.success && response.data.data) {
                setRooms(response.data.data);
            }
        } catch (error) {
            console.error("Error searching rooms:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        setQuery(searchParams.get('query') || '');
        setCapacity(searchParams.get('capacity') || '');
        setSelectedType(searchParams.get('type') || '');
        setCheckIn(searchParams.get('checkIn') || '');
        setCheckOut(searchParams.get('checkOut') || '');
        setMinPrice(Number(searchParams.get('minPrice')) || 0);
        setMaxPrice(Number(searchParams.get('maxPrice')) || 5000000);
        setSortBy(searchParams.get('sort') || 'newest');

        fetchInitialData();
        fetchRooms();
    }, [searchParams]);


    const handleApplyFilters = (): void => {
        const newParams: Record<string, string> = {};
        if (query) newParams.query = query;
        if (capacity) newParams.capacity = capacity;
        if (selectedType) newParams.type = selectedType;
        if (checkIn) newParams.checkIn = checkIn;
        if (checkOut) newParams.checkOut = checkOut;
        if (minPrice > 0) newParams.minPrice = minPrice.toString();
        if (maxPrice < 5000000) newParams.maxPrice = maxPrice.toString();
        if (sortBy !== 'newest') newParams.sort = sortBy;

        setSearchParams(newParams);
        setShowFilters(false);
        setCurrentPage(1);
    };

    const formatCurrency = (val: number): string => new Intl.NumberFormat('vi-VN').format(val);

    const getRoomTypeName = (roomType: any) => {
        if (!roomType) return 'N/A';
        if (typeof roomType === 'string') {
            // Thử tìm theo ID trước (cho dữ liệu cũ)
            const foundType = roomTypes.find(t => t._id === roomType);
            if (foundType) return foundType.name;
            // Nếu không tìm thấy theo ID, khả năng cao nó chính là tên (dữ liệu mới)
            return roomType;
        }
        return roomType.name || 'N/A';
    };


    const getPriceUnit = (roomType: any) => {
        const typeName = getRoomTypeName(roomType).toLowerCase();
        if (typeName.includes('karaoke')) return 'tiếng';
        if (typeName.includes('tiệc')) return 'buổi';
        if (typeName.includes('thường') || typeName.includes('vip')) return 'ngày';
        return 'đêm';
    };

    const indexOfLastRoom = currentPage * roomsPerPage;
    const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
    const currentRooms = rooms.slice(indexOfFirstRoom, indexOfLastRoom);
    const totalPages = Math.ceil(rooms.length / roomsPerPage);

    return (
        <div className="bg-[#f5f5f5] min-h-screen font-sans">
            {/* Phần tiêu đề Trang (Hero Section) - Cố định ở trên cùng */}
            <section className="bg-[#003580] text-white pt-8 pb-4 px-4 md:px-10">
                <div className="max-w-7xl mx-auto">
                    <nav aria-label="Breadcrumb" className="flex text-sm mb-4 opacity-80">
                        <ol className="flex list-none p-0">
                            <li className="flex items-center">
                                <span className="hover:underline cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
                                <span className="material-symbols-outlined text-sm mx-2">chevron_right</span>
                            </li>
                            <li>Phòng</li>
                        </ol>
                    </nav>
                    <h1 className="text-3xl md:text-4xl font-black mb-2">Tìm kiếm chỗ nghỉ</h1>
                    <p className="text-blue-100 font-medium">Tìm phòng phù hợp với bạn để có kỳ nghỉ tuyệt vời !!!</p>
                </div>
            </section>

            {/* Thanh Tìm kiếm & Lọc (Search & Filter Bar) - Cố định khi cuộn trang */}
            <div className="bg-[#003580] px-4 md:px-10 py-6 sticky top-[75px] z-40 shadow-xl border-t border-white/10">
                <div className="max-w-7xl mx-auto">

                    {/* Thanh Tìm kiếm & Bộ lọc (Search Bar & Filters) */}
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }}
                        className="bg-[#febb02] p-1 rounded-xl flex flex-col gap-1"
                    >
                        {/* Dòng Tìm kiếm Chính (Main Search Row) */}
                        <div className="flex flex-col lg:flex-row items-stretch gap-1">
                            <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-3 border-2 border-transparent focus-within:border-[#003580] transition-all group">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#003580] mr-3">search</span>
                                <input
                                    type="text"
                                    placeholder="Gõ số phòng hoặc địa điểm..."
                                    className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] font-bold text-sm outline-none placeholder-gray-300 h-6"
                                    value={query}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                                />
                            </div>

                            <div className="lg:w-48 bg-white rounded-lg flex items-center px-4 py-3 border-2 border-transparent focus-within:border-[#003580] transition-all group">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#003580] mr-2 text-xl">calendar_today</span>
                                <div className="flex flex-col w-full">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Nhận phòng</span>
                                    <input
                                        type="date"
                                        className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] font-bold text-xs outline-none cursor-pointer h-4"
                                        value={checkIn}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckIn(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="lg:w-48 bg-white rounded-lg flex items-center px-4 py-3 border-2 border-transparent focus-within:border-[#003580] transition-all group">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#003580] mr-2 text-xl">calendar_month</span>
                                <div className="flex flex-col w-full">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Trả phòng</span>
                                    <input
                                        type="date"
                                        className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] font-bold text-xs outline-none cursor-pointer h-4"
                                        value={checkOut}
                                        min={checkIn}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckOut(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="lg:w-40 bg-white rounded-lg flex items-center px-4 py-3 border-2 border-transparent focus-within:border-[#003580] transition-all group">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#003580] mr-2 text-xl">group</span>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Khách"
                                    className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] font-bold text-sm outline-none placeholder-gray-300 h-6"
                                    value={capacity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCapacity(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                className="bg-[#006ce4] text-white font-black px-10 py-3 rounded-lg hover:bg-[#0057b8] transition-all text-sm shadow-lg active:scale-95"
                            >
                                Tìm
                            </button>
                        </div>

                        {/* Dòng Bộ lọc mở rộng (Filters Row) */}
                        <div className="flex flex-col lg:flex-row items-stretch gap-1">
                            <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-3 border-2 border-transparent focus-within:border-[#003580] transition-all group">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#003580] mr-2 text-xl">bed</span>
                                <select
                                    className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] font-bold text-sm outline-none cursor-pointer"
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                >
                                    <option value="">Tất cả loại chỗ nghỉ</option>
                                    {roomTypes.map(t => (
                                        <option key={t._id} value={t.name}>{t.name}</option>
                                    ))}

                                </select>
                            </div>

                            <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-3 border-2 border-transparent focus-within:border-[#003580] transition-all group">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#003580] mr-2 text-xl">request_quote</span>
                                <div className="flex flex-col w-full">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Giá tối thiểu (₫)</span>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] font-bold text-sm outline-none placeholder-gray-300 h-5"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-3 border-2 border-transparent focus-within:border-[#003580] transition-all group">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#003580] mr-2 text-xl">payments</span>
                                <div className="flex flex-col w-full">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Giá tối đa (₫)</span>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] font-bold text-sm outline-none placeholder-gray-300 h-5"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-3 border-2 border-transparent focus-within:border-[#003580] transition-all group">
                                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#003580] mr-2 text-xl">sort</span>
                                <select
                                    className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] font-bold text-sm outline-none cursor-pointer"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="newest">Sắp xếp: Mới nhất</option>
                                    <option value="price_asc">Giá: Thấp đến Cao</option>
                                    <option value="price_desc">Giá: Cao đến Thấp</option>
                                    <option value="popular">Phổ biến nhất</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-10 py-10">
                <div className="w-full">
                    {/* Nội dung kết quả tìm kiếm (Results Content) */}
                    <div className="w-full">
                        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-[900] text-[#003580] tracking-tight">
                                    {loading ? 'Đang tìm kiếm...' : `${rooms.length} chỗ nghỉ được tìm thấy`}
                                </h1>
                                {!loading && (
                                    <div className="flex items-center gap-4 mt-2">
                                        <p className="text-gray-500 font-medium">{query || 'Toàn bộ địa điểm'} • {selectedType || 'Tất cả loại phòng'} • {capacity || '1'} khách</p>

                                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                        <p className="text-[#006ce4] font-black text-sm cursor-pointer hover:underline">Hiển thị trên bản đồ</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Danh sách các Thẻ phòng (Room Cards List) */}
                        {loading ? (
                            <div className="space-y-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white rounded-2xl h-[280px] border border-gray-100 animate-pulse w-full"></div>
                                ))}
                            </div>
                        ) : rooms.length > 0 ? (
                            <>
                                <div className="space-y-6">
                                    {currentRooms.map((room) => (
                                        <div
                                            key={room._id}
                                            className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col md:flex-row hover:shadow-2xl transition-all duration-500 cursor-pointer group relative"
                                            onClick={() => {
                                                // if (!checkIn || !checkOut) {
                                                //     toast.warn("Vui lòng nhập Ngày Nhận và Trả phòng trên thanh tìm kiếm để tiếp tục", { position: "top-center" });
                                                //     return;
                                                // }
                                                setSelectedRoomForDetails(room);
                                                setShowDetails(true);
                                            }}
                                        >

                                            {/* Container chứa hình ảnh phòng */}
                                            <div className="md:w-[320px] h-64 md:h-auto flex-shrink-0 relative overflow-hidden">
                                                <img
                                                    src={room.thumbnail || (room as any).avatar || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=600'}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
                                                    alt={room.name || (room as any).roomNumber}
                                                />

                                                {/* Các nhãn đặc biệt (Top Badges) */}
                                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                    <span className="bg-[#febb02] text-[#003580] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">bolt</span>
                                                        Giá rẻ nhất
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={e => { e.stopPropagation(); }}
                                                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all shadow-xl hover:scale-110"
                                                >
                                                    <span className="material-symbols-outlined text-[20px] font-black">favorite</span>
                                                </button>
                                            </div>

                                            {/* Container chứa chi tiết thông tin phòng */}
                                            <div className="flex-1 p-6 flex flex-col justify-between">
                                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-xs font-black text-[#006ce4] bg-[#006ce4]/5 px-3 py-1 rounded-full uppercase tracking-widest">
                                                                {getRoomTypeName(room.roomType)}
                                                            </span>
                                                            <div className="flex items-center gap-0.5 text-amber-500">
                                                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="material-symbols-outlined text-sm font-black">star</span>)}
                                                            </div>
                                                        </div>

                                                        <h3 className="text-2xl font-[900] text-[#1a1a1a] mb-2 group-hover:text-[#006ce4] transition-colors flex items-center gap-3">
                                                            {room.name || `Phòng ${(room as any).roomNumber}`}
                                                            <span className="material-symbols-outlined text-[#006ce4] text-xl">verified</span>
                                                        </h3>

                                                        <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-500 mb-6">
                                                            {/* Ẩn số lượng phòng trống theo yêu cầu của người dùng để tránh hiển thị trạng thái cụ thể với khách */}
                                                            <span className="flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-gray-400 text-lg">aspect_ratio</span>
                                                                {room.size}m²
                                                            </span>

                                                            <span className="flex items-center gap-2 text-emerald-600">
                                                                <span className="material-symbols-outlined text-lg">wifi</span>
                                                                WiFi miễn phí
                                                            </span>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-emerald-700 text-sm font-black">
                                                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                                                Dễ dàng hủy phòng • Thanh toán tại chỗ nghỉ
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Nhãn Đánh giá - Phía bên phải (Rating box) */}
                                                    <div className="flex md:flex-col items-end gap-2 text-right">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-[900] text-[#1a1a1a]">Rất tốt</span>
                                                                <span className="text-[10px] text-gray-400 font-bold">1,245 đánh giá</span>
                                                            </div>
                                                            <div className="bg-[#003580] text-white w-10 h-10 rounded-lg flex items-center justify-center font-black rounded-bl-none shadow-lg">9.2</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Thanh Giá cả & Nút hành động phía dưới (Bottom Price & CTA Bar) */}
                                                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-end justify-between gap-6">
                                                    <div className="flex-1">
                                                        {!localStorage.getItem('token') && (
                                                            <>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="material-symbols-outlined text-[#006ce4] text-lg">auto_awesome</span>
                                                                    <span className="text-xs font-black text-[#006ce4] uppercase tracking-widest">Ưu đãi Genius</span>
                                                                </div>
                                                                <p className="text-xs text-emerald-600 font-bold italic leading-relaxed">Đăng nhập để tiết kiệm thêm 10% tại chỗ nghỉ này với tài khoản Genius của bạn.</p>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Giá cho 1 {getPriceUnit(room.roomType)}</p>
                                                        <div className="flex items-end gap-2 mb-4">
                                                            {room.originalPrice && room.originalPrice > room.price && (
                                                                <span className="text-sm font-bold text-gray-400 line-through mb-1">{formatCurrency(room.originalPrice)}₫</span>
                                                            )}
                                                            <span className="text-3xl font-[900] text-[#1a1a1a]">{formatCurrency(room.price)}₫</span>
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // if (!checkIn || !checkOut) {
                                                                //     toast.warn("Vui lòng nhập Ngày Nhận và Trả phòng trên thanh tìm kiếm để tiếp tục", { position: "top-center" });
                                                                //     return;
                                                                // }
                                                                setSelectedRoomForDetails(room);
                                                                setShowDetails(true);
                                                            }}
                                                            className="bg-[#006ce4] hover:bg-[#0057b8] text-white font-black text-sm px-10 py-4 rounded-xl transition-all shadow-xl shadow-blue-900/10 transform hover:scale-105 active:scale-95 flex items-center gap-3"
                                                        >
                                                            Xem tình trạng phòng
                                                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                                        </button>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Bộ điều khiển phân trang (Pagination Controls) */}
                                {totalPages > 1 && (
                                    <div className="mt-10 flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-[#006ce4] hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-10 h-10 rounded-xl font-black text-sm transition-all flex items-center justify-center
                                                ${currentPage === page
                                                        ? 'bg-[#006ce4] text-white shadow-lg shadow-blue-900/20'
                                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-[#006ce4] hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                                        </button>
                                    </div>
                                )}
                            </>

                        ) : (
                            <div className="bg-white rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center py-32 text-center px-6">
                                <div className="w-24 h-24 bg-[#003580]/5 rounded-full flex items-center justify-center mb-8">
                                    <span className="material-symbols-outlined text-[#003580]/20 text-6xl">travel_explore</span>
                                </div>
                                <h3 className="text-3xl font-black text-[#003580] mb-4">Mọi thứ đều kín chỗ!</h3>
                                <p className="text-gray-400 max-w-md text-lg font-medium mb-12 leading-relaxed">Không tìm thấy chỗ nghỉ nào phù hợp với bộ lọc của bạn. Hãy thử thay đổi ngày hoặc xả bớt bộ lọc để thấy thêm kết quả.</p>
                                <button
                                    onClick={() => { setQuery(''); setCapacity(''); setSelectedType(''); setCheckIn(''); setCheckOut(''); setMinPrice(0); setMaxPrice(5000000); setSortBy('newest'); handleApplyFilters(); }}
                                    className="bg-[#003580] text-white px-12 py-4 rounded-xl font-black text-base hover:bg-[#002a6b] transition-all shadow-2xl shadow-blue-900/20 active:scale-95"
                                >
                                    Cài đặt lại toàn bộ bộ lọc
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Lớp phủ hiển thị chi tiết phòng khi được chọn (View Details Overlay) */}
            {showDetails && selectedRoomForDetails && (
                <div className="fixed inset-0 z-[100] overflow-y-auto">
                    <Viewdetails
                        room={selectedRoomForDetails}
                        onClose={() => {
                            setShowDetails(false);
                            setSelectedRoomForDetails(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
};


export default SearchPage;

