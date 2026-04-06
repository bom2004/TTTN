/**
 * Utils: Các hàm hỗ trợ cho tính năng bình luận
 */
export const calculateNewAverageRating = (currentRating: number, currentCount: number, newRating: number): number => {
    // Nếu chưa có đánh giá nào, điểm mới chính là điểm vừa nhập
    if (currentCount === 0) return newRating;

    // Công thức: [(rating_cu * count_cu) + rating_vua_nhap] / (count_cu + 1)
    const newAverage = ((currentRating * currentCount) + newRating) / (currentCount + 1);
    
    // Làm tròn đến 1 chữ số thập phân (Ví dụ: 4.456 -> 4.5)
    return Math.round(newAverage * 10) / 10;
};
