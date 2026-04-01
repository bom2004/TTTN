import attendanceModel from "../models/attendanceModel.ts";
import ShiftSchedule from "../models/shiftModel.ts";
import { ATTENDANCE_CONFIG } from "../config/attendanceConfig.ts";
import { calculateDistance } from "../utils/geoUtils.ts";
import mongoose from "mongoose";
import imagekit from "../config/imagekit.ts";

/**
 * Service: Chấm công (Check-in)
 */
export const checkInService = async (userId: string, securityData: any) => {
    const now = new Date();
    // Chuyển đổi sang múi giờ Việt Nam (GMT+7) để tính toán chính xác
    const vietnamOffset = 7 * 60 * 60 * 1000;
    const vietnamNow = new Date(now.getTime() + vietnamOffset);
    
    const hours = vietnamNow.getUTCHours();
    const minutes = vietnamNow.getUTCMinutes();
    let targetDateStr = vietnamNow.toISOString().split('T')[0];

    // Kiểm tra bảo mật cơ bản
    if (ATTENDANCE_CONFIG.TRUSTED_IP && securityData.ip_address && securityData.ip_address !== ATTENDANCE_CONFIG.TRUSTED_IP) {
        throw new Error("Sai địa chỉ IP mạng khách sạn.");
    }

    let distance = 0;
    if (securityData.latitude && securityData.longitude) {
        distance = calculateDistance(
            Number(securityData.latitude), 
            Number(securityData.longitude), 
            ATTENDANCE_CONFIG.HOTEL_LOCATION.latitude, 
            ATTENDANCE_CONFIG.HOTEL_LOCATION.longitude
        );
        if (distance > ATTENDANCE_CONFIG.ALLOWED_RADIUS) {
            throw new Error(`Khoảng cách quá xa (${distance}m).`);
        }
    }

    // --- Upload ảnh lên ImageKit nếu có ---
    let imageUrl = "";
    if (securityData.image_base64) {
        try {
            const uploadRes = await imagekit.upload({
                file: securityData.image_base64, // ImageKit hỗ trợ nhận cả dataURL
                fileName: `attendance_${userId}_${Date.now()}.jpg`,
                folder: "/attendance/evidence",
            });
            imageUrl = uploadRes.url;
        } catch (uploadError) {
            console.error("[ImageKit Upload Error]:", uploadError);
            // Vẫn cho phép điểm danh nếu upload ảnh lỗi? 
            // Tùy policy, ở đây ta có thể throw error nếu cấu hình yêu cầu ảnh
            if (ATTENDANCE_CONFIG.REQUIRE_IMAGE) {
                throw new Error("Lỗi tải ảnh minh chứng lên hệ thống.");
            }
        }
    }

    // Ghi nhận chấm công
    const shift = await ShiftSchedule.findOne({ user_id: userId, date: targetDateStr });
    let finalStatus: any = 'on_time';
    if (shift) {
        if (shift.shift_type === 'day' && (hours > 7 || (hours === 7 && minutes > 15))) finalStatus = 'late';
        if (shift.shift_type === 'night' && (hours > 17 || (hours === 17 && minutes > 15))) finalStatus = 'late';
    }

    const data: any = {
        user_id: userId,
        date: targetDateStr,
        check_in_time: now,
        status: finalStatus,
        note: finalStatus === 'late' ? 'Muộn' : 'Đúng giờ',
        image_evidence: imageUrl || '',
    };

    if (securityData.latitude) {
        data.location_data = {
            latitude: Number(securityData.latitude),
            longitude: Number(securityData.longitude),
            distance: distance
        };
    }

    return await attendanceModel.create(data);
};

/**
 * Service: Kết thúc ca (Check-out) - CỰC KỲ TỐI ƯU
 */
export const checkOutService = async (userId: string) => {
    try {
        if (!userId) throw new Error("ID người dùng không hợp lệ.");

        const now = new Date();
        
        // 1. Tìm bản ghi chưa Check-out của nhân viên
        // Sử dụng toán tử so sánh chuỗi hoặc ObjectId linh hoạt
        const attendance = await attendanceModel.findOne({ 
            user_id: userId, 
            check_out_time: { $exists: false }
        }).sort({ createdAt: -1 });

        if (!attendance) {
            throw new Error("Không tìm thấy ca làm việc chưa kết thúc.");
        }

        // 2. Tính toán số giờ làm việc
        const checkInTime = new Date(attendance.check_in_time!);
        const diffMs = now.getTime() - checkInTime.getTime();
        const diffHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

        // 3. Thực hiện cập nhật trực tiếp với Mongoose Model Method
        // Không dùng .save() để tránh Validation Schema cũ
        const updated = await attendanceModel.findByIdAndUpdate(
            attendance._id,
            { 
                $set: { 
                    check_out_time: now,
                    total_hours: diffHours
                } 
            },
            { new: true, runValidators: false } // Tắt hoàn toàn validator cho bản ghi cũ
        );

        if (!updated) throw new Error("Lỗi khi cập nhật bản ghi vào Database.");

        return updated;
    } catch (error: any) {
        console.error("Critical Error in checkOutService:", error);
        throw error;
    }
};

export const getMyAttendanceService = async (userId: string) => {
    return await attendanceModel.find({ user_id: userId }).sort({ date: -1 });
};

export const getAllAttendanceService = async (monthYear?: string) => {
    let query: any = {};
    if (monthYear) query.date = { $regex: `^${monthYear}` };
    return await attendanceModel.find(query).populate('user_id', 'full_name email role avatar').sort({ date: -1 });
};

export const grantLeaveService = async (userId: string, date: string, note?: string) => {
    return await attendanceModel.findOneAndUpdate(
        { user_id: userId, date: date },
        { $set: { status: 'approved_leave', note: note || 'Nghỉ phép' } },
        { new: true, upsert: true }
    );
};
