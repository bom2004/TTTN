import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Room } from '../../types';
import { useAppDispatch, useAppSelector } from '../../lib/redux/store';
import { selectAuthUser } from '../../lib/redux/reducers/auth';
import { searchRoomsThunk } from '../../lib/redux/reducers/room';
import { fetchAllPromotionsThunk } from '../../lib/redux/reducers/promotion';

const Booking: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const room = location.state?.room as any;
    const userData = useAppSelector(selectAuthUser);
    const { promotions } = useAppSelector(state => state.promotion);

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
    const todayLocal = new Date().toLocaleDateString('en-CA');
    const tomorrowLocal = new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('en-CA');

    const [checkIn, setCheckIn] = useState<string>(location.state?.checkIn || todayLocal);
    const [checkOut, setCheckOut] = useState<string>(location.state?.checkOut || tomorrowLocal);
    const [availableRoomsCount, setAvailableRoomsCount] = useState<number>((room as any)?.availableRooms || 0);
    const [roomQuantity, setRoomQuantity] = useState<number>(1); // State số lượng phòng
    const [checkInTime, setCheckInTime] = useState<string>(location.state?.checkInTime || 'Tôi chưa biết');
    const [checkingAvailability, setCheckingAvailability] = useState<boolean>(true);
    
    // Biến phái sinh (Derived state) - Không cần quản lý bằng State riêng để tránh render thừa
    const calculateNights = (start: string, end: string) => {
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diff = d2.getTime() - d1.getTime();
        const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return nights > 0 ? nights : 1;
    };
    const numNights = calculateNights(checkIn, checkOut);
    const isRoomAvailable = availableRoomsCount >= roomQuantity;
    const maxQuantity = Math.max(1, Math.min(availableRoomsCount, 10));


    // Chỉ kiểm tra API khi ngày hoặc phòng thay đổi. Số lượng (Quantity) kiểm tra Local.
    useEffect(() => {
        const checkAvailability = async () => {
            if (!room || !checkIn || !checkOut) return;
            setCheckingAvailability(true);
            try {
                const rtId = room.roomTypeId?._id || room.roomTypeId || room._id || (room as any).id;
                const results = await dispatch(searchRoomsThunk({
                    roomId: rtId,
                    checkIn,
                    checkOut
                })).unwrap();

                if (results && results.length > 0) {
                    setAvailableRoomsCount(results[0].availableRooms || 0);
                } else {
                    setAvailableRoomsCount(0);
                }
            } catch (error) {
                console.error("Error checking availability:", error);
                setAvailableRoomsCount(1);
            } finally {
                setCheckingAvailability(false);
            }
        };

        checkAvailability();
    }, [checkIn, checkOut, room?._id, dispatch]);

    const timeSlots = [
        'Tôi chưa biết', '00:00 - 01:00', '01:00 - 02:00', '02:00 - 03:00',
        '03:00 - 04:00', '04:00 - 05:00', '05:00 - 06:00', '06:00 - 07:00',
        '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
        '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
        '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00',
        '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00',
        '23:00 - 00:00'
    ];

    const getMembershipLevel = (totalSpent: number): number => {
        if (!totalSpent || totalSpent < 2000000) return 0; // Silver
        if (totalSpent < 7000000) return 1; // Gold
        if (totalSpent < 12000000) return 2; // Diamond
        return 3; // Platinum
    };

    const getMembershipName = (level: number) => ['Silver', 'Gold', 'Diamond', 'Platinum'][level] || 'Silver';

    const userMembershipLevel = userData ? getMembershipLevel(userData.totalSpent || 0) : 0;

    const totalAmount = ((room?.price || room?.basePrice) || 0) * numNights * roomQuantity;
    const finalAmount = totalAmount - discountInfo.amount;

    const getPriceUnit = () => {
        const typeName = (room?.roomType || room?.name || "").toString().toLowerCase();
        if (typeName.includes('karaoke')) return 'tiếng';
        if (typeName.includes('tiệc')) return 'buổi';
        return 'ngày';
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
            await dispatch(fetchAllPromotionsThunk()).unwrap();
            const now = new Date();
            const promo = promotions.find((p: any) => p.code === promotionCode.toUpperCase().trim());

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

            if (promo.minGeniusLevel > userMembershipLevel) {
                setDiscountInfo({ percent: 0, amount: 0 });
                toast.error(`Mã ưu đãi này chỉ dành cho hạng ${getMembershipName(promo.minGeniusLevel)} trở lên. Hạng của bạn là ${getMembershipName(userMembershipLevel)}.`);
                return;
            }

            if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
                setDiscountInfo({ percent: 0, amount: 0 });
                toast.error("Mã giảm giá này đã hết lượt sử dụng");
                return;
            }

            if (promo.usedBy && userData && promo.usedBy.includes(userData._id || userData.id)) {
                setDiscountInfo({ percent: 0, amount: 0 });
                toast.error("Bạn đã sử dụng mã này cho đơn đặt phòng trước đó");
                return;
            }

            if (promo.roomTypes && promo.roomTypes.length > 0) {
                const isApplicableRoom = promo.roomTypes.some((rt: any) => {
                    const roomIdentifier = room.roomType || room.name;
                    if (typeof rt === 'string') return rt === roomIdentifier;
                    return rt.name === roomIdentifier || rt._id === roomIdentifier;
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

            let amount = (totalAmount * promo.discountPercent) / 100;
            
            // Áp dụng giới hạn tiền giảm tối đa
            if (promo.maxDiscountAmount > 0 && amount > promo.maxDiscountAmount) {
                amount = promo.maxDiscountAmount;
            }

            setDiscountInfo({ percent: promo.discountPercent, amount });
            
            if (promo.maxDiscountAmount > 0 && (totalAmount * promo.discountPercent) / 100 > promo.maxDiscountAmount) {
                toast.success(`Đã áp dụng mã giảm giá. Đạt mức giảm tối đa ${new Intl.NumberFormat('vi-VN').format(promo.maxDiscountAmount)}₫`);
            } else {
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
            checkInTime,
            roomQuantity // Gửi thêm thuộc tính này
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
                                        min={todayLocal}
                                        value={checkIn}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCheckIn(val);
                                            const dIn = new Date(val);
                                            const dOut = new Date(checkOut);
                                            if (dOut <= dIn) {
                                                const nextDay = new Date(dIn);
                                                nextDay.setDate(dIn.getDate() + 1);
                                                setCheckOut(nextDay.toLocaleDateString('en-CA'));
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ngày trả phòng</label>
                                    <input
                                        className="w-full rounded-xl border-slate-200 focus:border-[#003580] focus:ring-[#003580] h-14 font-bold cursor-pointer"
                                        type="date"
                                        min={new Date(new Date(checkIn).getTime() + 86400000).toLocaleDateString('en-CA')}
                                        value={checkOut}
                                        onChange={(e) => setCheckOut(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-emerald-600 text-sm">room_preferences</span>
                                    <span className="text-[13px] font-bold text-emerald-700">
                                        Hiện tại loại phòng này đang còn <span className="font-black text-lg mx-1">{availableRoomsCount}</span> phòng trống trong thời gian này.
                                    </span>
                                </div>
                                <div className="col-span-2 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                                    <span className="text-sm font-bold text-[#003580]">Tổng thời gian lưu trú:</span>
                                    <span className="text-sm font-black text-[#003580]">{numNights} {priceUnit}</span>
                                </div>
                                <div className="col-span-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex items-center justify-between">
                                    <span className="text-sm font-bold text-[#003580]">Số lượng phòng:</span>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={(e) => { e.preventDefault(); setRoomQuantity(Math.max(1, roomQuantity - 1)) }}
                                            className="w-8 h-8 rounded bg-white border border-[#003580] text-[#003580] font-bold flex items-center justify-center hover:bg-blue-50 transition-colors"
                                        >-</button>
                                        <span className="text-sm font-black text-[#003580] w-4 text-center">{roomQuantity}</span>
                                        <button 
                                            onClick={(e) => { e.preventDefault(); setRoomQuantity(Math.min(maxQuantity, roomQuantity + 1)) }}
                                            className="w-8 h-8 rounded bg-white border border-[#003580] text-[#003580] font-bold flex items-center justify-center hover:bg-blue-50 transition-colors"
                                        >+</button>
                                    </div>
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
                                                            {timeSlots.map((time: string) => (
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
                                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">{room.roomType || 'Phòng'}</p>
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
                                        <span className="text-sm font-medium text-slate-600">Giá phòng ({roomQuantity} phòng x {numNights} {priceUnit})</span>
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
                                            className={`w-full font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${(!isRoomAvailable || checkingAvailability)
                                                    ? 'bg-gray-400 cursor-not-allowed text-white/50'
                                                    : 'bg-[#ec5b13] hover:bg-[#d44d0b] text-white shadow-orange-100 active:scale-95'
                                                }`}
                                        >
                                            {checkingAvailability ? 'Đang kiểm tra...' : !isRoomAvailable ? `Chỉ còn ${(room as any)?.availableRooms || 0} phòng trống` : 'Xác nhận và Thanh toán'}
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
                                    <span>Yêu cầu thanh toán cọc 30% để giữ chỗ.</span>
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
