import express from "express";
import {
    createPayment,
    vnpayReturn,
    getDepositHistory,
    continuePayment,
    continueBookingPayment,
    deleteDepositRecord
} from "../controllers/vnpayController.ts";

const vnpayRouter = express.Router();

// @route   POST /api/vnpay/create-payment
// API: Tạo URL thanh toán VNPay (Nạp ví)
vnpayRouter.post("/create-payment", createPayment);

// @route   GET /api/vnpay/vnpay-return
// API: Xử lý kết quả trả về từ VNPay (xác thực thanh toán & cập nhật số dư/đơn hàng)
vnpayRouter.get("/vnpay-return", vnpayReturn);

// @route   GET /api/vnpay/history/:userId
// API: Lấy lịch sử nạp tiền của một người dùng
vnpayRouter.get("/history/:userId", getDepositHistory);

// @route   GET /api/vnpay/continue-payment/:depositId
// API: Tạo lại URL thanh toán VNPay cho giao dịch nạp tiền đang chờ (pending)
vnpayRouter.get("/continue-payment/:depositId", continuePayment);

// @route   GET /api/vnpay/continue-booking-payment/:bookingId
// API: Tạo lại URL thanh toán cho đơn đặt phòng đang chờ (unpaid)
vnpayRouter.get("/continue-booking-payment/:bookingId", continueBookingPayment);

// @route   DELETE /api/vnpay/history/:id
// API: Xóa một bản ghi nạp tiền (lịch sử giao dịch)
vnpayRouter.delete("/history/:id", deleteDepositRecord);

export default vnpayRouter;
