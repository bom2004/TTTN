import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RoomType, ApiResponse } from '../types';

const Hero: React.FC = () => {
    const navigate = useNavigate();
    const [checkIn, setCheckIn] = useState<string>('');
    const [checkOut, setCheckOut] = useState<string>('');
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');

    const [capacity, setCapacity] = useState<string>('');

    const backendUrl = "http://localhost:3000";

    useEffect(() => {
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
        fetchInitialData();
    }, []);

    const handleSearch = (e: React.FormEvent): void => {
        e.preventDefault();
        const searchParams = new URLSearchParams();
        if (checkIn) {
            searchParams.append('checkIn', checkIn);
        }
        if (checkOut) {
            searchParams.append('checkOut', checkOut);
        }
        if (selectedType) {
            searchParams.append('type', selectedType);
        }
        if (capacity) {
            searchParams.append('capacity', capacity);
        }
        
        navigate(`/rooms?${searchParams.toString()}`);
    }

    return (
        <div className="bg-[#003580] pb-24 pt-12 px-4 md:px-10 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full -ml-32 -mb-32 blur-2xl"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="max-w-3xl">
                    <h1 className="text-white text-5xl md:text-6xl font-black mb-6 tracking-tighter leading-[1.1]">
                        Tìm chỗ nghỉ tiếp theo
                    </h1>
                    <p className="text-white text-xl md:text-2xl mb-12 font-medium opacity-80 leading-relaxed">
                        Tìm ưu đãi khách sạn, chỗ nghỉ dạng nhà và nhiều hơn nữa...
                    </p>
                </div>

                {/* Search Box Container */}
                <form 
                    onSubmit={handleSearch} 
                    className="bg-[#febb02] p-1 rounded-xl flex flex-col lg:flex-row items-stretch gap-1 shadow-2xl relative"
                >
                    {/* Check-in/out combined look */}
                    <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-1">
                         {/* Check-in Date */}
                        <div className="bg-white rounded-lg flex items-center px-5 py-4 border-2 border-transparent focus-within:border-[#003580] transition-all group">
                            <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#003580] mr-4 text-2xl transition-colors">calendar_today</span>
                            <div className="flex flex-col w-full">
                                <span className="text-[10px] font-[900] text-gray-400 uppercase tracking-[0.2em] mb-0.5">Ngày nhận phòng</span>
                                <input 
                                    type="date" 
                                    className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] font-bold text-base outline-none cursor-pointer p-0 h-6"
                                    value={checkIn}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckIn(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Check-out Date */}
                        <div className="bg-white rounded-lg flex items-center px-5 py-4 border-2 border-transparent focus-within:border-[#003580] transition-all group">
                            <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#003580] mr-4 text-2xl transition-colors">calendar_month</span>
                            <div className="flex flex-col w-full">
                                <span className="text-[10px] font-[900] text-gray-400 uppercase tracking-[0.2em] mb-0.5">Ngày trả phòng</span>
                                <input 
                                    type="date" 
                                    className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] font-bold text-base outline-none cursor-pointer p-0 h-6"
                                    value={checkOut}
                                    min={checkIn || new Date().toISOString().split('T')[0]}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckOut(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Room Type Selector */}
                    <div className="flex-1 bg-white rounded-lg flex items-center px-5 py-4 border-2 border-transparent focus-within:border-[#003580] transition-all group relative cursor-pointer">
                        <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#003580] mr-4 text-2xl transition-colors">bed</span>
                        <div className="flex flex-col w-full overflow-hidden">
                            <span className="text-[10px] font-[900] text-gray-400 uppercase tracking-[0.2em] mb-0.5">Loại chỗ nghỉ</span>
                            <select 
                                className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] font-bold text-base outline-none cursor-pointer truncate appearance-none p-0 h-6"
                                value={selectedType}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value)}
                            >
                                <option value="">Tất cả loại phòng</option>
                                {roomTypes.map(t => (
                                    <option key={t._id} value={t.name}>{t.name}</option>
                                ))}

                            </select>
                        </div>
                        <span className="material-symbols-outlined text-gray-300 absolute right-4 pointer-events-none">expand_more</span>
                    </div>

                    {/* Guests Filter */}
                    <div className="flex-1 bg-white rounded-lg flex items-center px-5 py-4 border-2 border-transparent focus-within:border-[#003580] transition-all group">
                        <span className="material-symbols-outlined text-gray-400 group-focus-within:text-[#003580] mr-4 text-2xl transition-colors">person_add</span>
                        <div className="flex flex-col w-full">
                            <span className="text-[10px] font-[900] text-gray-400 uppercase tracking-[0.2em] mb-0.5">Số lượng khách</span>
                            <input 
                                type="number"
                                min="1"
                                placeholder="Ví dụ: 2 người"
                                className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] font-bold placeholder-gray-300 text-base outline-none p-0 h-6"
                                value={capacity}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCapacity(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Search Button */}
                    <button 
                        type="submit" 
                        className="bg-[#006ce4] text-white text-xl font-[900] px-12 py-4 rounded-lg hover:bg-[#0057b8] transition-all flex items-center justify-center min-w-[140px] shadow-lg shadow-blue-900/20 active:scale-95 group"
                    >
                        <span>Tìm kiếm</span>
                        <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">search</span>
                    </button>
                </form>

                {/* Quick Options */}
                <div className="mt-8 flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                            <input type="checkbox" className="peer appearance-none w-6 h-6 border-2 border-white/30 rounded bg-white/10 checked:bg-[#006ce4] checked:border-transparent transition-all cursor-pointer" />
                            <span className="material-symbols-outlined absolute text-white text-lg scale-0 peer-checked:scale-100 transition-transform pointer-events-none font-black">check</span>
                        </div>
                        <span className="text-white text-sm font-bold group-hover:text-white/100 transition-colors">Tôi đi công tác</span>
                    </label>
                    <div className="flex items-center gap-2 text-white/50">
                        <span className="material-symbols-outlined text-lg">verified</span>
                        <span className="text-xs font-medium italic tracking-wide">Giá tốt nhất thị trường - Cam kết hoàn tiền nếu rẻ hơn</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;