import { Request, Response } from "express";
import bookingModel from "../models/bookingModel.ts";
import bookingDetailModel from "../models/bookingDetailModel.ts";
import roomModel from "../models/roomModel.ts";
import promotionModel from "../models/promotionModel.ts";
import userModel from "../models/userModel.ts";
import depositModel from "../models/depositModel.ts";
import mongoose from "mongoose";

// @desc    Create a new booking
// @route   POST /api/bookings
export const createBooking = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { 
            userId, 
            customerInfo, 
            checkInDate, 
            checkOutDate, 
            rooms, // Array of { roomId, price }
            promotionCode,
            paymentMethod,
            paidAmount,
            checkInTime,
            specialRequests
        } = req.body;

        if (!userId || !rooms || rooms.length === 0 || !checkInDate || !checkOutDate) {
            res.status(400).json({ success: false, message: "Thiếu thông tin đặt phòng bắt buộc." });
            return;
        }

        // 1. Tính số đêm và tổng tiền gốc
        let targetCheckIn = new Date(checkInDate);
        let targetCheckOut = new Date(checkOutDate);
        targetCheckIn.setHours(0,0,0,0);
        targetCheckOut.setHours(0,0,0,0);
        
        const diff = targetCheckOut.getTime() - targetCheckIn.getTime();
        const numNights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));

        let totalAmount = rooms.reduce((sum: number, room: any) => sum + room.price, 0) * numNights;
        let discountAmount = 0;

        // 1.5 KIỂM TRA PHÒNG TRỐNG (TRÁNH DOUBLE BOOKING)
        const requestedRoomIds = rooms.map((r: any) => r.roomId);
        const overlappingBookings = await bookingModel.find({
            status: { $nin: ['cancelled', 'completed'] },
            checkInDate: { $lt: targetCheckOut },
            checkOutDate: { $gt: targetCheckIn }
        }).session(session);

        const bookedCountByRoom: Record<string, number> = {};
        if (overlappingBookings.length > 0) {
            const bookingIds = overlappingBookings.map((b: any) => b._id);
            const bookedDetails = await bookingDetailModel.find({
                bookingId: { $in: bookingIds },
                roomId: { $in: requestedRoomIds },
                roomStatus: { $ne: 'cancelled' }
            }).session(session);

            for (const detail of bookedDetails) {
                const roomIdStr = detail.roomId.toString();
                bookedCountByRoom[roomIdStr] = (bookedCountByRoom[roomIdStr] || 0) + 1;
            }
        }

        for (const r of rooms) {
            const roomDoc = await roomModel.findById(r.roomId).session(session);
            if (!roomDoc) {
                throw new Error(`Không tìm thấy phòng: ${r.roomId}`);
            }
            let baseAvailable = roomDoc.availableRooms;
            // Tự khôi phục nếu dữ liệu cũ kẹt ở 0
            if (baseAvailable <= 0 && (!bookedCountByRoom[r.roomId] || bookedCountByRoom[r.roomId] === 0)) {
                baseAvailable = 1;
            }
            const bookedCount = bookedCountByRoom[r.roomId] || 0;
            const currentAvail = Math.max(0, baseAvailable - bookedCount);
            
            if (currentAvail <= 0) {
                throw new Error(`Rất tiếc, phòng ${roomDoc.name} đã được khách khác đặt trong khoảng thời gian này. Vui lòng chọn ngày hoặc phòng khác.`);
            }
        }

        // 2. Xử lý mã khuyến mãi (nếu có)
        if (promotionCode) {
            const promotion = await promotionModel.findOne({ code: promotionCode, status: 'active' }).populate('roomTypes');
            if (promotion) {
                const now = new Date();
                const startDate = new Date(promotion.startDate);
                const endDate = new Date(promotion.endDate);

                // Kiểm tra thời gian
                if (now >= startDate && now <= endDate) {
                    // Lấy thông tin user để kiểm tra cấp Genius
                    const user = await userModel.findById(userId);
                    const calculateGeniusLevel = (total: number): number => {
                        if (!total || total < 100000) return 0;
                        if (total < 500000) return 1;
                        const level = Math.floor(total / 500000) + 1;
                        return Math.min(level, 10);
                    };
                    const userGeniusLevel = user ? calculateGeniusLevel(user.totalRecharged || 0) : 0;

                    // Kiểm tra giá trị đơn hàng tối thiểu
                    if (totalAmount >= promotion.minOrderValue && userGeniusLevel >= (promotion.minGeniusLevel || 0)) {
                        
                        // Kiểm tra giới hạn lượt dùng
                        const isUnderLimit = promotion.usageLimit === 0 || promotion.usedCount < promotion.usageLimit;
                        const hasNotUsedYet = !promotion.usedBy.includes(userId);

                        if (isUnderLimit && hasNotUsedYet) {
                            // Kiểm tra loại phòng (nếu có giới hạn)
                            let isRoomTypeValid = true;
                            if (promotion.roomTypes && promotion.roomTypes.length > 0) {
                                // Lấy roomType của phòng đầu tiên
                                const roomDoc = await roomModel.findById(rooms[0].roomId);
                                if (roomDoc && !promotion.roomTypes.some((rt: any) => rt.name === roomDoc.roomType)) {
                                    isRoomTypeValid = false;
                                }
                            }

                            if (isRoomTypeValid) {
                                discountAmount = (totalAmount * promotion.discountPercent) / 100;
                                
                                // Cập nhật số lần sử dụng khuyến mãi
                                promotion.usedCount += 1;
                                promotion.usedBy.push(userId);
                                
                                // Nếu đạt giới hạn, có thể set inactive/expired (tùy nhu cầu)
                                if (promotion.usageLimit > 0 && promotion.usedCount >= promotion.usageLimit) {
                                    promotion.status = 'expired';
                                }
                                
                                await promotion.save({ session });
                            }
                        }
                    }
                }
            }
        }

        const finalAmount = totalAmount - discountAmount;

        // 3. Tạo đơn đặt phòng chính (Booking)
        const newBooking = new bookingModel({
            userId,
            customerInfo,
            checkInDate,
            checkOutDate,
            totalAmount,
            discountAmount,
            finalAmount,
            promotionCode: promotionCode || "",
            status: req.body.status || 'pending',
            paymentStatus: req.body.paymentStatus || 'unpaid',
            paymentMethod: paymentMethod || 'vnpay',
            paidAmount: paidAmount || 0,
            checkInTime: checkInTime || "Tôi chưa biết",
            specialRequests: specialRequests || ""
        });

        const savedBooking = await newBooking.save({ session });

        // 4. Tạo chi tiết đặt phòng cho từng phòng (BookingDetails)
        const bookingDetails = rooms.map((room: any) => ({
            bookingId: savedBooking._id,
            roomId: room.roomId,
            price: room.price,
            roomStatus: 'waiting'
        }));

        await bookingDetailModel.insertMany(bookingDetails, { session });

        // 5. Cập nhật trạng thái phòng trong hệ thống (Tùy chọn: đánh dấu là đã có khách đặt)
        // LƯU Ý: Đã chuyển sang mô hình tính toán phòng trống động (dynamic availability) theo ngày.
        // Không trừ trực tiếp availableRooms trong DB ở đây nữa để tránh làm hỏng tổng số phòng gốc.
        // Chỉ lưu thông tin đặt phòng (Booking) và (BookingDetail).

        // 6. Trừ tiền ví nếu thanh toán bằng ví
        if (paymentMethod === 'wallet' && paidAmount > 0) {
            const user = await userModel.findById(userId);
            if (!user || user.balance < paidAmount) {
                throw new Error("Số dư ví không đủ");
            }

            await userModel.findByIdAndUpdate(userId, {
                $inc: { balance: -paidAmount }
            }, { session });

            // Ghi lịch sử ví (dạng trừ tiền)
            const newHistory = new depositModel({
                userId,
                amount: -paidAmount,
                txnRef: `BOOKING_${savedBooking._id}`,
                status: 'success'
            });
            await newHistory.save({ session });
        }

        await session.commitTransaction();
        res.status(201).json({ 
            success: true, 
            message: "Tạo đơn đặt phòng thành công", 
            data: savedBooking 
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: "Lỗi tạo đơn đặt phòng: " + (error as Error).message });
    } finally {
        session.endSession();
    }
};

