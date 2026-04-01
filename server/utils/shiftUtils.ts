/**
 * Hàm hỗ trợ: Chuẩn hóa ngày tháng về chuẩn 00:00:00 UTC
 * Đảm bảo việc so sánh và lưu trữ lịch phân ca (Schedule) không bị lệch múi giờ.
 */
export const normalizeShiftDate = (dateStr: string | Date): Date => {
    const d = new Date(dateStr);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

/**
 * Hàm hỗ trợ: Kiểm tra và làm sạch mảng ID nhân sự
 * Loại bỏ các giá trị không hợp lệ (null, undefined, rỗng) truyền từ Client.
 */
export const sanitizeStaffIds = (ids: any): string[] => {
    if (!Array.isArray(ids)) return [];
    return ids.filter(id => id && typeof id === 'string' && id.trim().length > 5);
};

/**
 * Hàm hỗ trợ: Phân tích logic gộp/tách danh sách ca làm
 * Đảm bảo tính duy nhất của nhân sự: 1 người không thể vừa ca ngày vừa ca đêm trong 1 ngày.
 */
export const resolveUniqueShifts = (dayIds: any, nightIds: any, fullDayIds: any = []) => {
    const cleanDayIds = sanitizeStaffIds(dayIds);
    const cleanNightIds = sanitizeStaffIds(nightIds);
    const cleanFullDayIds = sanitizeStaffIds(fullDayIds);
    
    // 1. Ưu tiên Ca Cả Ngày trước
    const fullDaySet = new Set(cleanFullDayIds);
    
    // 2. Nếu đã ở Ca Cả Ngày thì xóa khỏi Ca Sáng và Ca Tối
    const finalDayIds = cleanDayIds.filter(id => !fullDaySet.has(id));
    const daySet = new Set(finalDayIds);
    
    // 3. Nếu đã ở Ca Cả Ngày hoặc Ca Sáng thì xóa khỏi Ca Tối
    const finalNightIds = cleanNightIds.filter(id => !fullDaySet.has(id) && !daySet.has(id));
    
    return {
        dayShift: finalDayIds,
        nightShift: finalNightIds,
        fullDayShift: cleanFullDayIds
    };
};
