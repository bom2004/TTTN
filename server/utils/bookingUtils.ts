/**
 * Hàm hỗ trợ: Chuẩn hóa ngày tháng về 00:00:00 theo chuẩn UTC (Tránh lệch múi giờ)
 */
export const normalizeDateToUTC = (dateStr: string | Date): Date => {
    const d = new Date(dateStr);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

/**
 * Hàm hỗ trợ: Tính số đêm ở giữa Check-in và Check-out
 */
export const calculateNumNights = (checkIn: Date, checkOut: Date): number => {
    const diff = checkOut.getTime() - checkIn.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

/**
 * Hàm hỗ trợ: Tính cấp độ Genius của người dùng dựa trên tổng nạp
 */
export const calculateGeniusLevel = (totalRecharged: number): number => {
    if (!totalRecharged || totalRecharged < 100000) return 0;
    if (totalRecharged < 500000) return 1;
    const level = Math.floor(totalRecharged / 500000) + 1;
    return Math.min(level, 10);
};
