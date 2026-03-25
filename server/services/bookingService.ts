import { ClientSession } from "mongoose";
import bookingModel from "../models/bookingModel.ts";
import bookingDetailModel from "../models/bookingDetailModel.ts";
import roomModel from "../models/roomModel.ts";
import promotionModel from "../models/promotionModel.ts";
import userModel from "../models/userModel.ts";
import depositModel from "../models/depositModel.ts";
import { calculateGeniusLevel } from "../utils/bookingUtils.ts";

/**
 * Service: Kiểm tra tính sẵn sàng của phòng (Tránh đặt trùng)
 */
export const checkRoomAvailability = async (
    roomIds: string[],
    targetIn: Date,
    targetOut: Date,
    session?: ClientSession
) => {
    // Tìm các đơn đặt trùng khoảng thời gian
    const overlapping = await bookingModel.find({
        status: { $nin: ['cancelled', 'completed'] }, // lấy các booking còn hiệu lực
        checkInDate: { $lt: targetOut },
        checkOutDate: { $gt: targetIn }
    }).session(session as any);

    const bookedCount: Record<string, number> = {}; // Khởi tạo biến đếm đặt phòng
    if (overlapping.length > 0) {
        const ids = overlapping.map(b => b._id);
        const details = await bookingDetailModel.find({
            bookingId: { $in: ids },
            roomId: { $in: roomIds },
            roomStatus: { $ne: 'cancelled' }
        }).session(session as any);

        for (const d of details) {
            const rid = d.roomId.toString();
            bookedCount[rid] = (bookedCount[rid] || 0) + 1;
        }
    }

    // Kiểm tra từng phòng
    for (const rid of roomIds) {
        const roomDoc = await roomModel.findById(rid).session(session as any);
        if (!roomDoc) throw new Error(`Không tìm thấy phòng: ${rid}`);

        let baseAvail = Number(roomDoc.availableRooms || 0);
        // Fallback: Nếu DB bị lỗi về 0 hoặc âm và thực tế ko ai đặt thì coi như có 1
        if (baseAvail <= 0 && (!bookedCount[rid] || bookedCount[rid] === 0)) {
            baseAvail = 1;
        }

        const booked = bookedCount[rid] || 0;
        if (baseAvail - booked <= 0) {
            throw new Error(`Rất tiếc, phòng ${roomDoc.name} đã hết chỗ trong khoảng thời gian này.`);
        }
    }
};

/**
 * Service: Tính toán giảm giá từ Code khuyến mãi
 */
export const calculateDiscount = async (
    code: string,
    userId: string,
    totalAmt: number,
    firstRoomId: string
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
        const roomDoc = await roomModel.findById(firstRoomId);
        if (!roomDoc || !promotion.roomTypes.some((rt: any) => rt.name === roomDoc.roomType)) return 0;
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
