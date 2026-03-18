import express, { Request, Response } from "express";
import crypto from "crypto";
import userModel from "../models/userModel.ts";
import depositModel from "../models/depositModel.ts";

const vnpayRouter = express.Router();

// Helper: Sort object keys
function sortObject(obj: Record<string, any>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    }
    return sorted;
}

// API: Create VNPay payment URL
vnpayRouter.post("/create-payment", async (req: Request, res: Response) => {
    try {
        const { amount, userId } = req.body;

        if (!amount || amount < 10000) {
            res.status(400).json({ success: false, message: "Số tiền tối thiểu là 10,000 VNĐ" });
            return;
        }

        const date = new Date();
        
        // Ensure date is correctly formatted as yyyyMMddHHmmss
        const formatVNPayDate = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            return `${year}${month}${day}${hours}${minutes}${seconds}`;
        };

        const createDate = formatVNPayDate(date);
        const expireDate = formatVNPayDate(new Date(date.getTime() + 15 * 60000));

        const orderId = date.getTime().toString();

        // Create pending deposit record
        await depositModel.create({
            userId,
            amount,
            txnRef: orderId,
            status: 'pending'
        });

        const tmnCode = process.env.VNP_TMN_CODE!;
        const secretKey = process.env.VNP_HASH_SECRET!;
        const vnpUrl = process.env.VNP_URL!;
        const returnUrl = process.env.VNP_RETURN_URL!;

        const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';

        let vnp_Params: Record<string, any> = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: `NapTien_${userId}_${amount}`,
            vnp_OrderType: 'other',
            vnp_Amount: amount * 100,
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
            vnp_ExpireDate: expireDate,
        };

        vnp_Params = sortObject(vnp_Params);

        const signData = Object.entries(vnp_Params).map(([key, val]) => `${key}=${val}`).join('&');
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        (vnp_Params as Record<string, string>)['vnp_SecureHash'] = signed;

        const paymentUrl = `${vnpUrl}?${Object.entries(vnp_Params).map(([key, val]) => `${key}=${val}`).join('&')}`;

        res.json({ success: true, paymentUrl });
    } catch (error) {
        console.error("VNPay create payment error:", error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

// API: Handle VNPay return (verify payment & update balance)
vnpayRouter.get("/vnpay-return", async (req: Request, res: Response) => {
    try {
        let vnp_Params: Record<string, any> = { ...req.query };
        const secureHash = vnp_Params['vnp_SecureHash'] as string;

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const secretKey = process.env.VNP_HASH_SECRET!;
        const signData = Object.entries(vnp_Params).map(([key, val]) => `${key}=${val}`).join('&');
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const responseCode = vnp_Params['vnp_ResponseCode'];
            const txnRef = vnp_Params['vnp_TxnRef'];
            const amountPaid = parseInt(vnp_Params['vnp_Amount']) / 100;
            const bankCode = vnp_Params['vnp_BankCode'];
            const payDate = vnp_Params['vnp_PayDate'];

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
                // Payment successful - update user balance and totalRecharged
                await userModel.findByIdAndUpdate(deposit.userId, {
                    $inc: { 
                        balance: amountPaid,
                        totalRecharged: amountPaid 
                    }
                });

                // Update deposit record
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
});

// API: Get deposit history for a user
vnpayRouter.get("/history/:userId", async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const history = await depositModel.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

// API: Re-create VNPay payment URL for pending deposit
vnpayRouter.get("/continue-payment/:depositId", async (req: Request, res: Response) => {
    try {
        const { depositId } = req.params;
        const deposit = await depositModel.findById(depositId);

        if (!deposit || deposit.status !== 'pending') {
            res.status(400).json({ success: false, message: "Giao dịch không hợp lệ hoặc đã xử lý" });
            return;
        }

        const date = new Date();
        const formatVNPayDate = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            return `${year}${month}${day}${hours}${minutes}${seconds}`;
        };

        const createDate = formatVNPayDate(date);
        const expireDate = formatVNPayDate(new Date(date.getTime() + 15 * 60000));

        const tmnCode = process.env.VNP_TMN_CODE!;
        const secretKey = process.env.VNP_HASH_SECRET!;
        const vnpUrl = process.env.VNP_URL!;
        const returnUrl = process.env.VNP_RETURN_URL!;

        const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';

        let vnp_Params: Record<string, any> = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: deposit.txnRef,
            vnp_OrderInfo: `TiepTucNapTien_${deposit.userId}_${deposit.amount}`,
            vnp_OrderType: 'other',
            vnp_Amount: deposit.amount * 100,
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
            vnp_ExpireDate: expireDate,
        };

        vnp_Params = sortObject(vnp_Params);

        const signData = Object.entries(vnp_Params).map(([key, val]) => `${key}=${val}`).join('&');
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        (vnp_Params as Record<string, string>)['vnp_SecureHash'] = signed;

        const paymentUrl = `${vnpUrl}?${Object.entries(vnp_Params).map(([key, val]) => `${key}=${val}`).join('&')}`;

        res.json({ success: true, paymentUrl });
    } catch (error) {
        console.error("VNPay continue payment error:", error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

// API: Delete a deposit record
vnpayRouter.delete("/history/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await depositModel.findByIdAndDelete(id);
        res.json({ success: true, message: "Đã xóa lịch sử giao dịch" });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

export default vnpayRouter;


