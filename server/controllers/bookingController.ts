import { Request, Response } from "express";
import mongoose from "mongoose";
import bookingModel from "../models/bookingModel.ts";
import bookingDetailModel from "../models/bookingDetailModel.ts";
import { 
    normalizeDateToUTC, 
    calculateNumNights 
} from "../utils/bookingUtils.ts";
import { 
    checkRoomAvailability, 
    calculateDiscount, 
    chargeWallet, 
    refundToWallet 
} from "../services/bookingService.ts";

/**
 * Controller: Tạo đơn đặt phòng mới
 */
export const createBooking = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { 
            userId, customerInfo, checkInDate, checkOutDate, 
            rooms, promotionCode, paymentMethod, paidAmount,
            checkInTime, specialRequests 
        } = req.body;

        if (!userId || !rooms || rooms.length === 0 || !checkInDate || !checkOutDate) {
            res.status(400).json({ success: false, message: "Thiếu thông tin đặt phòng bắt buộc." });
            return;
        }

        // 1. Tính toán đêm và số tiền gốc
        const targetCheckIn = normalizeDateToUTC(checkInDate);
        const targetCheckOut = normalizeDateToUTC(checkOutDate);
        const numNights = calculateNumNights(targetCheckIn, targetCheckOut);
        const totalAmount = rooms.reduce((sum: number, r: any) => sum + r.price, 0) * numNights;

        // 2. Kiểm tra tính sẵn sàng (Trường hợp đặt trùng)
        await checkRoomAvailability(rooms.map((r: any) => r.roomId), targetCheckIn, targetCheckOut, session);

        // 3. Xử lý khuyến mãi thông qua Service
        let discountAmount = 0;
        if (promotionCode) {
            discountAmount = await calculateDiscount(promotionCode as string, userId, totalAmount, rooms[0].roomId);
        }

        const finalAmount = totalAmount - discountAmount;

        // 4. Tạo bản ghi Booking
        const newBooking = new bookingModel({
            userId, customerInfo, checkInDate, checkOutDate,
            totalAmount, discountAmount, finalAmount,
            promotionCode: discountAmount > 0 ? (promotionCode || "") : "",
            status: req.body.status || 'pending',
            paymentStatus: req.body.paymentStatus || 'unpaid',
            paymentMethod: paymentMethod || 'vnpay',
            paidAmount: paidAmount || 0,
            checkInTime: checkInTime || "Tôi chưa biết",
            specialRequests: specialRequests || ""
        });

        const savedBooking = await newBooking.save({ session });

        // 5. Tạo các bản ghi BookingDetail cho từng phòng
        const bookingDetails = rooms.map((room: any) => ({
            bookingId: savedBooking._id,
            roomId: room.roomId,
            price: room.price,
            roomStatus: 'waiting'
        }));

        await bookingDetailModel.insertMany(bookingDetails, { session });

        // 6. Thanh toán qua ví (Nếu có)
        if (paymentMethod === 'wallet' && paidAmount > 0) {
            await chargeWallet(userId, paidAmount, String(savedBooking._id), session);
        }

        await session.commitTransaction();
        res.status(201).json({ success: true, message: "Tạo đơn đặt phòng thành công", data: savedBooking });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: "Lỗi tạo đơn đặt phòng: " + (error as Error).message });
    } finally {
        session.endSession();
    }
};

/**
 * Controller: Lấy danh sách toàn bộ đơn hàng (Admin/Staff)
 */
export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const bookings = await bookingModel.find().populate('userId', 'full_name email').sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Lấy danh sách đơn hàng của một người dùng (Customer)
 */
