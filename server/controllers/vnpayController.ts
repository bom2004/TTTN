import { Request, Response } from "express";
import userModel from "../models/userModel.ts";
import bookingModel from "../models/bookingModel.ts";
import { verifyVNPaySignature, generateVNPayPaymentUrl } from "../services/vnpayService.ts";
import { emitToUser, emitToAll } from "../socket.ts";

/**
 * @desc    Xử lý kết quả trả về từ VNPay (Chỉ dành cho thanh toán Booking)
 * @route   GET /api/vnpay/vnpay-return
 */
export const vnpayReturn = async (req: Request, res: Response): Promise<void> => {
    try {
        const queryParams = req.query;

        // Xác thực chữ ký từ VNPay
        const isSignatureValid = verifyVNPaySignature(queryParams);

        if (isSignatureValid) {
            const responseCode = queryParams['vnp_ResponseCode'];
            const txnRef = queryParams['vnp_TxnRef'] as string;
            const amountPaid = parseInt(queryParams['vnp_Amount'] as string) / 100;

            if (txnRef.startsWith('BK')) {
                // XỬ LÝ THANH TOÁN ĐƠN PHÒNG
                const booking = await bookingModel.findOne({ vnp_TxnRef: txnRef });
                
                if (!booking) {
                    res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng tương ứng" });
                    return;
                }

                const bookingId = booking._id;

                if (responseCode === '00') {
                    // Thanh toán thành công: Cập nhật trạng thái thanh toán và số tiền đã trả
                    const currentPaid = booking.paidAmount || 0;
                    const newPaid = currentPaid + amountPaid;
                    
                    booking.paidAmount = newPaid;
                    booking.paymentStatus = (newPaid >= booking.finalAmount) ? 'paid' : 'deposited';
                    
                    // Ghi nhận vào lịch sử thanh toán
                    booking.paymentHistory.push({
                        amount: amountPaid,
                        paymentMethod: 'vnpay',
                        txnRef: txnRef,
                        note: "Thanh toán qua VNPay",
                        createdAt: new Date()
                    });
                    
                    await booking.save();

                    // Thông báo qua Socket
                    const fullBooking = await bookingModel.findById(bookingId).populate('userId').populate('roomTypeId');
                    emitToAll('booking_created', fullBooking);
                    emitToUser(String(booking.userId), 'booking_updated', fullBooking);
                    emitToAll('booking_status_changed', fullBooking);

                    res.status(200).json({ 
                        success: true, 
                        message: "Thanh toán đơn hàng thành công", 
                        type: 'booking', 
                        bookingId, 
                        amount: amountPaid 
                    });
                } else {
                    res.status(400).json({ success: false, message: "Thanh toán giao dịch thất bại từ phía ngân hàng", code: responseCode });
                }
            } else {
                // Giao dịch không xác định (Có thể là DEP cũ)
                res.status(400).json({ success: false, message: "Giao dịch không hợp lệ hoặc tính năng nạp ví đã ngừng hoạt động" });
            }
        } else {
            res.status(400).json({ success: false, message: "Chữ ký không hợp lệ" });
        }
    } catch (error) {
        console.error("VNPay return error:", error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * @desc    Tạo lại URL thanh toán cho đơn đặt phòng đang chờ
 * @route   GET /api/vnpay/continue-booking-payment/:bookingId
 */
export const continueBookingPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookingId } = req.params;
        const booking = await bookingModel.findById(bookingId);

        if (!booking || (booking.paymentStatus === 'paid' && (booking.paidAmount || 0) >= booking.finalAmount)) {
            res.status(400).json({ success: false, message: "Đơn đặt phòng không hợp lệ hoặc đã thanh toán đủ" });
            return;
        }

        const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';

        // Tính tiền còn nợ (nếu đã cọc 30% thì trả nốt 70%)
        const amountToPay = booking.finalAmount - (booking.paidAmount || 0);

        if (amountToPay <= 0) {
            res.status(400).json({ success: false, message: "Đơn hàng này không còn số dư cần thanh toán" });
            return;
        }

        // Đảm bảo txnRef hợp lệ cho VNPay
        let txnRef = booking.vnp_TxnRef;
        if (!txnRef || txnRef.length > 24) {
            txnRef = `BK${booking._id.toString().slice(-22)}`;
            booking.vnp_TxnRef = txnRef;
            await booking.save();
        }

        const paymentUrl = generateVNPayPaymentUrl(
            String(booking.userId), 
            amountToPay, 
            txnRef, 
            ipAddr,
            `Thanh toan don phong ${booking._id}`
        );

        res.json({ success: true, paymentUrl });
    } catch (error) {
        console.error("VNPay continue booking payment error:", error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};
