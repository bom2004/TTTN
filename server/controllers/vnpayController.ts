import { Request, Response } from "express";
import userModel from "../models/userModel.ts";
import depositModel from "../models/depositModel.ts";
import { generateVNPayPaymentUrl, verifyVNPaySignature } from "../services/vnpayService.ts";

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

            const deposit = await depositModel.findOne({ txnRef });
            if (!deposit) {
                res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
                return;
            }

            if (deposit.status !== 'pending') {
                res.json({ success: true, message: "Giao dịch đã được xử lý", amount: amountPaid });
                return;
            }

            if (responseCode === '00') {
                // Thanh toán thành công: cập nhật số dư + tổng tiền đã nạp
                await userModel.findByIdAndUpdate(deposit.userId, {
                    $inc: { balance: amountPaid, totalRecharged: amountPaid }
                });

                deposit.status = 'success';
                deposit.bankCode = bankCode;
                deposit.payDate = payDate;
                await deposit.save();

                res.json({ success: true, message: "Nạp tiền thành công", amount: amountPaid });
            } else {
                deposit.status = 'failed';
                await deposit.save();
                res.json({ success: false, message: "Thanh toán thất bại", code: responseCode });
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

// @desc    Xóa lịch sử giao dịch
// @route   DELETE /api/vnpay/history/:id
export const deleteDepositRecord = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await depositModel.findByIdAndDelete(id);
        res.json({ success: true, message: "Đã xóa lịch sử giao dịch" });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};
