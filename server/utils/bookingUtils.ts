/**
 * Hàm hỗ trợ: Chuẩn hóa ngày tháng về 00:00:00 theo chuẩn UTC (Tránh lệch múi giờ)
 */
export const normalizeDateToUTC = (dateStr: string | Date): Date => {
    const d = new Date(dateStr);
    // Sử dụng getUTC... để đảm bảo lấy đúng ngày tháng năm theo chuẩn, không bị lệch do múi giờ server
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Hàm hỗ trợ: Tính số đêm ở giữa Check-in và Check-out
 */
export const calculateNumNights = (checkIn: Date, checkOut: Date): number => {
    const diff = checkOut.getTime() - checkIn.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

/**
 * Hàm hỗ trợ: Tính cấp độ Thành viên của người dùng dựa trên tổng nạp
 * 0: Silver, 1: Gold, 2: Diamond, 3: Platinum
 */
export const calculateGeniusLevel = (totalRecharged: number): number => {
    if (!totalRecharged || totalRecharged < 10000000) return 0; // Silver
    if (totalRecharged < 50000000) return 1; // Gold
    if (totalRecharged < 150000000) return 2; // Diamond
    return 3; // Platinum
};
