/**
 * Hàm hỗ trợ: Chuẩn hóa mã khuyến mãi (Viết hoa và xóa khoảng trắng dư thừa)
 */
export const formatPromotionCode = (code: string): string => {
    return code.trim().toUpperCase();
};

/**
 * Hàm hỗ trợ: Kiểm tra thời gian hiệu lực của khuyến mãi
 */
export const isPromotionTimeValid = (startDate: Date, endDate: Date): boolean => {
    const now = new Date();
    return now >= new Date(startDate) && now <= new Date(endDate);
};

/**
 * Hàm hỗ trợ: Tính số tiền giảm giá dựa trên %
 */
export const calculateDiscount = (orderValue: number, discountPercent: number): number => {
    return (orderValue * discountPercent) / 100;
};