// @desc    Get all bookings (Admin/Staff)
// @route   GET /api/bookings
export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const bookings = await bookingModel.find().populate('userId', 'full_name email').sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/user/:userId
export const getUserBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const bookings = await bookingModel.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        
        // Populate details for each booking
        const populatedBookings = await Promise.all(
            bookings.map(async (booking) => {
                const details = await bookingDetailModel.find({ bookingId: booking._id }).populate('roomId');
                return {
                    ...booking.toObject(),
                    details
                };
            })
        );

        res.json({ success: true, data: populatedBookings });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Get booking details
// @route   GET /api/bookings/:id
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
    try {
        const booking = await bookingModel.findById(req.params.id).populate('userId', 'full_name email phone');
        if (!booking) {
            res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
            return;
        }

        const details = await bookingDetailModel.find({ bookingId: booking._id }).populate('roomId');
        
        res.json({ 
            success: true, 
            data: {
                ...booking.toObject(),
                details
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, paymentStatus } = req.body;
        
        // 1. Lấy thông tin đơn hàng hiện tại để so sánh trạng thái
        const oldBooking = await bookingModel.findById(req.params.id);
        if (!oldBooking) {
            res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
            return;
        }

        // 2. Cập nhật trạng thái đơn hàng
        const booking = await bookingModel.findByIdAndUpdate(
            req.params.id, 
            { status, paymentStatus: paymentStatus || oldBooking.paymentStatus }, 
            { new: true }
        );

        // Cập nhật trạng thái trong Chi tiết đơn (BookingDetail) để đồng bộ
        if (status === 'checked_in') {
            await bookingDetailModel.updateMany({ bookingId: req.params.id }, { roomStatus: 'checked_in' });
        } else if (status === 'checked_out' || status === 'completed') {
            await bookingDetailModel.updateMany({ bookingId: req.params.id }, { roomStatus: 'checked_out' });
        } else if (status === 'cancelled') {
            await bookingDetailModel.updateMany({ bookingId: req.params.id }, { roomStatus: 'cancelled' });

            // --- LOGIC HOÀN TIỀN 6 TIẾNG CHO ADMIN/STAFF ---
            const now = new Date();
            const createdAt = new Date(oldBooking.createdAt);
            const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

            console.log(`[Admin Cancel] Booking: ${req.params.id}, Hours: ${diffInHours.toFixed(2)}, Paid: ${oldBooking.paidAmount}`);

            if (diffInHours <= 6 && oldBooking.status !== 'cancelled') {
                const refundAmount = oldBooking.paidAmount || 0;
                if (refundAmount > 0) {
                    // Update user balance using $inc for atomicity
                    const updatedUser = await userModel.findByIdAndUpdate(
                        oldBooking.userId,
                        { $inc: { balance: refundAmount } },
                        { new: true }
                    );

                    if (updatedUser) {
                        // Log refund transaction
                        await depositModel.create({
                            userId: oldBooking.userId,
                            amount: refundAmount,
                            txnRef: `REFUND_ADM_${oldBooking._id.toString().slice(-6).toUpperCase()}`,
                            status: 'success',
                        });
                        console.log(`Refunded ${refundAmount} to user ${updatedUser.full_name}`);
                    }
                }
            }
        }

        // 3. Logic giải phóng phòng: (Đã loại bỏ Mutation trực tiếp)
        const terminalStatuses = ['completed', 'cancelled'];
        if (terminalStatuses.includes(status) && !terminalStatuses.includes(oldBooking.status)) {
            console.log(`Đã tính toán lại phòng trống động cho đơn hàng ${req.params.id}`);
        }

        res.json({ success: true, message: "Cập nhật trạng thái thành công", data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        const bookingId = req.params.id;
        
        // Find and delete the booking
        const deletedBooking = await bookingModel.findByIdAndDelete(bookingId);
        if (!deletedBooking) {
            res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
            return;
        }

        // Delete associated booking details
        await bookingDetailModel.deleteMany({ bookingId: bookingId });

        res.json({ success: true, message: "Xóa đơn đặt phòng thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Cancel a booking by user
// @route   PUT /api/bookings/:id/cancel
export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const booking = await bookingModel.findById(id).session(session);

        if (!booking) {
            res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
            await session.abortTransaction();
            return;
        }

        if (booking.status === 'cancelled') {
            res.status(400).json({ success: false, message: "Đơn hàng đã được hủy trước đó" });
            await session.abortTransaction();
            return;
        }

        // Kiểm tra thời gian: < 6 tiếng từ lúc đặt
        const now = new Date();
        const createdAt = new Date(booking.createdAt);
        const diffInMs = now.getTime() - createdAt.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours > 6) {
            res.status(400).json({ success: false, message: "Đã quá thời hạn 6 tiếng để có thể tự hủy đơn hàng" });
            await session.abortTransaction();
            return;
        }

        // Thực hiện hoàn tiền nếu đã thanh toán
        const paidAmount = booking.paidAmount || 0;
        if (paidAmount > 0) {
            const user = await userModel.findById(booking.userId).session(session);
            if (user) {
                user.balance += paidAmount;
                await user.save({ session });

                // Tạo một bản ghi lịch sử trong ví (dùng chung depositModel)
                await depositModel.create([{
                    userId: booking.userId,
                    amount: paidAmount,
                    txnRef: `REFUND_${booking._id.toString().slice(-6).toUpperCase()}`,
                    status: 'success',
                }], { session });
            }
        }

        // Cập nhật trạng thái đơn
        booking.status = 'cancelled';
        await booking.save({ session });

        // Cập nhật trạng thái chi tiết phòng
        await bookingDetailModel.updateMany(
            { bookingId: id },
            { roomStatus: 'cancelled' }
        ).session(session);

        await session.commitTransaction();
        res.json({ success: true, message: "Hủy đơn hàng và hoàn tiền thành công" });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: (error as Error).message });
    } finally {
        session.endSession();
    }
};
