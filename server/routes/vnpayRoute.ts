import express from "express";
import {
    createPayment,
    vnpayReturn,
    getDepositHistory,
    continuePayment,
    deleteDepositRecord
} from "../controllers/vnpayController.ts";

const vnpayRouter = express.Router();

// API: Tạo URL thanh toán VNPay
vnpayRouter.post("/create-payment", createPayment);

// API: Xử lý kết quả trả về từ VNPay (xác thực thanh toán & cập nhật số dư)
vnpayRouter.get("/vnpay-return", vnpayReturn);

// API: Lấy lịch sử nạp tiền của một người dùng
vnpayRouter.get("/history/:userId", getDepositHistory);

// API: Tạo lại URL thanh toán VNPay cho giao dịch nạp tiền đang chờ (pending)
vnpayRouter.get("/continue-payment/:depositId", continuePayment);

// API: Xóa một bản ghi nạp tiền (lịch sử giao dịch)
vnpayRouter.delete("/history/:id", deleteDepositRecord);

export default vnpayRouter;
