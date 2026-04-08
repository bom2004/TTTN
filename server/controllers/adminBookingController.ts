import { Request, Response } from "express";
import mongoose from "mongoose";
import { adminUpdateBooking } from "../services/bookingService.ts";
import { emitToUser, emitToAll } from "../socket.ts";
import bookingModel from "../models/bookingModel.ts";
import bookingDetailModel from "../models/bookingDetailModel.ts";

/**
 * Controller: Admin cập nhật toàn bộ thông tin đơn đặt phòng
 * Hỗ trợ: Đổi loại phòng, đổi ngày, thu thêm tiền, đổi trạng thái
 */
export const adminUpdateBookingController = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const id = String(req.params.id);
        const updateData = req.body;

        const updatedBooking = await adminUpdateBooking(id, updateData, String((req as any).user?._id), session);

        await session.commitTransaction();

        // Populate dữ liệu để trả về đầy đủ cho Frontend
        const fullBooking = await bookingModel.findById(updatedBooking._id)
            .populate('userId', 'full_name email phone')
            .populate('roomTypeId');
        
        const details = await bookingDetailModel.find({ bookingId: updatedBooking._id }).populate('roomId');
        const bookingData = { 
            ...fullBooking?.toObject(), 
            details, 
            roomTypeInfo: fullBooking?.roomTypeId 
        };

        // Thông báo qua Socket
        if (fullBooking) {
            emitToUser(String(fullBooking.userId), 'booking_updated', bookingData);
            emitToAll('booking_status_changed', bookingData);
        }

        res.json({
            success: true,
            message: "Cập nhật đơn đặt phòng thành công",
            data: bookingData
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        res.status(500).json({ 
            success: false, 
            message: "Lỗi cập nhật đơn hàng: " + (error as Error).message 
        });
    } finally {
        session.endSession();
    }
};

/**
 * Controller: Thu thêm tiền phát sinh tại quầy
 */
export const adminAddExtraPayment = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const id = String(req.params.id);
        const { amount, paymentMethod, note } = req.body;

        if (!amount || amount <= 0) {
            res.status(400).json({ success: false, message: "Số tiền không lệ." });
            await session.abortTransaction();
            return;
        }

        const booking = await bookingModel.findById(id).session(session);
        if (!booking) {
            res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng." });
            await session.abortTransaction();
            return;
        }

        // Cập nhật thủ công hoặc qua Service
        const currentPaid = booking.paidAmount || 0;
        const newPaid = currentPaid + Number(amount);

        // Gọi lại hàm adminUpdateBooking với chỉ thông tin tiền
        const updatedBooking = await adminUpdateBooking(id, {
            paidAmount: newPaid,
            paymentMethod: paymentMethod || 'cash',
            adminNote: note ? `[THU THÊM] ${note}` : booking.adminNote
        }, String((req as any).user?._id), session);

        await session.commitTransaction();

        res.json({
            success: true,
            message: "Ghi nhận thanh toán bổ sung thành công",
            data: updatedBooking
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        res.status(500).json({ success: false, message: (error as Error).message });
    } finally {
        session.endSession();
    }
};