export const getUserBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const bookings = await bookingModel.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        const populatedBookings = await Promise.all(
            bookings.map(async (booking) => {
                const details = await bookingDetailModel.find({ bookingId: booking._id }).populate('roomId');
                return { ...booking.toObject(), details };
            })
        );
        res.json({ success: true, data: populatedBookings });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Lấy chi tiết đơn hàng theo ID
 */
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
    try {
        const booking = await bookingModel.findById(req.params.id).populate('userId', 'full_name email phone');
        if (!booking) {
            res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
            return;
        }
        const details = await bookingDetailModel.find({ bookingId: booking._id }).populate('roomId');
        res.json({ success: true, data: { ...booking.toObject(), details } });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Cập nhật trạng thái đơn (Check-in, Check-out, Hủy bởi Admin)
 */
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, paymentStatus } = req.body;
        const oldBooking = await bookingModel.findById(req.params.id);
        if (!oldBooking) {
            res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
            return;
        }

        const booking = await bookingModel.findByIdAndUpdate(
            req.params.id, 
            { status, paymentStatus: paymentStatus || oldBooking.paymentStatus }, 
            { returnDocument: 'after' }
        );

        // Đồng bộ trạng thái phòng
        let detailStatus = 'waiting';
        if (status === 'checked_in') detailStatus = 'checked_in';
        else if (['checked_out', 'completed'].includes(status)) detailStatus = 'checked_out';
        else if (status === 'cancelled') detailStatus = 'cancelled';

        if (detailStatus !== 'waiting') {
            await bookingDetailModel.updateMany({ bookingId: req.params.id }, { roomStatus: detailStatus });
        }

        // Logic Hoàn tiền nếu Admin hủy trong 6 tiếng đầu
        if (status === 'cancelled' && oldBooking.status !== 'cancelled') {
            const diffInHours = (new Date().getTime() - new Date(oldBooking.createdAt).getTime()) / (1000 * 60 * 60);
            if (diffInHours <= 6 && (oldBooking.paidAmount || 0) > 0) {
                const session = await mongoose.startSession();
                await session.withTransaction(async () => {
                    await refundToWallet(String(oldBooking.userId), oldBooking.paidAmount || 0, String(oldBooking._id), session, 'ADM_CANCEL');
                });
                session.endSession();
            }
        }

        res.json({ success: true, message: "Cập nhật thành công", data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Hủy đơn đặt phòng bởi người dùng (Quy tắc 6 tiếng)
 */
export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const booking = await bookingModel.findById(id).session(session);

        if (!booking || booking.status === 'cancelled') {
            res.status(400).json({ success: false, message: "Đơn đặt phòng không hợp lệ hoặc đã được hủy trước đó" });
            await session.abortTransaction();
            return;
        }

        // Kiểm tra điều kiện thời hạn 6 tiếng
        const diffInHours = (new Date().getTime() - new Date(booking.createdAt).getTime()) / (1000 * 60 * 60);
        if (diffInHours > 6) {
            res.status(400).json({ success: false, message: "Đã quá thời hạn 6 tiếng để có thể tự hủy đơn hàng." });
            await session.abortTransaction();
            return;
        }

        // Thực hiện hoàn trả thông qua Service
        if ((booking.paidAmount || 0) > 0) {
            await refundToWallet(String(booking.userId), booking.paidAmount || 0, String(booking._id), session, 'USER_CANCEL');
        }

        // Cập nhật trạng thái hủy
        booking.status = 'cancelled';
        await booking.save({ session });
        await bookingDetailModel.updateMany({ bookingId: id }, { roomStatus: 'cancelled' }).session(session);

        await session.commitTransaction();
        res.json({ success: true, message: "Hủy đơn hàng thành công" });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: (error as Error).message });
    } finally {
        session.endSession();
    }
};

/**
 * Controller: Xóa đơn đặt phòng khỏi database (Admin Cleanup)
 */
export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        const bookingId = req.params.id;
        const deleted = await bookingModel.findByIdAndDelete(bookingId);
        if (!deleted) {
            res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
            return;
        }
        await bookingDetailModel.deleteMany({ bookingId: bookingId });
        res.json({ success: true, message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};
