import { Request, Response } from 'express';
import deepseek from '../config/deepseek';
import roomTypeModel, { IRoomType } from '../models/roomTypeModel';
import roomModel from '../models/roomModel';
import bookingModel from '../models/bookingModel';
import { normalizeDateToUTC } from '../utils/bookingUtils';
import { checkRoomTypeAvailability } from '../services/bookingService';
import { generateVNPayPaymentUrl } from '../services/vnpayService';
import { extractDatesFromPrompt, buildAIContext } from '../utils/chatUtils';

/**
 * Controller chính xử lý hội thoại AI
 */
export const askAI = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "No prompt provided" });

        // 1. Chuẩn bị dữ liệu nền
        const roomTypes = await roomTypeModel.find({ isActive: true }) as IRoomType[];
        const rooms = await roomModel.find();
        const { targetStart, targetEnd } = extractDatesFromPrompt(prompt);

        const activeBookings = await bookingModel.find({
            status: { $in: ['pending', 'confirmed', 'checked_in'] },
            checkInDate: { $lt: targetEnd },
            checkOutDate: { $gt: targetStart }
        });

        // 2. Gọi AI
        const context = buildAIContext(roomTypes, rooms, activeBookings, targetStart, targetEnd);
        let result = await deepseek(prompt, context);

        // 3. Xử lý logic đặt phòng nếu AI ra lệnh
        if (result.includes('[ACTION_BOOKING]')) {
            const match = result.match(/\[ACTION_BOOKING\](.*?)\[\/ACTION_BOOKING\]/s);
            if (match && match[1]) {
                const data = JSON.parse(match[1]);
                const rt = roomTypes.find(t => t.name.toLowerCase() === data.roomType.toLowerCase());
                
                if (rt) {
                    const start = normalizeDateToUTC(data.startDate);
                    const end = normalizeDateToUTC(data.endDate);
                    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
                    const totalAmount = rt.basePrice * (data.quantity || 1) * days;

                    try {
                        await checkRoomTypeAvailability(String(rt._id), data.quantity, start, end);
                        
                        // Tự động tìm UserId nếu email trùng khớp với user có sẵn để hiển thị trong "Đặt chỗ của tôi"
                        const userModel = (await import('../models/userModel')).default;
                        const trimmedEmail = (data.email || "").trim().toLowerCase();
                        const existingUser = await userModel.findOne({ 
                            email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') } 
                        });

                        const newBooking = await bookingModel.create({
                            userId: existingUser ? existingUser._id : undefined,
                            customerInfo: { name: data.name, email: data.email, phone: data.phone },
                            roomTypeId: rt._id, roomQuantity: data.quantity,
                            checkInDate: start, checkOutDate: end,
                            totalAmount, finalAmount: totalAmount,
                            status: 'pending', paymentMethod: 'vnpay', source: 'chatbot'
                        });

                        const txnRef = `BK${newBooking._id.toString().slice(-20)}`;
                        newBooking.vnp_TxnRef = txnRef;
                        await newBooking.save();

                        const payUrl = generateVNPayPaymentUrl("AI_BOT", Math.round(totalAmount * 0.3), txnRef, req.ip || "127.0.0.1", `Deposit_${newBooking._id}`);
                        
                        result = result.replace(/\[ACTION_BOOKING\].*?\[\/ACTION_BOOKING\]/gs, "") + 
                                 `\n\n✅ **Đã tạo đơn tạm thời!**\n🔗 [Thanh toán cọc 30% tại đây](${payUrl})`;
                    } catch (err: any) {
                        result = result.replace(/\[ACTION_BOOKING\].*?\[\/ACTION_BOOKING\]/gs, "") + `\n\n❌ **Lỗi:** ${err.message}`;
                    }
                }
            }
        }

        res.status(200).json({ success: true, message: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
