import ShiftSchedule from '../models/shiftModel';
import { normalizeShiftDate, resolveUniqueShifts } from '../utils/shiftUtils';

/**
 * Lấy danh sách phân ca theo tháng
 * @param year Năm cần lấy
 * @param month Tháng cần lấy (1-12)
 */
export const getShiftsByMonthService = async (year: number, month: number) => {
    // Sử dụng Utils để tạo đối tượng ngày chuẩn hóa (Sáng ngày 1 tháng này đến sáng ngày 1 tháng sau)
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    return await ShiftSchedule.find({
        date: { $gte: startDate, $lt: endDate }
    }).populate('user_id', 'full_name role');
};

/**
 * Lưu hoặc cập nhật phân ca cho một ngày cụ thể
 * @param date Ngày phân ca
 * @param dayShiftUserIds Danh sách ID nhân viên ca ngày
 * @param nightShiftUserIds Danh sách ID nhân viên ca đêm
 */
export const saveDailyShiftsService = async (
    date: string, 
    dayShiftUserIds: any, 
    nightShiftUserIds: any,
    fullDayShiftUserIds: any = []
) => {
    // 1. Chuẩn hóa ngày (Sử dụng Utils để đảm bảo đúng múi giờ UTC)
    const targetDate = normalizeShiftDate(date);

    // 2. Xóa lịch cũ của ngày này để ghi mới (Upsert logic)
    await ShiftSchedule.deleteMany({ date: targetDate });

    // 3. Sử dụng Utils để tiền xử lý và loại trùng nhân sự (Sanitize & Resolve)
    const { dayShift, nightShift, fullDayShift } = resolveUniqueShifts(dayShiftUserIds, nightShiftUserIds, fullDayShiftUserIds);

    const newShifts: any[] = [];
    
    // 4. Lên danh sách lưu trữ cho database
    dayShift.forEach((userId: string) => {
        newShifts.push({ user_id: userId, date: targetDate, shift_type: 'day' });
    });

    nightShift.forEach((userId: string) => {
        newShifts.push({ user_id: userId, date: targetDate, shift_type: 'night' });
    });

    fullDayShift.forEach((userId: string) => {
        newShifts.push({ user_id: userId, date: targetDate, shift_type: 'full_day' });
    });

    // 5. Nếu có dữ liệu, thực hiện lưu trữ vào database
    if (newShifts.length > 0) {
        return await ShiftSchedule.insertMany(newShifts, { ordered: false });
    }
    
    return [];
};
