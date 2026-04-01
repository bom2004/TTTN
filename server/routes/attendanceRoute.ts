import express from "express";
import { checkIn, checkOut, getMyAttendance, getAllAttendance, grantLeave } from "../controllers/attendanceController.ts";

const attendanceRouter = express.Router();

// Nhân viên tự điểm danh
attendanceRouter.post("/check-in", checkIn);

// Nhân viên kết thúc ca
attendanceRouter.post("/check-out", checkOut);

// Lấy lịch sử điểm danh của 1 người
attendanceRouter.get("/my-attendance/:userId", getMyAttendance);

// Admin / Quản lý lấy toàn bộ điểm danh (có thể lọc theo tháng)
attendanceRouter.get("/all", getAllAttendance);

// Admin cấp phép nghỉ cho nhân viên
attendanceRouter.post("/grant-leave", grantLeave);

export default attendanceRouter;
