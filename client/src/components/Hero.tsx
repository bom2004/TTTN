import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../lib/redux/store';
import { fetchAllRoomTypesThunk, selectAllRoomTypes } from '../lib/redux/reducers/room-type';

const Hero: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const allRoomTypes = useAppSelector(selectAllRoomTypes) as any[];
    const roomTypes = allRoomTypes.filter(t => t.isActive);

    // ⚠️ GIỮ NGUYÊN toàn bộ state ban đầu
    const [checkIn, setCheckIn] = useState<string>('');
    const [checkOut, setCheckOut] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [capacity, setCapacity] = useState<string>('');

    useEffect(() => {
        dispatch(fetchAllRoomTypesThunk());
    }, [dispatch]);

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
        <div className="bg-[#003580] pt-8 pb-12 px-4 md:px-10">
            <div className="max-w-7xl mx-auto">
                {/* Title Section - Booking style */}
                <div className="text-center md:text-left mb-8">
                    <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">
                        Tìm chỗ nghỉ tiếp theo
                    </h1>
                    <p className="text-white/80 text-base">
                        Tìm ưu đãi khách sạn, chỗ nghỉ dạng nhà và nhiều hơn nữa...
                    </p>
                </div>

                {/* Search Box - Booking style layout, giữ nguyên logic cũ */}
                <form
                    onSubmit={handleSearch}
                    className="bg-[#febb02] rounded-lg p-1 shadow-lg"
                >
                    <div className="flex flex-col lg:flex-row gap-1">
                        {/* Check-in Date - GIỮ NGUYÊN state và onChange */}
                        <div className="flex-1 bg-white rounded-md px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400 text-xl">calendar_today</span>
                                <div className="flex-1">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase block">Ngày nhận phòng</label>
                                    <input
                                        type="date"
                                        className="w-full outline-none text-sm font-medium"
                                        value={checkIn}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckIn(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Check-out Date - GIỮ NGUYÊN state và onChange */}
                        <div className="flex-1 bg-white rounded-md px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400 text-xl">calendar_month</span>
                                <div className="flex-1">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase block">Ngày trả phòng</label>
                                    <input
                                        type="date"
                                        className="w-full outline-none text-sm font-medium"
                                        value={checkOut}
                                        min={checkIn || new Date().toISOString().split('T')[0]}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckOut(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Room Type Selector - GIỮ NGUYÊN state và onChange */}
                        <div className="flex-1 bg-white rounded-md px-4 py-3 relative">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400 text-xl">bed</span>
                                <div className="flex-1">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase block">Loại chỗ nghỉ</label>
                                    <select
                                        className="w-full outline-none text-sm font-medium bg-transparent appearance-none cursor-pointer"
                                        value={selectedType}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value)}
                                    >
                                        <option value="">Tất cả loại phòng</option>
                                        {roomTypes.map(t => (
                                            <option key={t._id} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-gray-300 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                expand_more
                            </span>
                        </div>

                        {/* Guests/Capacity - GIỮ NGUYÊN state và onChange */}
                        <div className="flex-1 bg-white rounded-md px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400 text-xl">person_add</span>
                                <div className="flex-1">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase block">Số lượng khách</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Ví dụ: 2 người"
                                        className="w-full outline-none text-sm font-medium placeholder:text-gray-300"
                                        value={capacity}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCapacity(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Search Button - GIỮ NGUYÊN type submit */}
                        <button
                            type="submit"
                            className="bg-[#006ce4] text-white font-semibold px-8 py-3 rounded-md hover:bg-[#0057b8] transition-colors flex items-center justify-center gap-2 min-w-[120px]"
                        >
                            <span className="material-symbols-outlined text-lg">search</span>
                            <span>Tìm kiếm</span>
                        </button>
                    </div>
                </form>

                {/* Quick Options - GIỮ NGUYÊN cấu trúc và text */}
                <div className="mt-6 flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                            <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-white/30 rounded bg-white/10 checked:bg-[#006ce4] checked:border-transparent transition-all cursor-pointer" />
                            <span className="material-symbols-outlined absolute text-white text-base scale-0 peer-checked:scale-100 transition-transform pointer-events-none font-black">check</span>
                        </div>
                        <span className="text-white text-sm font-bold group-hover:text-white/100 transition-colors">Tôi đi công tác</span>
                    </label>
                    <div className="flex items-center gap-2 text-white/50">
                        <span className="material-symbols-outlined text-base">verified</span>
                        <span className="text-xs font-medium italic tracking-wide">Giá tốt nhất thị trường - Cam kết hoàn tiền nếu rẻ hơn</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;