import { Request, Response } from "express";
import { 
    checkInService, 
    checkOutService, 
    getMyAttendanceService, 
    getAllAttendanceService,
    grantLeaveService
} from "../services/attendanceService.ts";

/**
 * Controller: Điểm danh (Check-in)
 */
export const checkIn = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, latitude, longitude, image_base64 } = req.body; 
        const ip_address = req.ip || req.socket.remoteAddress;

        if (!userId) {
            res.status(400).json({ success: false, message: "Thiếu ID người dùng" });
            return;
        }

        const securityData = {
            ip_address,
            latitude: latitude ? Number(latitude) : undefined,
            longitude: longitude ? Number(longitude) : undefined,
            image_base64
        };

        const newAttendance = await checkInService(userId, securityData);
        
        res.status(200).json({ 
            success: true, 
            message: `Điểm danh thành công (${newAttendance.status === 'late' ? 'Đi muộn' : 'Đúng giờ'})`, 
            data: newAttendance 
        });

    } catch (error: any) {
        console.error("[Check-in Error]:", error);
        res.status(500).json({ success: false, message: error.message || "Lỗi hệ thống khi điểm danh" });
    }
};

/**
 * Controller: Kết thúc ca (Check-out)
 */
export const checkOut = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({ success: false, message: "Thiếu ID người dùng" });
            return;
        }

        const updatedAttendance = await checkOutService(userId);

        res.status(200).json({ 
            success: true, 
            message: "Kết thúc ca làm thành công", 
            data: updatedAttendance 
        });

    } catch (error: any) {
        console.error("[Check-out Error]:", error);
        res.status(500).json({ success: false, message: error.message || "Lỗi hệ thống khi kết thúc ca" });
    }
};

/**
 * Controller: Lấy lịch sử cá nhân
 */
export const getMyAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        // Sử dụng kiểu any để tránh lỗi TypeScript type mismatch tại thời điểm runtime
        const params: any = req.params;
        const userId = params.userId;

        if (!userId) {
            res.status(400).json({ success: false, message: "Thiếu ID người dùng trong URL" });
            return;
        }

        const records = await getMyAttendanceService(userId);
        res.status(200).json({ success: true, data: records });
    } catch (error: any) {
        console.error("[GetMyAttendance Error]:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Lấy toàn bộ (Admin)
 */
export const getAllAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        const { monthYear } = req.query;
        const records = await getAllAttendanceService(monthYear as string);
        res.status(200).json({ success: true, data: records });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Cấp phép nghỉ (Admin)
 */
export const grantLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, date, note } = req.body;

        if (!userId || !date) {
            res.status(400).json({ success: false, message: "Thiếu thông tin cấp phép (ID hoặc Ngày)" });
            return;
        }

        const record = await grantLeaveService(userId, date, note);
        res.status(200).json({ success: true, message: "Đã cấp phép nghỉ", data: record });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
