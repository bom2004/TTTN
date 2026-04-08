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
 * Hàm hỗ trợ: Tính cấp độ Thành viên dựa trên TỔNG CHI TIÊU (đơn hoàn thành)
 * 0: Silver, 1: Gold, 2: Diamond, 3: Platinum
 */
export const calculateGeniusLevel = (totalSpent: number): number => {
    if (!totalSpent || totalSpent < 2000000) return 0; // Silver (Dưới 2 triệu)
    if (totalSpent < 7000000) return 1; // Gold (2 - 7 triệu)
    if (totalSpent < 12000000) return 2; // Diamond (7 - 12 triệu)
    return 3; // Platinum (Trên 12 triệu)
};

/**
 * Hàm hỗ trợ: Định dạng ngày hiển thị VN
 */
export const formatDateVN = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('vi-VN');
};

/**
 * Hàm hỗ trợ: Kiểm tra xem đơn đặt phòng có nằm trong thời gian được phép hủy/hoàn tiền miễn phí không.
 * Điều kiện: Trước 24h so với Check-in HOẶC trong vòng 30 phút sau khi đặt.
 */
export const isEligibleForFreeCancellation = (checkInDate: Date, createdAt: Date): boolean => {
    const now = new Date().getTime();
    const checkInTime = new Date(checkInDate).getTime();
    const createdAtTime = new Date(createdAt).getTime();

    const hoursBeforeCheckIn = (checkInTime - now) / (1000 * 60 * 60);
    const minsSinceBooking = (now - createdAtTime) / (1000 * 60);

    return hoursBeforeCheckIn >= 24 || minsSinceBooking <= 30;
};
