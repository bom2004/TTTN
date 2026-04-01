import attendanceModel from "../models/attendanceModel.ts";
import ShiftSchedule from "../models/shiftModel.ts";
import userModel from "../models/userModel.ts";

/**
 * Service tính toán bảng công tổng hợp của toàn bộ nhân viên trong 1 tháng
 * @param year Năm cần xem
 * @param month Tháng cần xem (1-12)
 */
export const getMonthlyAttendanceSummaryService = async (year: number, month: number) => {
    // 1. Lấy danh sách tất cả nhân viên (Lễ tân & Kế toán)
    const staffs = await userModel.find({ role: { $in: ['receptionist', 'accountant'] } }).select('full_name email role avatar');

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    const summary = await Promise.all(staffs.map(async (staff) => {
        const userId = staff._id;

        // 2. Đếm số ca được phân trong tháng (Shift)
        const totalShifts = await ShiftSchedule.countDocuments({
            user_id: userId,
            date: { $gte: startDate, $lte: endDate }
        });

        // 3. Lấy dữ liệu chấm công thực tế (Attendance)
        // Lưu ý: date trong attendanceModel đang lưu dạng chuỗi YYYY-MM-DD
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        const attendanceRecords = await attendanceModel.find({
            user_id: userId,
            date: { $regex: `^${monthStr}` }
        });

        // 4. Tính toán các chỉ số
        const presentCount = attendanceRecords.filter(r => r.check_in_time).length;
        const leaveCount = attendanceRecords.filter(r => r.status === 'approved_leave').length;
        const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
        const totalWorkHours = attendanceRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0);
        
        // Vắng mặt = (Số ca được phân) - (Số ca đi làm) - (Số ca nghỉ phép có duyệt)
        const absentCount = Math.max(0, totalShifts - presentCount - leaveCount);

        return {
            staffInfo: staff,
            stats: {
                totalShifts,
                presentCount,
                absentCount,
                leaveCount,
                lateCount,
                totalWorkHours: parseFloat(totalWorkHours.toFixed(2))
            }
        };
    }));

    return summary;
};
