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
import commentRouter from "./routes/commentRoute.ts";
import statsRouter from "./routes/statsRoute.ts";
import chatRouter from "./routes/chatRoutes.ts";

import { createServer } from 'http';
import { initSocket } from './socket.ts';
import { initBookingCleanupTask } from './tasks/bookingCleanup.ts';
import { globalErrorHandler } from './middlewares/errorMiddleware.ts';

const app = express();
const httpServer = createServer(app);

await connectDB();

// Initialize Socket.io
initSocket(httpServer);

// Initialize Tasks (Dọn dẹp đơn ảo,...)
initBookingCleanupTask();

// Cấu hình Middleware (Các phần mềm trung gian)
app.use(cors());
app.use(express.json());

// Định nghĩa các luồng API (Routes)
app.use("/api/stats", statsRouter);
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/room-types", roomTypeRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/vnpay", vnpayRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/search", searchRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/comments", commentRouter);
app.use("/api/chat", chatRouter);

app.get('/', (_req: Request, res: Response) => res.send('API is working'));

// Bộ xử lý lỗi toàn cục (Global Error Handler)
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

