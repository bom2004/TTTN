import 'dotenv/config';
import express, { Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db.ts";
import userRouter from "./routes/userRoute.ts";
import roomTypeRouter from "./routes/roomTypeRoute.ts";
import roomRouter from "./routes/roomRoute.ts";
import vnpayRouter from "./routes/vnpayRoute.ts";
import promotionRouter from "./routes/promotionRoute.ts";
import searchRouter from "./routes/searchRoute.ts";
import bookingRouter from "./routes/bookingRoute.ts";


const app = express();

await connectDB();

//Middlewares
app.use(cors());
app.use(express.json());

//Routes
app.use("/api/user", userRouter);
app.use("/api/room-types", roomTypeRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/vnpay", vnpayRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/search", searchRouter);
app.use("/api/bookings", bookingRouter);

app.get('/', (_req: Request, res: Response) => res.send('API is working'));

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
    console.error("Global Error Handler:", err);
    
    // Handle Multer Errors
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

