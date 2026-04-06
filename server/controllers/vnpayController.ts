import { Request, Response } from "express";
import userModel from "../models/userModel.ts";
import depositModel from "../models/depositModel.ts";
import bookingModel from "../models/bookingModel.ts";
import { generateVNPayPaymentUrl, verifyVNPaySignature } from "../services/vnpayService.ts";
import { emitToUser, emitToAll } from "../socket.ts";

// @desc    Tạo URL thanh toán VNPay
// @route   POST /api/vnpay/create-payment
export const createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { amount, userId } = req.body;

        if (!amount || amount < 10000) {
            res.status(400).json({ success: false, message: "Số tiền tối thiểu là 10,000 VNĐ" });
            return;
        }

        const orderId = Date.now().toString();
        const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';

        // Tạo bản ghi nạp tiền ở trạng thái chờ
        await depositModel.create({
            userId,
            amount,
            txnRef: orderId,
            status: 'pending'
        });

        // Gọi Service để tạo URL VNPay
        const paymentUrl = generateVNPayPaymentUrl(userId, amount, orderId, ipAddr);

        res.json({ success: true, paymentUrl });
    } catch (error) {
        console.error("VNPay create payment error:", error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Xử lý kết quả trả về từ VNPay
// @route   GET /api/vnpay/vnpay-return
export const vnpayReturn = async (req: Request, res: Response): Promise<void> => {
    try {
        const queryParams = req.query;

        // Gọi Service để xác thực chữ ký
        const isSignatureValid = verifyVNPaySignature(queryParams);

        if (isSignatureValid) {
            const responseCode = queryParams['vnp_ResponseCode'];
            const txnRef = queryParams['vnp_TxnRef'] as string;
            const amountPaid = parseInt(queryParams['vnp_Amount'] as string) / 100;
            const bankCode = queryParams['vnp_BankCode'] as string;
            const payDate = queryParams['vnp_PayDate'] as string;

            // PHÂN BIỆT NẠP VÍ VÀ THANH TOÁN ĐƠN
            if (txnRef.startsWith('BK')) {
                // XỬ LÝ THANH TOÁN ĐƠN PHÒNG (BK + last 22 chars of ID)
                const booking = await bookingModel.findOne({ vnp_TxnRef: txnRef });
                
                if (!booking) {
                    res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng tương ứng" });
                    return;
                }

                const bookingId = booking._id;

                if (responseCode === '00') {
                    // Thanh toán thành công: CHỈ cập nhật trạng thái thanh toán
                    // KHÔNG set status = 'confirmed' để nhân viên vẫn có thể gán phòng từ trạng thái 'pending'
                    booking.paymentStatus = (booking.finalAmount <= (booking.paidAmount || 0) + amountPaid) ? 'paid' : 'deposited';
                    booking.paidAmount = (booking.paidAmount || 0) + amountPaid;
                    // Giữ nguyên booking.status = 'pending' để nhân viên gán phòng
                    await booking.save();

                    // Emit socket thông báo cho Admin/Staff biết có đơn đã thanh toán cần xử lý
                    emitToAll('booking_created', booking);
                    emitToUser(String(booking.userId), 'booking_updated', booking);
                    emitToAll('booking_status_changed', booking);

                    res.status(200).json({ success: true, message: "Thanh toán đơn hàng thành công", type: 'booking', bookingId, amount: amountPaid });
                } else {
                    res.status(400).json({ success: false, message: "Thanh toán đơn hàng thất bại", code: responseCode });
                }
            } else {
                // XỬ LÝ NẠP TIỀN VÍ (Mặc định hoặc prefix DEP_)
                const deposit = await depositModel.findOne({ txnRef });
                if (!deposit) {
                    res.status(404).json({ success: false, message: "Không tìm thấy giao dịch nạp tiền" });
                    return;
                }

                if (deposit.status !== 'pending') {
                    res.json({ success: true, message: "Giao dịch đã được xử lý", amount: amountPaid });
                    return;
                }

                if (responseCode === '00') {
                    // Cập nhật số dư + tổng nạp + hạng thành viên
                    const user = await userModel.findById(deposit.userId);
                    if (user) {
                        user.balance += amountPaid;
                        user.totalRecharged += amountPaid;

                        // Tự động tính lại hạng thành viên
                        if (user.totalRecharged >= 150000000) {
                            user.membershipLevel = 'platinum';
                        } else if (user.totalRecharged >= 50000000) {
                            user.membershipLevel = 'diamond';
                        } else if (user.totalRecharged >= 10000000) {
                            user.membershipLevel = 'gold';
                        } else {
                            user.membershipLevel = 'silver';
                        }
                        await user.save();
                    }

                    deposit.status = 'success';
                    deposit.bankCode = bankCode;
                    deposit.payDate = payDate;
                    await deposit.save();

                    res.json({ success: true, message: "Nạp tiền thành công", amount: amountPaid, type: 'deposit' });
                } else {
                    deposit.status = 'failed';
                    await deposit.save();
                    res.json({ success: false, message: "Thanh toán thất bại", code: responseCode });
                }
            }
        } else {
            res.json({ success: false, message: "Chữ ký không hợp lệ" });
        }
    } catch (error) {
        console.error("VNPay return error:", error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Lấy lịch sử nạp tiền của một người dùng
// @route   GET /api/vnpay/history/:userId
export const getDepositHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const history = await depositModel.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Tạo lại URL thanh toán VNPay cho giao dịch đang chờ (pending)
// @route   GET /api/vnpay/continue-payment/:depositId
export const continuePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { depositId } = req.params;
        const deposit = await depositModel.findById(depositId);

        if (!deposit || deposit.status !== 'pending') {
            res.status(400).json({ success: false, message: "Giao dịch không hợp lệ hoặc đã xử lý" });
            return;
        }

        const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';

        // Gọi Service để tạo URL tiếp tục thanh toán
        const paymentUrl = generateVNPayPaymentUrl(
            String(deposit.userId), 
            deposit.amount, 
            deposit.txnRef, 
            ipAddr
        );

        res.json({ success: true, paymentUrl });
    } catch (error) {
        console.error("VNPay continue payment error:", error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Tạo lại URL thanh toán cho đơn đặt phòng đang chờ (unpaid)
// @route   GET /api/vnpay/continue-booking-payment/:bookingId
export const continueBookingPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookingId } = req.params;
        const booking = await bookingModel.findById(bookingId);

        if (!booking || booking.paymentStatus !== 'unpaid') {
            res.status(400).json({ success: false, message: "Đơn đặt phòng không hợp lệ hoặc đã thanh toán" });
            return;
        }

        const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';

        // Tính tiền cần trả
        const amountToPay = (booking.paidAmount && booking.paidAmount > 0) ? booking.finalAmount - booking.paidAmount : booking.finalAmount;

        // Đảm bảo dùng txnRef hợp lệ (dưới 24 ký tự)
        let txnRef = booking.vnp_TxnRef;
        if (!txnRef || txnRef.length > 24 || txnRef.startsWith('BK_')) {
            txnRef = `BK${booking._id.toString().slice(-22)}`;
            booking.vnp_TxnRef = txnRef;
            await booking.save();
        }

        const paymentUrl = generateVNPayPaymentUrl(
            String(booking.userId), 
            amountToPay, 
            txnRef, 
            ipAddr,
            `Thanh toan lai cho don phong ${booking._id}`
        );

        res.json({ success: true, paymentUrl });
    } catch (error) {
        console.error("VNPay continue booking payment error:", error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Xóa lịch sử giao dịch
export const deleteDepositRecord = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await depositModel.findByIdAndDelete(id);
        res.json({ success: true, message: "Đã xóa lịch sử giao dịch" });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};
