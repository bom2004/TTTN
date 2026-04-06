import { Request, Response } from "express";
import mongoose from "mongoose";
import bookingModel from "../models/bookingModel.ts";
import bookingDetailModel from "../models/bookingDetailModel.ts";
import {
    normalizeDateToUTC,
    calculateNumNights
} from "../utils/bookingUtils.ts";
import {
    checkRoomTypeAvailability,
    calculateDiscount,
    chargeWallet,
    refundToWallet
} from "../services/bookingService.ts";
import { generateVNPayPaymentUrl } from "../services/vnpayService.ts";
import { emitToUser, emitToAll } from "../socket.ts";

/**
 * Controller: Tạo đơn đặt phòng mới
 */
export const createBooking = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            userId, customerInfo, checkInDate, checkOutDate,
            roomTypeId, roomQuantity, promotionCode, paymentMethod, paidAmount,
            checkInTime, specialRequests
        } = req.body;

        if (!roomTypeId || !roomQuantity || !checkInDate || !checkOutDate) {
            res.status(400).json({ success: false, message: "Thiếu thông tin đặt phòng bắt buộc." });
            return;
        }

        // 1. Lấy thông tin giá gốc từ roomTypeId thay vì mảng rooms
        const { default: roomTypeModel } = await import('../models/roomTypeModel.ts');
        const roomTypeDoc = await roomTypeModel.findById(roomTypeId).session(session);
        if (!roomTypeDoc) {
            res.status(404).json({ success: false, message: "Loại phòng không tồn tại." });
            return;
        }

        const targetCheckIn = normalizeDateToUTC(checkInDate);
        const targetCheckOut = normalizeDateToUTC(checkOutDate);

        // 1. RÀNG BUỘC NGÀY THÁNG (Validation): Đảm bảo dữ liệu không phải "rác"
        const today = normalizeDateToUTC(new Date());
        
        if (targetCheckIn < today) {
            res.status(400).json({ success: false, message: "Ngày nhận phòng không thể ở trong quá khứ." });
            return;
        }

        if (targetCheckOut <= targetCheckIn) {
            res.status(400).json({ success: false, message: "Ngày trả phòng phải diễn ra sau ngày nhận phòng ít nhất 1 đêm." });
            return;
        }

        const numNights = calculateNumNights(targetCheckIn, targetCheckOut);

        // Tính tổng tiền dựa trên basePrice của roomType và số lượng phòng
        const totalAmount = roomTypeDoc.basePrice * numNights * roomQuantity;

        // 2. Xử lý khuyến mãi thông qua Service (ngoài transaction để tránh write conflict)
        let discountAmount = 0;
        if (promotionCode) {
            discountAmount = await calculateDiscount(promotionCode as string, userId, totalAmount, roomTypeId);
        }

        const finalAmount = totalAmount - discountAmount;
        const totalPaid = Number(paidAmount) || 0;
        const actualPaymentMethod = paymentMethod || 'vnpay';

        // 3. KIỂM TRA TÍNH KHẢ DỤNG TRƯỚC KHI LƯU (Check trước để fail-fast)
        // Thực hiện trong session để có read-consistent view, KHÔNG update roomType ở bước riêng
        await checkRoomTypeAvailability(roomTypeId, roomQuantity, targetCheckIn, targetCheckOut, session);

        // 4. Tạo bản ghi Booking với ngày đã được chuẩn hóa
        // Dùng _id của newBooking (đã có ngay khi khởi tạo) làm TxnRef để đảm bảo nhất quán
        const newBooking = new bookingModel({
            userId, customerInfo, checkInDate: targetCheckIn, checkOutDate: targetCheckOut,
            roomTypeId, roomQuantity, assignedRooms: [],
            totalAmount, discountAmount, finalAmount,
            promotionCode: discountAmount > 0 ? (promotionCode || "") : "",
            status: req.body.status || 'pending',
            paymentStatus: req.body.paymentStatus || 'unpaid',
            paymentMethod: actualPaymentMethod,
            paidAmount: actualPaymentMethod === 'vnpay' ? 0 : totalPaid,
            checkInTime: checkInTime || "Tôi chưa biết",
            specialRequests: specialRequests || ""
        });

        // Gán TxnRef dựa trên _id thực của booking (đã có sẵn trước khi save)
        if (actualPaymentMethod === 'vnpay') {
            newBooking.vnp_TxnRef = `BK${newBooking._id.toString().slice(-22)}`;
        } else {
            newBooking.vnp_TxnRef = "";
        }

        const savedBooking = await newBooking.save({ session });

        // 6. Xử lý thanh toán
        let paymentUrl = "";
        console.log(`Payment processing for booking ${savedBooking._id}: method=${paymentMethod}, amount=${totalPaid}`);
        
        if (paymentMethod === 'wallet' && totalPaid > 0) {
            await chargeWallet(userId, totalPaid, String(savedBooking._id), session);
        } else if (paymentMethod === 'vnpay' && totalPaid > 0) {
            // Tạo URL VNPay cho đơn đặt phòng
            const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';
            
            paymentUrl = generateVNPayPaymentUrl(
                String(userId), 
                totalPaid, 
                savedBooking.vnp_TxnRef || `BK${savedBooking._id.toString().slice(-22)}`, 
                ipAddr,
                `Thanh toan don phong ${savedBooking._id}`
            );
            console.log(`Generated VNPay URL for booking ${savedBooking._id}: ${paymentUrl}`);
        }

        await session.commitTransaction();

        // Emit socket events
        if (paymentMethod !== 'vnpay') {
            emitToAll('booking_created', savedBooking);
        }
        emitToUser(String(userId), 'booking_updated', savedBooking);

        res.status(201).json({ 
            success: true, 
            message: "Tạo đơn đặt phòng thành công", 
            data: savedBooking,
            paymentUrl: paymentUrl // Trả về URL nếu thanh toán VNPay trực tiếp
        });

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
        const bookings = await bookingModel.find()
            .populate('userId', 'full_name email')
            .populate('roomTypeId')
            .sort({ createdAt: -1 });
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

                // Populate thêm thông tin loại phòng
                const populatedBooking = await bookingModel.findById(booking._id).populate('roomTypeId');

                return {
                    ...booking.toObject(),
                    details,
                    roomTypeInfo: populatedBooking?.roomTypeId
                };
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
        const booking = await bookingModel.findById(req.params.id)
            .populate('userId', 'full_name email phone')
            .populate('roomTypeId');

        if (!booking) {
            res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
            return;
        }

        const details = await bookingDetailModel.find({ bookingId: booking._id }).populate('roomId');
        res.json({ success: true, data: { ...booking.toObject(), details, roomTypeInfo: booking.roomTypeId } });
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
        ).populate('userId', 'full_name email phone').populate('roomTypeId');

        // Đồng bộ trạng thái phòng
        let detailStatus = 'waiting';
        if (status === 'checked_in') detailStatus = 'checked_in';
        else if (['checked_out', 'completed'].includes(status)) detailStatus = 'checked_out';
        else if (status === 'cancelled') detailStatus = 'cancelled';

        if (detailStatus !== 'waiting') {
            await bookingDetailModel.updateMany({ bookingId: req.params.id }, { roomStatus: detailStatus });
        }

        // Logic Hoàn tiền nếu Admin hủy: Áp dụng cùng tiêu chuẩn 24h trước Check-in hoặc 30p sau khi đặt (Grace period)
        if (status === 'cancelled' && oldBooking.status !== 'cancelled') {
            const now = new Date().getTime();
            const checkInTime = new Date(oldBooking.checkInDate).getTime();
            const createdAtTime = new Date(oldBooking.createdAt).getTime();

            const hoursBeforeCheckIn = (checkInTime - now) / (1000 * 60 * 60);
            const minsSinceBooking = (now - createdAtTime) / (1000 * 60);

            const isFreeCancellationRange = hoursBeforeCheckIn >= 24 || minsSinceBooking <= 30;

            if (isFreeCancellationRange && (oldBooking.paidAmount || 0) > 0) {
                const session = await mongoose.startSession();
                await session.withTransaction(async () => {
                    await refundToWallet(String(oldBooking.userId), oldBooking.paidAmount || 0, String(oldBooking._id), session, 'ADM_CANCEL');
                });
                session.endSession();
            }
        }

        // Emit socket events
        if (booking) {
            emitToUser(String(booking.userId), 'booking_updated', booking);
            emitToAll('booking_status_changed', booking);
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

        // Cấu hình linh hoạt: Cho phép hủy trước ít nhất 24 giờ trước ngày nhận phòng (00:00 UTC)
        // Hoặc cho phép hủy trong vòng 30 phút sau khi đặt đơn nếu lỡ tay đặt nhầm (Grace period)
        const now = new Date().getTime();
        const checkInTime = new Date(booking.checkInDate).getTime();
        const createdAtTime = new Date(booking.createdAt).getTime();
        
        const hoursBeforeCheckIn = (checkInTime - now) / (1000 * 60 * 60);
        const minsSinceBooking = (now - createdAtTime) / (1000 * 60);

        const canCancelByCheckIn = hoursBeforeCheckIn >= 24;
        const canCancelByGracePeriod = minsSinceBooking <= 30;

        if (!canCancelByCheckIn && !canCancelByGracePeriod) {
            res.status(400).json({ 
                success: false, 
                message: "Không thể tự hủy đơn hàng. Quý khách chỉ có thể hủy trước 24 giờ tính từ ngày nhận phòng, hoặc trong vòng 30 phút sau khi đặt đơn." 
            });
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

        // Emit socket events
        if (booking) {
            emitToUser(String(booking.userId), 'booking_updated', booking);
            emitToAll('booking_cancelled', booking);
        }

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

/**
 * Controller: Nhân viên gán số phòng thực tế và xác nhận đơn đặt phòng
 */
export const assignAndConfirmBooking = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { roomIds } = req.body;

        if (!roomIds || !Array.isArray(roomIds)) {
            res.status(400).json({ success: false, message: "Danh sách phòng không hợp lệ." });
            await session.abortTransaction();
            return;
        }

        const booking = await bookingModel.findById(id).populate('roomTypeId').session(session);
        if (!booking) {
            res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng." });
            await session.abortTransaction();
            return;
        }

        const roomTypeId = booking.roomTypeId?._id || booking.roomTypeId;
        if (!roomTypeId) {
            res.status(400).json({ success: false, message: "Đơn đặt phòng không chứa thông tin Loại phòng hợp lệ." });
            await session.abortTransaction();
            return;
        }

        if (booking.status !== 'pending' && booking.status !== 'confirmed') {
            res.status(400).json({ success: false, message: "Chỉ có thể gán hoặc đổi phòng cho đơn đặt 'Chờ xác nhận' hoặc 'Đã xác nhận'." });
            await session.abortTransaction();
            return;
        }

        if (booking.status === 'confirmed') {
            const now = new Date();
            const checkInDate = new Date(booking.checkInDate);
            const checkInTimeString = booking.checkInTime !== 'Tôi chưa biết' 
                ? (booking.checkInTime || '14:00') 
                : '14:00';
            
            const [hours, minutes] = checkInTimeString.includes(':') 
                ? checkInTimeString.split(':').map(Number) 
                : [14, 0];

            const checkInTimePoint = new Date(checkInDate.getTime());
            checkInTimePoint.setUTCHours((hours || 14) - 7, minutes || 0, 0, 0);

            if (now > checkInTimePoint) {
                res.status(400).json({ 
                    success: false, 
                    message: "Đã qua thời gian check-in dự kiến. Quản trị viên không thể thay đổi phòng đã gán cho khách hàng sau thời điểm này." 
                });
                await session.abortTransaction();
                return;
            }

            await bookingDetailModel.deleteMany({ bookingId: id }).session(session);
        }

        if (roomIds.length !== booking.roomQuantity) {
            res.status(400).json({ success: false, message: `Vui lòng chọn chính xác ${booking.roomQuantity} phòng.` });
            await session.abortTransaction();
            return;
        }

        const roomModel = (await import('../models/roomModel.ts')).default;
        const rooms = await roomModel.find({ _id: { $in: roomIds } }).session(session);

        if (rooms.length !== roomIds.length) {
            res.status(400).json({ success: false, message: "Một hoặc nhiều mã phòng không tồn tại trong hệ thống." });
            await session.abortTransaction();
            return;
        }

        for (const room of rooms) {
            if (String(room.roomTypeId) !== String(roomTypeId)) {
                res.status(400).json({ success: false, message: `Phòng ${room.roomNumber} không thuộc loại phòng [${(booking.roomTypeId as any).name || roomTypeId}] của khách.` });
                await session.abortTransaction();
                return;
            }
            if (room.status === 'maintenance') {
                res.status(400).json({ success: false, message: `Phòng ${room.roomNumber} đang được bảo trì, không thể chọn.` });
                await session.abortTransaction();
                return;
            }
        }

        const pricePerRoom = Math.round(booking.finalAmount / (booking.roomQuantity || 1));
        const detailsData = rooms.map(room => ({
            bookingId: booking._id,
            roomId: room._id,
            price: pricePerRoom,
            roomStatus: 'waiting'
        }));

        await bookingDetailModel.insertMany(detailsData, { session });

        booking.assignedRooms = rooms.map(r => r._id as mongoose.Types.ObjectId);
        booking.status = 'confirmed';
        await booking.save({ session });

        await session.commitTransaction();

        const updatedBooking = await bookingModel.findById(id).populate('roomTypeId');
        const details = await bookingDetailModel.find({ bookingId: id }).populate('roomId');

        const bookingData = { ...updatedBooking?.toObject(), details, roomTypeInfo: updatedBooking?.roomTypeId };

        if (updatedBooking) {
            emitToAll('booking_status_changed', bookingData);
            emitToUser(String(booking.userId), 'booking_updated', bookingData);
        }

        const roomNumbers = rooms.map(r => r.roomNumber).join(", ");
        import('../utils/sendMail.ts').then(({ default: sendMail }) => {
            const checkInDate = new Date(booking.checkInDate).toLocaleDateString('vi-VN');
            const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('vi-VN');

            const emailContent = `Kính gửi anh/chị ${booking.customerInfo.name}, \n\n`
                + `Yêu cầu Đặt phòng của quý khách tại Khách sạn chúng tôi đã được XÁC NHẬN.\n`
                + `Sau đây là thông tin chi tiết:\n`
                + `Mã đơn đặt phòng: ${booking._id}\n`
                + `Loại phòng đã đặt: ${(booking.roomTypeId as any).name || 'Hợp lệ'}\n`
                + `Số phòng quý khách được bố trí: ${roomNumbers}\n`
                + `Lịch Check-in dự kiến: ${booking.checkInTime !== 'Tôi chưa biết' ? booking.checkInTime : '14:00'}, ngày ${checkInDate}\n`
                + `Lịch Check-out: Trước 12:00 ngày ${checkOutDate}\n`
                + `Thanh toán: ${booking.finalAmount.toLocaleString('vi-VN')} VND `
                + `(Đã thanh toán: ${booking.paidAmount?.toLocaleString('vi-VN')} VND)\n\n`
                + `Cảm ơn quý khách đã gửi gắm kỳ nghỉ của mình cho dịch vụ của chúng tôi.\n`
                + `Trân trọng!`;

            sendMail(booking.customerInfo.email, "[HTQLKS] Xác nhận đơn đặt và số phòng cụ thể", emailContent).catch(err => {
                console.error("Lỗi gửi email xác nhận: ", err);
            });
        }).catch(err => console.error("Lỗi import sendMail: ", err));

        res.json({ success: true, message: "Gán phòng & Gửi email xác nhận thành công!", data: bookingData });

    } catch (error) {
        console.error("CRITICAL ERROR in assignAndConfirmBooking:", error);
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        res.status(500).json({ success: false, message: (error as Error).message });
    } finally {
        session.endSession();
    }
};
