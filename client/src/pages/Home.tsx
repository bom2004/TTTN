import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import { useAppDispatch, useAppSelector } from '../lib/redux/store';
import { fetchAllRoomsThunk, selectAllRooms } from '../lib/redux/reducers/room';
import { fetchAllRoomTypesThunk, selectAllRoomTypes } from '../lib/redux/reducers/room-type';
import Viewdetails from '../components/booking/Viewdetails';

const Home: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const rooms = useAppSelector(selectAllRooms);
    const roomTypes = useAppSelector(selectAllRoomTypes);

    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchAllRoomTypesThunk());
        dispatch(fetchAllRoomsThunk());
    }, [dispatch]);

    return (
        <div className='bg-[#f5f5f5] min-h-screen font-sans'>
            <Hero />

            <main className="max-w-7xl mx-auto px-4 md:px-10 py-16">
                {/* Season Offers Section */}
                <section className="mb-20">
                    <div className="mb-10">
                        <h2 className="text-3xl font-[900] text-[#1a1a1a] tracking-tight mb-2">Ưu đãi mùa lễ hội</h2>
                        <p className="text-gray-500 font-medium text-lg">Tiết kiệm từ 15% trở lên khi đặt chỗ và lưu trú trước ngày 3 tháng 1 năm 2025</p>
                    </div>
                    <div className="relative group overflow-hidden rounded-2xl shadow-2xl shadow-blue-900/10">
                        <img
                            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200"
                            className="w-full h-[350px] object-cover transition-transform duration-[2s] group-hover:scale-105"
                            alt="Holiday Season"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center px-12">
                            <div className="max-w-lg">
                                <span className="bg-[#febb02] text-[#003580] px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6 inline-block">Ưu đãi đặc biệt</span>
                                <h3 className="text-white text-4xl font-black mb-6 leading-tight">Mở cửa đón năm mới với nụ cười rạng rỡ</h3>
                                <p className="text-white/80 font-medium mb-10 text-lg leading-relaxed">Khám phá các điểm đến mơ ước và nhận ưu đãi lên đến 30% cho khách hàng thân thiết Genius.</p>
                                <button onClick={() => navigate('/promotions')} className="bg-[#006ce4] text-white px-10 py-4 rounded-xl font-[900] hover:bg-[#0057b8] transition-all transform hover:scale-105 shadow-xl shadow-blue-600/20 active:scale-95">Tìm ưu đãi ngay</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Property Types Section */}
                <section className="mb-20">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <h2 className="text-3xl font-[900] text-[#1a1a1a] tracking-tight mb-2">Tìm kiếm theo loại chỗ nghỉ</h2>
                            <p className="text-gray-500 font-medium text-lg">Đa dạng lựa chọn cho mọi nhu cầu lưu trú của bạn</p>
                        </div>
                        <button onClick={() => navigate('/rooms')} className="bg-white border-2 border-[#006ce4] text-[#006ce4] px-6 py-2.5 rounded-xl font-black hover:bg-blue-50 transition-all uppercase tracking-widest text-[11px]">
                            Xem tất cả danh mục
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {roomTypes.map((type) => (
                            <div
                                key={type._id}
                                onClick={() => {
                                    setSelectedRoom(type);
                                    setIsViewDetailsOpen(true);
                                }}
                                className="group cursor-pointer flex flex-col"
                            >
                                <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4 shadow-xl border border-white">
                                    <img
                                        src={type.image || `https://images.unsplash.com/photo-1541532713595-bc62a751d291?q=80&w=400`}
                                        className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                                        alt={type.name}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                                        <div className="bg-[#febb02] p-2.5 rounded-xl shadow-2xl flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[#003580] text-[20px] font-black">arrow_forward</span>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-[#1a1a1a] font-black text-lg group-hover:text-[#006ce4] transition-colors mb-1">{type.name}</h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                                    {rooms.filter(r => {
                                        const rType = (r as any).roomTypeId || (r as any).roomType;
                                        if (typeof rType === 'string') {
                                            return rType === type.name || rType === type._id;
                                        }
                                        return rType?._id === type._id || rType?.name === type.name;
                                    }).length}+ chỗ nghỉ
                                </p>
                            </div>
                        ))}
                    </div>

                </section>
            </main>

            {/* Lớp phủ hiển thị chi tiết phòng khi được chọn (View Details Overlay) */}
            {isViewDetailsOpen && selectedRoom && (
                <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
                    <Viewdetails
                        room={selectedRoom}
                        onClose={() => {
                            setIsViewDetailsOpen(false);
                            setSelectedRoom(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default Home;
