import { ClientSession } from "mongoose";
import bookingModel from "../models/bookingModel.ts";
import bookingDetailModel from "../models/bookingDetailModel.ts";
import roomModel from "../models/roomModel.ts";
import promotionModel from "../models/promotionModel.ts";
import userModel from "../models/userModel.ts";
import { 
    calculateGeniusLevel, 
    normalizeDateToUTC, 
    calculateNumNights 
} from "../utils/bookingUtils.ts";

/**
 * Service: Kiểm tra tính sẵn sàng của Loại phòng (Inventory-based)
 */
export const checkRoomTypeAvailability = async (
    roomTypeId: string,
    quantity: number,
    targetIn: Date,
    targetOut: Date,
    excludeBookingId?: string,
    session?: ClientSession
) => {
    // Tìm các đơn đặt trùng khoảng thời gian, loại ra đơn hàng hiện tại nếu đang sửa đổi
    const query: any = {
        status: { $nin: ['cancelled', 'completed', 'checked_out'] },
        checkInDate: { $lt: targetOut },
        checkOutDate: { $gt: targetIn },
        roomTypeId: roomTypeId
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const overlappingBookings = await bookingModel.find(query).session(session as any);

    let bookedCount = 0;
    if (overlappingBookings.length > 0) {
        for (const b of overlappingBookings) {
            bookedCount += (b.roomQuantity || 1);
        }
    }

    // Lấy thông tin inventory của Loại phòng
    const { default: roomTypeModel } = await import('../models/roomTypeModel.ts');
    const roomTypeDoc = await roomTypeModel.findById(roomTypeId).session(session as any);
    
    if (!roomTypeDoc) throw new Error(`Không tìm thấy loại phòng: ${roomTypeId}`);

    const { default: roomModel } = await import('../models/roomModel.ts');
    
    // Đếm số phòng vật lý thực tế không bị bảo trì
    const physicalRoomsCount = await roomModel.countDocuments({ 
        roomTypeId: roomTypeId, 
        status: { $ne: 'maintenance' } 
    }).session(session as any);

    // Fallback sang totalInventory của RT nếu không có phòng vật lý hoặc số lượng không khớp
    // Đạm bảo hệ thống vẫn cho phép đặt phòng ngay cả khi chưa tạo danh sách phòng chi tiết
    let totalInventory = physicalRoomsCount > 0 ? physicalRoomsCount : (roomTypeDoc.totalInventory || 0);

    if (totalInventory - bookedCount < quantity) {
        throw new Error(`Rất tiếc, loại phòng ${roomTypeDoc.name} chỉ còn trống ${Math.max(0, totalInventory - bookedCount)} phòng trong khoảng thời gian này.`);
    }
};

/**
 * Service: Tính toán giảm giá từ Code khuyến mãi
 */
export const calculateDiscount = async (
    code: string,
    userId: string,
    totalAmt: number,
    roomTypeId: string
) => {
    const promotion = await promotionModel.findOne({ code, status: 'active' }).populate('roomTypes');
    if (!promotion) return 0;

    const now = new Date();
    if (now < promotion.startDate || now > promotion.endDate) return 0;

    const user = await userModel.findById(userId);
    const userLevel = user ? calculateGeniusLevel(user.totalSpent || 0) : 0;

    if (totalAmt < promotion.minOrderValue || userLevel < (promotion.minGeniusLevel || 0)) return 0;

    // Giới hạn lượt dùng và đã dùng chưa
    if ((promotion.usageLimit > 0 && promotion.usedCount >= promotion.usageLimit) || promotion.usedBy.some(id => id.toString() === userId)) return 0;

    // Loại phòng áp dụng
    if (promotion.roomTypes && promotion.roomTypes.length > 0) {
        const { default: roomTypeModel } = await import('../models/roomTypeModel.ts');
        const roomTypeDoc = await roomTypeModel.findById(roomTypeId);
        if (!roomTypeDoc || !promotion.roomTypes.some((rt: any) => rt.name === roomTypeDoc.name || rt._id?.toString() === roomTypeId)) return 0;
    }

    // Áp dụng thành công, cập nhật lượt dùng trong Service này (sử dụng async)
    promotion.usedCount += 1;
    promotion.usedBy.push(userId as any);
    if (promotion.usageLimit > 0 && promotion.usedCount >= promotion.usageLimit) {
        promotion.status = 'expired';
    }
    await promotion.save();

    let discount = (totalAmt * promotion.discountPercent) / 100;
    
    // Áp dụng giới hạn số tiền giảm tối đa (Nếu có)
    if (promotion.maxDiscountAmount > 0 && discount > promotion.maxDiscountAmount) {
        discount = promotion.maxDiscountAmount;
    }

    return discount;
};

/**
 * Service: Tính toán tổng tiền cho đơn đặt phòng
 */
export const calculateBookingTotal = async (
    roomTypeId: string,
    quantity: number,
    checkIn: Date,
    checkOut: Date,
    session?: ClientSession
) => {
    const { default: roomTypeModel } = await import('../models/roomTypeModel.ts');
    const roomType = await roomTypeModel.findById(roomTypeId).session(session as any);
    if (!roomType) throw new Error("Loại phòng không tồn tại.");

    const numNights = calculateNumNights(checkIn, checkOut);
    return roomType.basePrice * quantity * numNights;
};

/**
 * Service: Admin cập nhật thông tin đơn hàng (Nâng cấp hệ thống)
 */
export const adminUpdateBooking = async (
    bookingId: string,
    updateData: any,
    adminId?: string,
    session?: ClientSession
) => {
    const booking = await bookingModel.findById(bookingId).session(session as any);
    if (!booking) throw new Error("Không tìm thấy đơn đặt phòng.");

    const oldStatus = booking.status;

    // Không được phép sửa nếu đã check-out hoặc hoàn thành (Trừ khi admin cấp cao)
    if (['checked_out', 'completed'].includes(booking.status) && updateData.status !== 'completed') {
        throw new Error("Đơn đặt phòng đã hoàn tất, không thể thay đổi thông tin.");
    }

    // 1. Lưu giá gốc nếu đây là lần đầu sửa
    if (!booking.originalAmount) {
        booking.originalAmount = booking.finalAmount;
    }

    const { 
        roomTypeId, roomQuantity, checkInDate, checkOutDate, 
        paidAmount, paymentMethod, status, paymentStatus,
        customerInfo, specialRequests, adminNote, checkInTime
    } = updateData;

    let isInventoryChanged = false;
    const newCheckIn = checkInDate ? normalizeDateToUTC(checkInDate) : booking.checkInDate;
    const newCheckOut = checkOutDate ? normalizeDateToUTC(checkOutDate) : booking.checkOutDate;
    const newRoomTypeId = roomTypeId || booking.roomTypeId;
    const newQuantity = roomQuantity || booking.roomQuantity;

    // Kiểm tra xem có thay đổi các yếu tố ảnh hưởng kho phòng không
    if (
        newCheckIn.getTime() !== booking.checkInDate.getTime() ||
        newCheckOut.getTime() !== booking.checkOutDate.getTime() ||
        String(newRoomTypeId) !== String(booking.roomTypeId) ||
        newQuantity !== booking.roomQuantity
    ) {
        isInventoryChanged = true;
    }

    let forcedPending = false;

    if (isInventoryChanged) {
        // Kiểm tra phòng trống
        await checkRoomTypeAvailability(String(newRoomTypeId), newQuantity, newCheckIn, newCheckOut, String(booking._id), session);
        
        // Nếu đổi loại phòng hoặc ngày → xóa phòng đã gán cũ
        const roomTypeChanged = String(newRoomTypeId) !== String(booking.roomTypeId);
        const checkInChanged = newCheckIn.getTime() !== booking.checkInDate.getTime();
        const checkOutChanged = newCheckOut.getTime() !== booking.checkOutDate.getTime();

        if (roomTypeChanged || checkInChanged || checkOutChanged) {
            booking.assignedRooms = [];
            await bookingDetailModel.deleteMany({ bookingId: booking._id }).session(session as any);

            // Đang 'confirmed' → bắt buộc gán phòng mới → reset về 'pending'
            // Dùng flag để ngăn step 3 ghi đè lại
            if (booking.status === 'confirmed') {
                booking.status = 'pending';
                forcedPending = true;
            }
        }

        booking.checkInDate = newCheckIn;
        booking.checkOutDate = newCheckOut;
        booking.roomTypeId = newRoomTypeId as any;
        booking.roomQuantity = newQuantity;

        const newTotal = await calculateBookingTotal(String(newRoomTypeId), newQuantity, newCheckIn, newCheckOut, session);
        booking.totalAmount = newTotal;
        booking.finalAmount = newTotal - (booking.discountAmount || 0);
    }

    // 2. Xử lý tài chính
    const currentPaid = booking.paidAmount || 0;
    if (paidAmount !== undefined && paidAmount !== currentPaid) {
        const extraAmount = paidAmount - currentPaid;
        if (extraAmount !== 0) {
            booking.paymentHistory.push({
                amount: extraAmount,
                paymentMethod: paymentMethod || 'cash',
                note: extraAmount > 0 ? "Admin thu thêm trực tiếp" : "Admin hoàn trả tiền dư",
                createdAt: new Date()
            });
            booking.paidAmount = paidAmount;
        }
    }

    const finalPaid = booking.paidAmount || 0;
    const finalBill = booking.finalAmount || 0;

    if (finalPaid >= finalBill) {
        booking.paymentStatus = 'paid';
    } else if (finalPaid > 0) {
        booking.paymentStatus = 'deposited';
    } else {
        booking.paymentStatus = 'unpaid';
    }

    // 3. Cập nhật trạng thái và TÍNH HẠNG THÀNH VIÊN
    // forcedPending = true có nghĩa backend đã reset về 'pending' do đổi loại phòng/ngày → KHÔNG cho ghi đè lại
    if (status && !forcedPending) {
        // Nếu chuyển sang COMPLETED lần đầu tiên
        if (status === 'completed' && oldStatus !== 'completed' && booking.userId) {
            import('./userService.ts').then(({ updateUserMembership }) => {
                updateUserMembership(String(booking.userId), booking.finalAmount || 0, session as any).catch(err => {
                    console.error("Failed to update user membership during adminUpdateBooking:", err);
                });
            });
        }
        
        // ĐỒNG BỘ TRẠNG THÁI PHÒNG (Room Model)
        if (status !== oldStatus) {
            const details = await bookingDetailModel.find({ bookingId: booking._id }).session(session as any);
            const roomIds = details.map(d => d.roomId);
            
            if (roomIds.length > 0) {
                let targetRoomStatus = '';
                if (status === 'checked_in') targetRoomStatus = 'occupied';
                else if (['checked_out', 'completed', 'cancelled'].includes(status)) targetRoomStatus = 'available';

                if (targetRoomStatus) {
                    await roomModel.updateMany(
                        { _id: { $in: roomIds }, status: { $ne: 'maintenance' } },
                        { status: targetRoomStatus }
                    ).session(session as any);

                    // Notify via socket (để FE cập nhật sơ đồ phòng)
                    const { emitToAll } = await import('../socket.ts');
                    roomIds.forEach(id => {
                        emitToAll('room_status_changed', { id: String(id), status: targetRoomStatus });
                    });
                }
            }
        }
        
        booking.status = status;
    }

    if (customerInfo) booking.customerInfo = { ...booking.customerInfo, ...customerInfo };
    if (paymentStatus) booking.paymentStatus = paymentStatus; 
    if (checkInTime) booking.checkInTime = checkInTime;
    if (specialRequests !== undefined) booking.specialRequests = specialRequests;
    if (adminNote !== undefined) booking.adminNote = adminNote;

    await booking.save({ session });
    return booking;
};
