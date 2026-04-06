import { ClientSession } from "mongoose";
import bookingModel from "../models/bookingModel.ts";
import bookingDetailModel from "../models/bookingDetailModel.ts";
import roomModel from "../models/roomModel.ts";
import promotionModel from "../models/promotionModel.ts";
import userModel from "../models/userModel.ts";
import depositModel from "../models/depositModel.ts";
import { calculateGeniusLevel } from "../utils/bookingUtils.ts";

/**
 * Service: Kiểm tra tính sẵn sàng của Loại phòng (Inventory-based)
 */
export const checkRoomTypeAvailability = async (
    roomTypeId: string,
    quantity: number,
    targetIn: Date,
    targetOut: Date,
    session?: ClientSession
) => {
    // Tìm các đơn đặt trùng khoảng thời gian
    const overlappingBookings = await bookingModel.find({
        status: { $nin: ['cancelled', 'completed', 'checked_out'] },
        checkInDate: { $lt: targetOut },
        checkOutDate: { $gt: targetIn },
        roomTypeId: roomTypeId
    }).session(session as any);

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
    // Đảm bảo hệ thống vẫn cho phép đặt phòng ngay cả khi chưa tạo danh sách phòng chi tiết
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
    const userLevel = user ? calculateGeniusLevel(user.totalRecharged || 0) : 0;

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

    return (totalAmt * promotion.discountPercent) / 100;
};

/**
 * Service: Xử lý thanh toán qua ví nội bộ
 */
export const chargeWallet = async (
    userId: string,
    amount: number,
    bookingId: string,
    session: ClientSession
) => {
    const user = await userModel.findById(userId).session(session);
    if (!user || user.balance < amount) throw new Error("Số dư tài khoản không đủ.");

    await userModel.findByIdAndUpdate(userId, {
        $inc: { balance: -amount }
    }, { session });

    await depositModel.create([{
        userId,
        amount: -amount,
        txnRef: `BOOKING_${bookingId}`,
        status: 'success'
    }], { session });
};

/**
 * Service: Xử lý hoàn trả tiền vào ví
 */
export const refundToWallet = async (
    userId: string,
    amount: number,
    bookingId: string,
    session: ClientSession,
    type: 'USER_CANCEL' | 'ADM_CANCEL' = 'USER_CANCEL'
) => {
    if (amount <= 0) return;

    await userModel.findByIdAndUpdate(userId, {
        $inc: { balance: amount }
    }, { session });

    const ref = type === 'ADM_CANCEL' ? 'REFUND_ADM_' : 'REFUND_';

    await depositModel.create([{
        userId,
        amount,
        txnRef: `${ref}${bookingId.toString().slice(-6).toUpperCase()}`,
        status: 'success',
    }], { session });
};
