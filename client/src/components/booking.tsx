import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Room, ApiResponse, UserData } from '../types';

const Booking: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const backendUrl = "http://localhost:3000";

    // Lấy thông tin phòng và người dùng
    const room = location.state?.room as Room;
    const userDataRaw = localStorage.getItem('userData');
    const userData: UserData | null = userDataRaw ? JSON.parse(userDataRaw) : null;

    // State cho form và đặt phòng
    const [customerInfo, setCustomerInfo] = useState({
        name: location.state?.customerInfo?.name || userData?.full_name || '',
        email: location.state?.customerInfo?.email || userData?.email || '',
        phone: location.state?.customerInfo?.phone || userData?.phone || ''
    });

    const [promotionCode, setPromotionCode] = useState(location.state?.promotionCode || '');
    const [discountInfo, setDiscountInfo] = useState(location.state?.discountInfo || { percent: 0, amount: 0 });
    const [isApplyingCode, setIsApplyingCode] = useState(false);
    const [specialRequests, setSpecialRequests] = useState(location.state?.specialRequests || '');

    // State cho ngày đặt phòng
    const [checkIn, setCheckIn] = useState<string>(location.state?.checkIn || new Date().toISOString().split('T')[0]);
    const [checkOut, setCheckOut] = useState<string>(location.state?.checkOut || new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]);
    const [numNights, setNumNights] = useState<number>(location.state?.numNights || 1);
    const [checkInTime, setCheckInTime] = useState<string>(location.state?.checkInTime || 'Tôi chưa biết');
    const [isRoomAvailable, setIsRoomAvailable] = useState<boolean>(true);
    const [checkingAvailability, setCheckingAvailability] = useState<boolean>(false);

    const calculateNights = (start: string, end: string) => {
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diff = d2.getTime() - d1.getTime();
        const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return nights > 0 ? nights : 1;
    };

    useEffect(() => {
        setNumNights(calculateNights(checkIn, checkOut));
    }, [checkIn, checkOut]);

    // Kiểm tra tính khả dụng (trống) của phòng trong thời gian đã chọn
    useEffect(() => {
        const checkAvailability = async () => {
            if (!room || !checkIn || !checkOut) return;
            
            setCheckingAvailability(true);
            try {
                const response = await axios.get(`${backendUrl}/api/rooms/search`, {
                    params: {
                        roomId: room._id || (room as any).id,
                        checkIn,
                        checkOut
                    }
                });
                
                if (response.data.success && response.data.data.length > 0) {
                    const foundRoom = response.data.data[0];
                    setIsRoomAvailable(foundRoom.availableRooms > 0);
                } else {
                    setIsRoomAvailable(false);
                }
            } catch (error) {
                console.error("Error checking availability:", error);
                setIsRoomAvailable(true); 
            } finally {
                setCheckingAvailability(false);
            }
        };

        checkAvailability();
    }, [checkIn, checkOut, room, backendUrl]);

    const getDatesInRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dates = [];
        let current = new Date(start);
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    const timeSlots = [
        'Tôi chưa biết', '00:00 - 01:00', '01:00 - 02:00', '02:00 - 03:00',
        '03:00 - 04:00', '04:00 - 05:00', '05:00 - 06:00', '06:00 - 07:00',
        '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
        '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
        '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00',
        '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00',
        '23:00 - 00:00'
    ];

    const calculateGeniusLevel = (totalRecharged: number): number => {
        if (!totalRecharged || totalRecharged < 100000) return 0;
        if (totalRecharged < 500000) return 1;
        const level = Math.floor(totalRecharged / 500000) + 1;
        return Math.min(level, 10);
    };

    const userGeniusLevel = userData ? calculateGeniusLevel(userData.totalRecharged || 0) : 0;

    const totalAmount = (room?.price || 0) * numNights;
    const finalAmount = totalAmount - discountInfo.amount;

    // Xác định đơn vị tính giá dựa trên loại phòng (ngày/đêm/tiếng/buổi)
    const getPriceUnit = () => {
        const typeName = (room?.roomType || "").toString().toLowerCase();
        if (typeName.includes('karaoke')) return 'tiếng';
        if (typeName.includes('tiệc')) return 'buổi';
        if (typeName.includes('thường') || typeName.includes('vip')) return 'ngày';
        return 'đêm';
    };

    const priceUnit = getPriceUnit();

    useEffect(() => {
        if (!room) {
            toast.error("Không tìm thấy thông tin phòng. Vui lòng chọn lại.");
            navigate('/rooms');
        }
    }, [room, navigate]);

    const handleApplyPromotion = async () => {
        if (!promotionCode.trim()) {
            setDiscountInfo({ percent: 0, amount: 0 });
            toast.info("Đã xóa mã giảm giá");
            return;
        }
        setIsApplyingCode(true);
        try {
            const response = await axios.get<ApiResponse<any>>(`${backendUrl}/api/promotions`);
            if (response.data.success && response.data.data) {
                const now = new Date();
                const promo = response.data.data.find((p: any) => p.code === promotionCode.toUpperCase().trim());

                if (!promo || promo.status !== 'active') {
                    setDiscountInfo({ percent: 0, amount: 0 });
                    toast.error("Mã giảm giá không hợp lệ");
                    return;
                }

                const startDate = new Date(promo.startDate);
                const endDate = new Date(promo.endDate);

                if (now < startDate) {
                    setDiscountInfo({ percent: 0, amount: 0 });
                    toast.error(`Mã giảm giá này bắt đầu có hiệu lực từ ngày ${startDate.toLocaleDateString('vi-VN')}`);
                    return;
                }

                if (now > endDate) {
                    setDiscountInfo({ percent: 0, amount: 0 });
                    toast.error("Mã giảm giá đã hết hạn");
                    return;
                }

                // Kiểm tra cấp độ khách hàng thân thiết (Genius)
                if (promo.minGeniusLevel > userGeniusLevel) {
                    setDiscountInfo({ percent: 0, amount: 0 });
                    toast.error(`Mã này yêu cầu cấp Genius ${promo.minGeniusLevel}. Cấp hiện tại của bạn là ${userGeniusLevel}.`);
                    return;
                }

                // Kiểm tra giới hạn số lượt sử dụng của mã giảm giá
                if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
                    setDiscountInfo({ percent: 0, amount: 0 });
                    toast.error("Mã giảm giá này đã hết lượt sử dụng");
                    return;
                }

                // Kiểm tra xem người dùng hiện tại đã sử dụng mã này chưa
                if (promo.usedBy && userData && promo.usedBy.includes(userData._id || userData.id)) {
                    setDiscountInfo({ percent: 0, amount: 0 });
                    toast.error("Bạn đã sử dụng mã này cho đơn đặt phòng trước đó");
                    return;
                }

                // Kiểm tra xem mã giảm giá có áp dụng cho loại phòng này không
                if (promo.roomTypes && promo.roomTypes.length > 0) {
                    const isApplicableRoom = promo.roomTypes.some((rt: any) => {
                        if (typeof rt === 'string') return rt === room.roomType;
                        return rt.name === room.roomType || rt._id === room.roomType;
                    });
                    
                    if (!isApplicableRoom) {
                        setDiscountInfo({ percent: 0, amount: 0 });
                        toast.error("Mã này không áp dụng cho loại phòng bạn đã chọn");
                        return;
                    }
                }

                if (totalAmount < promo.minOrderValue) {
                    setDiscountInfo({ percent: 0, amount: 0 });
                    toast.error(`Mã này yêu cầu đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(promo.minOrderValue)}₫`);
                    return;
                }

                const amount = (totalAmount * promo.discountPercent) / 100;
                setDiscountInfo({ percent: promo.discountPercent, amount });
                toast.success(`Đã áp dụng mã giảm giá ${promo.discountPercent}%`);
            }
        } catch (error) {
            setDiscountInfo({ percent: 0, amount: 0 });
            toast.error("Lỗi khi kiểm tra mã giảm giá");
        } finally {
            setIsApplyingCode(false);
        }
    };

    const handleConfirmBooking = () => {
        if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
            toast.warning("Vui lòng điền đầy đủ thông tin cá nhân");
            return;
        }

        const paymentState = {
            room,
            customerInfo,
            checkIn,
            checkOut,
            numNights,
            totalAmount,
            discountInfo,
            finalAmount,
            promotionCode,
            specialRequests,
            priceUnit,
            checkInTime
        };

        navigate('/payment', { state: paymentState });
    };

    if (!room) return null;

    return (
        <div className="bg-[#f5f7f8] min-h-screen font-['Inter',_sans-serif] text-slate-900">

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Nút quay lại */}
                <button
                    onClick={() => navigate('/rooms', { state: { openRoom: room } })}
                    className="flex items-center gap-2 text-[#003580] font-black hover:text-[#002a6b] transition-all mb-6 group bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow-md"
                >
                    <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1 text-xl">arrow_back</span>
                    Quay lại trang chi tiết phòng
                </button>

                {/* Thanh tiến trình các bước đặt phòng */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#003580]">Bước 2: Thông tin chi tiết của bạn</span>
                        <span className="text-sm font-medium text-slate-500">Hoàn thành 66%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#003580] h-full w-[66%]"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cột trái: Form nhập thông tin người dùng */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-[#003580]">
                                <span className="material-symbols-outlined text-3xl">person</span>
                                Thông tin của bạn
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Họ và tên</label>
                                    <input
                                        className="w-full rounded-xl border-slate-200 focus:border-[#003580] focus:ring-[#003580] h-14 font-bold"
                                        type="text"
                                        value={customerInfo.name}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Địa chỉ Email</label>
                                    <input
                                        className="w-full rounded-xl border-slate-200 focus:border-[#003580] focus:ring-[#003580] h-14 font-bold"
                                        type="email"
                                        value={customerInfo.email}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Số điện thoại</label>
                                    <input
                                        className="w-full rounded-xl border-slate-200 focus:border-[#003580] focus:ring-[#003580] h-14 font-bold"
                                        type="tel"
                                        value={customerInfo.phone}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-[#003580]">
                                <span className="material-symbols-outlined text-3xl">calendar_month</span>
                                Thời gian lưu trú
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ngày nhận phòng</label>
                                    <input
                                        className="w-full rounded-xl border-slate-200 focus:border-[#003580] focus:ring-[#003580] h-14 font-bold cursor-pointer"
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={checkIn}
                                        onChange={(e) => {
                                            setCheckIn(e.target.value);
                                            if (new Date(e.target.value) >= new Date(checkOut)) {
                                                const nextDay = new Date(e.target.value);
                                                nextDay.setDate(nextDay.getDate() + 1);
                                                setCheckOut(nextDay.toISOString().split('T')[0]);
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ngày trả phòng</label>
                                    <input
                                        className="w-full rounded-xl border-slate-200 focus:border-[#003580] focus:ring-[#003580] h-14 font-bold cursor-pointer"
                                        type="date"
                                        min={new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0]}
                                        value={checkOut}
                                        onChange={(e) => setCheckOut(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                                    <span className="text-sm font-bold text-[#003580]">Tổng thời gian lưu trú:</span>
                                    <span className="text-sm font-black text-[#003580]">{numNights} {priceUnit}</span>
                                </div>
                                {!isRoomAvailable && !checkingAvailability && (
                                    <div className="col-span-2 p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-3 animate-pulse">
                                        <span className="material-symbols-outlined text-rose-500">error</span>
                                        <span className="text-sm font-bold text-rose-600">
                                            Phòng này hôm nay đã đầy. Quý khách hãy chọn thời gian khác
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <label className="block text-sm font-black text-slate-700 mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">schedule</span>
                                    Dự kiến thời gian nhận phòng
                                </label>

                                <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide px-1">
                                    {[new Date(checkIn)].map((date, idx) => {
                                        const dateStr = date.toISOString().split('T')[0];
                                        const isCheckInDay = true; // Chỉ hiển thị ngày nhận phòng hiện tại
                                        const weekDay = date.toLocaleDateString('vi-VN', { weekday: 'short' });
                                        const dayMonth = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                                        return (
                                            <div key={idx} className="relative group flex-shrink-0">
                                                <div
                                                    className={`w-36 p-5 rounded-[2rem] border-2 transition-all cursor-default flex flex-col items-center gap-2 shadow-sm border-[#003580] bg-blue-50/50 ring-4 ring-blue-100`}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{weekDay}</span>
                                                    <span className="text-2xl font-black text-[#003580]">{dayMonth}</span>
                                                    <span className="text-[9px] font-black text-white bg-[#003580] px-3 py-1 rounded-full uppercase">Nhận phòng</span>
                                                    {checkInTime !== 'Tôi chưa biết' && (
                                                        <div className="mt-2 text-[10px] font-black text-emerald-600 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[12px]">done_all</span>
                                                            {checkInTime}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Cửa sổ chọn giờ khi di chuột vào (Popover) */}
                                                <div className="absolute top-[85%] left-0 z-[100] hidden group-hover:block pt-4 animate-in fade-in zoom-in duration-200">
                                                    <div className="w-[380px] bg-white rounded-[2rem] shadow-[0_20px_600px_-15px_rgba(0,0,0,0.3)] border border-slate-100 p-6 relative">
                                                        <div className="absolute -top-2 left-10 w-4 h-4 bg-white rotate-45 border-l border-t border-slate-100"></div>
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="text-xs font-black text-slate-800">Chọn giờ nhận phòng cho ngày {dayMonth}</h4>
                                                            <span className="material-symbols-outlined text-sm text-[#003580]">event_available</span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 text-center">
                                                            {timeSlots.map(time => (
                                                                <button
                                                                    key={time}
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setCheckInTime(time);
                                                                    }}
                                                                    className={`py-3 px-1 text-[10px] font-black rounded-2xl border-2 transition-all ${checkInTime === time
                                                                            ? 'bg-[#003580] text-white border-[#003580] shadow-lg shadow-blue-200'
                                                                            : 'border-slate-50 hover:border-slate-200 text-slate-500 bg-slate-50/50'
                                                                        }`}
                                                                >
                                                                    {time}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-2 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3 items-start">
                                    <span className="material-symbols-outlined text-orange-500 text-lg">info</span>
                                    <p className="text-[11px] text-orange-800 font-medium leading-relaxed italic">
                                        Thời gian nhận phòng sớm có thể phát sinh thêm phí tùy theo quy định của khách sạn.
                                        Chúng tôi sẽ thông báo yêu cầu này đến chỗ nghỉ để ưu tiên sắp xếp cho bạn.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-[#003580]">
                                <span className="material-symbols-outlined text-3xl">edit_note</span>
                                Yêu cầu đặc biệt
                            </h2>
                            <p className="text-sm text-slate-500 mb-6 font-medium italic">Các yêu cầu đặc biệt không thể được đảm bảo – nhưng chỗ nghỉ sẽ cố gắng hết sức để đáp ứng nhu cầu của bạn.</p>
                            <textarea
                                className="w-full rounded-2xl border-slate-200 focus:border-[#003580] focus:ring-[#003580] p-4 min-h-[120px] font-medium"
                                placeholder="Ví dụ: Giường phụ, check-in sớm..."
                                value={specialRequests}
                                onChange={(e) => setSpecialRequests(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    {/* Cột phải: Tóm tắt thông tin đơn hàng */}
                    <div className="space-y-6 text-left">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="relative h-48">
                                <img
                                    src={room.thumbnail || (room as any).avatar || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=600'}
                                    className="w-full h-full object-cover"
                                    alt={room.name}
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                    <h3 className="text-white font-black text-xl">{room.name}</h3>
                                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">{room.roomType}</p>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nhận phòng</p>
                                        <p className="font-bold text-sm">{new Date(checkIn).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trả phòng</p>
                                        <p className="font-bold text-sm">{new Date(checkOut).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Chi tiết giá</h4>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-600">Giá phòng ({numNights} {priceUnit})</span>
                                        <span className="font-bold">{new Intl.NumberFormat('vi-VN').format(totalAmount)}₫</span>
                                    </div>

                                    <div className="pt-4 space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã giảm giá</label>
                                        <div className="flex gap-2">
                                            <input
                                                className="flex-1 rounded-xl border-slate-200 focus:border-[#003580] focus:ring-[#003580] h-12 text-sm font-bold uppercase"
                                                placeholder="NHẬP MÃ"
                                                type="text"
                                                value={promotionCode}
                                                onChange={(e) => setPromotionCode(e.target.value)}
                                            />
                                            <button
                                                onClick={handleApplyPromotion}
                                                disabled={isApplyingCode}
                                                className="bg-[#003580] text-white px-6 py-2 rounded-xl text-xs font-black uppercase hover:bg-blue-900 transition-all disabled:opacity-50"
                                            >
                                                {isApplyingCode ? '...' : 'Áp dụng'}
                                            </button>
                                        </div>
                                    </div>

                                    {discountInfo.amount > 0 && (
                                        <div className="flex justify-between items-center text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                            <span className="text-xs font-black uppercase">Giảm giá ({discountInfo.percent}%)</span>
                                            <span className="font-bold">-{new Intl.NumberFormat('vi-VN').format(discountInfo.amount)}₫</span>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-slate-200 mt-6">
                                        <div className="flex justify-between items-end mb-8">
                                            <div>
                                                <p className="text-xl font-black text-[#003580]">Tổng cộng</p>
                                                <p className="text-[10px] text-slate-400 font-bold italic">Đã bao gồm phí dịch vụ</p>
                                            </div>
                                            <span className="text-3xl font-black text-[#ec5b13]">{new Intl.NumberFormat('vi-VN').format(finalAmount)}₫</span>
                                        </div>

                                        <button
                                            onClick={handleConfirmBooking}
                                            disabled={!isRoomAvailable || checkingAvailability}
                                            className={`w-full font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${
                                                (!isRoomAvailable || checkingAvailability) 
                                                ? 'bg-gray-400 cursor-not-allowed text-white/50' 
                                                : 'bg-[#ec5b13] hover:bg-[#d44d0b] text-white shadow-orange-100 active:scale-95'
                                            }`}
                                        >
                                            {checkingAvailability ? 'Đang kiểm tra...' : !isRoomAvailable ? 'Phòng đã hết chỗ' : 'Xác nhận và Thanh toán'}
                                            <span className="material-symbols-outlined font-black">
                                                {checkingAvailability ? 'sync' : !isRoomAvailable ? 'block' : 'arrow_forward'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-black text-sm mb-4 flex items-center gap-2 text-[#003580]">
                                <span className="material-symbols-outlined text-emerald-500">gavel</span>
                                Chính sách đặt phòng
                            </h3>
                            <ul className="text-xs space-y-3 text-slate-500 font-medium italic">
                                <li className="flex gap-2">
                                    <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                                    <span>Tự động hủy phòng khi quá 12h so với giờ check-in.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                                    <span>Có thể cọc hoặc thanh toán toàn bộ.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Booking;
