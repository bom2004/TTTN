import express from "express";
import {
    vnpayReturn,
    continueBookingPayment,
} from "../controllers/vnpayController.ts";

const vnpayRouter = express.Router();

// @route   GET /api/vnpay/vnpay-return
// API: Xử lý kết quả trả về từ VNPay (Chỉ thanh toán booking)
vnpayRouter.get("/vnpay-return", vnpayReturn);

// @route   GET /api/vnpay/continue-booking-payment/:bookingId
// API: Tạo lại URL thanh toán cho đơn đặt phòng chưa thanh toán đủ
vnpayRouter.get("/continue-booking-payment/:bookingId", continueBookingPayment);

export default vnpayRouter;
