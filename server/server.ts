import 'dotenv/config';
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import connectDB from "./config/db.ts";
import userRouter from "./routes/userRoute.ts";
import authRouter from "./routes/authRoute.ts";
import roomTypeRouter from "./routes/roomTypeRoute.ts";
import roomRouter from "./routes/roomRoute.ts";
import vnpayRouter from "./routes/vnpayRoute.ts";
import promotionRouter from "./routes/promotionRoute.ts";
import searchRouter from "./routes/searchRoute.ts";
import bookingRouter from "./routes/bookingRoute.ts";


const app = express();

await connectDB();

// Cấu hình Middleware (Các phần mềm trung gian)
app.use(cors());
app.use(express.json());

// Định nghĩa các luồng API (Routes)
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/room-types", roomTypeRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/vnpay", vnpayRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/search", searchRouter);
app.use("/api/bookings", bookingRouter);

app.get('/', (_req: Request, res: Response) => res.send('API is working'));

// Bộ xử lý lỗi toàn cục (Global Error Handler)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Global Error Handler:", err);
    
    // Xử lý các lỗi liên quan đến Multer (Tải tệp tin)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: "File quá lớn! Vui lòng chọn ảnh dưới 5MB." });
    }
    
    if (err.message === 'Chỉ cho phép tải lên hình ảnh!') {
        return res.status(400).json({ success: false, message: err.message });
    }

    res.status(err.status || 500).json({ 
        success: false, 
        message: err.message || "Đã xảy ra lỗi hệ thống" 
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

