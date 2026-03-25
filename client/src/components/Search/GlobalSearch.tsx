import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Room, RoomType, IPromotion, ApiResponse } from '../../types';
import Viewdetails from '../booking/Viewdetails';


interface SearchResult {
    rooms: Room[];
    roomTypes: RoomType[];
    promotions: IPromotion[];
}

const GlobalSearch: React.FC = () => {
    const backendUrl = "http://localhost:3000";
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('query') || '';

    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'all' | 'rooms' | 'types' | 'promotions'>('all');
    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);


    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const response = await axios.get<ApiResponse<SearchResult>>(`${backendUrl}/api/search?query=${encodeURIComponent(query)}`);
                if (response.data.success && response.data.data) {
                    setResults(response.data.data);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        if (query) {
            fetchResults();
        } else {
            setResults({ rooms: [], roomTypes: [], promotions: [] });
            setLoading(false);
        }
    }, [query]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

    const isEmpty = results && results.rooms.length === 0 && results.roomTypes.length === 0 && results.promotions.length === 0;

    return (
        <div className="bg-[#f8fafc] min-h-screen pb-20">
            {/* Header info */}
            <div className="bg-[#003580] text-white pt-10 pb-20 px-4 md:px-10">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-black mb-4">Kết quả tìm kiếm cho "{query}"</h1>
                    <p className="text-blue-100 font-medium">Tìm thấy những gì liên quan nhất đến yêu cầu của bạn</p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-10 -mt-10">
                {/* Tabs */}
                <div className="flex bg-white p-2 rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'all' ? 'bg-[#006ce4] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <span className="material-symbols-outlined text-lg">grid_view</span>
                        Tất cả
                    </button>
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'rooms' ? 'bg-[#006ce4] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <span className="material-symbols-outlined text-lg">bed</span>
                        Phòng ({results?.rooms.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('types')}
                        className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'types' ? 'bg-[#006ce4] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <span className="material-symbols-outlined text-lg">category</span>
                        Loại phòng ({results?.roomTypes.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('promotions')}
                        className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'promotions' ? 'bg-[#006ce4] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <span className="material-symbols-outlined text-lg">loyalty</span>
                        Khuyến mãi ({results?.promotions.length || 0})
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-3xl h-64 animate-pulse shadow-sm"></div>
                        ))}
                    </div>
                ) : isEmpty ? (
                    <div className="bg-white rounded-[40px] p-20 text-center shadow-xl border border-gray-100">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 font-black text-4xl text-gray-300">?</div>
                        <h2 className="text-2xl font-black text-[#1a1a1a] mb-2">Không tìm thấy kết quả nào</h2>
                        <p className="text-gray-500 font-medium max-w-md mx-auto">Rất tiếc, chúng tôi không tìm thấy thông tin nào phù hợp với từ khóa "{query}". Hãy thử từ khóa khác nhé!</p>
                        <button onClick={() => navigate('/')} className="mt-8 bg-[#003580] text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all active:scale-95 shadow-lg">Quay về trang chủ</button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Rooms Section */}
                        {(activeTab === 'all' || activeTab === 'rooms') && results && results.rooms.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-[#1a1a1a] flex items-center gap-3">
                                        <span className="w-1.5 h-6 bg-[#006ce4] rounded-full"></span>
                                        Phòng nghỉ
                                    </h2>
                                    <Link to="/rooms" className="text-sm font-black text-[#006ce4] hover:underline">Xem tất cả</Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {results.rooms.map(room => (
                                        <div
                                            key={room._id}
                                            className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                                            onClick={() => {
                                                setSelectedRoom(room);
                                                setShowDetails(true);
                                            }}
                                        >
                                            <div className="h-56 relative overflow-hidden">
                                                <img src={room.thumbnail || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=600'} alt={room.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl font-black text-[#003580] text-[10px] uppercase tracking-widest shadow-lg">
                                                    Phòng {room.name || (room as any).roomNumber}
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{(room.roomType as any)?.name || 'Phòng'}</span>
                                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sẵn sàng</span>
                                                </div>
                                                <h3 className="text-lg font-black text-[#1a1a1a] mb-2 line-clamp-1 group-hover:text-[#006ce4] transition-colors">{room.description}</h3>
                                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                                                    <div>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Giá từ</span>
                                                        <span className="text-xl font-black text-[#1a1a1a]">{formatCurrency(room.price)}₫</span>
                                                        <span className="text-[10px] font-bold text-gray-400">/đêm</span>
                                                    </div>
                                                    <div
                                                        className="w-10 h-10 bg-[#006ce4]/10 rounded-xl flex items-center justify-center text-[#006ce4] group-hover:bg-[#006ce4] group-hover:text-white transition-all underline decoration-transparent"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedRoom(room);
                                                            setShowDetails(true);
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined font-black">arrow_forward</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}


                        {/* Room Types Section */}
                        {(activeTab === 'all' || activeTab === 'types') && results && results.roomTypes.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-[#1a1a1a] flex items-center gap-3">
                                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                                        Loại chỗ nghỉ
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {results.roomTypes.map(type => (
                                        <div
                                            key={type._id}
                                            className="bg-white rounded-[2.5rem] p-4 flex flex-col sm:flex-row gap-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                                            onClick={() => navigate(`/rooms?type=${encodeURIComponent(type.name)}`)}
                                        >

                                            <div className="sm:w-48 h-48 rounded-[2rem] overflow-hidden flex-shrink-0">
                                                <img src={type.image || 'https://images.unsplash.com/photo-1578683062331-edc26359ea62?q=80&w=600'} alt={type.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            </div>
                                            <div className="flex-1 py-4 pr-4">
                                                <h3 className="text-xl font-black text-[#1a1a1a] mb-2">{type.name}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 font-medium">{type.description || 'Thông tin loại phòng chưa cập nhật'}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-wider">Ưu đãi hấp dẫn</span>
                                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">Xem ngay</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Promotions Section */}
                        {(activeTab === 'all' || activeTab === 'promotions') && results && results.promotions.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-[#1a1a1a] flex items-center gap-3">
                                        <span className="w-1.5 h-6 bg-rose-500 rounded-full"></span>
                                        Ưu đãi & Khuyến mãi
                                    </h2>
                                    <Link to="/promotions" className="text-sm font-black text-[#006ce4] hover:underline">Xem tất cả</Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {results.promotions.map(promo => (
                                        <div
                                            key={promo._id}
                                            className="bg-white rounded-[2rem] overflow-hidden border-2 border-dashed border-rose-100 relative group hover:border-rose-300 transition-all flex flex-col"
                                        >
                                            <div className="h-40 bg-rose-50 relative">
                                                <img src={promo.image || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600'} alt={promo.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-rose-600/60 to-transparent"></div>
                                                <div className="absolute bottom-4 left-6">
                                                    <span className="bg-white text-rose-600 px-4 py-1.5 rounded-full font-black text-sm shadow-xl">-{promo.discountPercent}%</span>
                                                </div>
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col">
                                                <h3 className="font-black text-lg text-[#1a1a1a] mb-2 line-clamp-1">{promo.title}</h3>
                                                <p className="text-xs text-gray-500 font-medium mb-6 line-clamp-2">{promo.description}</p>
                                                <div className="mt-auto bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã code</span>
                                                        <span className="font-black text-[#1a1a1a] tracking-widest uppercase">{promo.code}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(promo.code);
                                                            // Could add a toast here
                                                        }}
                                                        className="px-4 py-2 bg-white rounded-xl text-xs font-black shadow-sm hover:shadow-md transition-all border border-gray-100"
                                                    >
                                                        Sao chép
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            {/* View Details Overlay */}
            {showDetails && selectedRoom && (
                <div className="fixed inset-0 z-[100] overflow-y-auto">
                    <Viewdetails
                        room={selectedRoom}
                        onClose={() => {
                            setShowDetails(false);
                            setSelectedRoom(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
};


export default GlobalSearch;
