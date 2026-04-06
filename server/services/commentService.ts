import commentModel from "../models/commentModel.ts";
import roomTypeModel from "../models/roomTypeModel.ts";
import bookingModel from "../models/bookingModel.ts";
import { calculateNewAverageRating } from "../utils/commentUtils.ts";

/**
 * Service: Thêm bình luận cho người dùng
 * (Yêu cầu đơn hàng hoàn thành status: 'completed')
 */
export const saveComment = async (commentData: any) => {
    const { userId, roomTypeId, bookingId, rating, comment, images } = commentData;

    // 1. Kiểm tra đơn đặt phòng (phải là completed mới cho đánh giá)
    const booking = await bookingModel.findOne({ 
        _id: bookingId, 
        userId, 
        status: 'completed' 
    });

    if (!booking) {
        throw new Error("Không tìm thấy đơn đặt phòng hợp lệ hoặc đơn hàng chưa hoàn thành để thực hiện đánh giá.");
    }

    // 2. Chặn đánh giá trùng lặp cho đơn đặt phòng
    const existingReview = await commentModel.findOne({ bookingId });
    if (existingReview) {
        throw new Error("Bạn đã thực hiện đánh giá cho đơn đặt phòng này rồi.");
    }

    // 3. Tạo bản ghi bình luận mới
    const newComment = new commentModel({
        userId,
        roomTypeId,
        bookingId,
        rating: Number(rating),
        comment,
        images: images || []
    });

    const savedComment = await newComment.save();

    // 4. Đồng bộ hóa rating trung bình sang bảng RoomType
    const roomType = await roomTypeModel.findById(roomTypeId);
    if (roomType) {
        const currentRating = roomType.rating || 0;
        const currentCount = roomType.reviewCount || 0;
        
        // Tính điểm trung bình mới
        const updatedRating = calculateNewAverageRating(currentRating, currentCount, Number(rating));
        
        // Cập nhật roomType
        roomType.rating = updatedRating;
        roomType.reviewCount = currentCount + 1;
        await roomType.save();
    }

    return savedComment;
};

/**
 * Service: Lấy danh sách bình luận (Có phân trang nếu cần)
 */
export const fetchCommentsByRoomType = async (targetId: string) => {
    return await commentModel.find({ roomTypeId: targetId, isHidden: false })
        .populate("userId", "full_name avatar") 
        .sort({ createdAt: -1 });
};

export const fetchAllCommentsForAdmin = async () => {
    return await commentModel.find()
        .populate('userId', 'full_name avatar email')
        .populate('roomTypeId', 'name')
        .sort({ createdAt: -1 });
};

/**
 * Service: Phản hồi bình luận (Dành cho Admin/Nhân viên)
 */
export const updateCommentReply = async (commentId: string, replyContent: string) => {
    const updated = await commentModel.findByIdAndUpdate(
        commentId, 
        { reply: replyContent }, 
        { new: true }
    );
    
    if (!updated) throw new Error("Không tìm thấy bình luận này.");
    return updated;
};

/**
 * Service: Xóa bình luận (Dành cho Admin)
 */
export const removeComment = async (commentId: string) => {
    const comment = await commentModel.findById(commentId);
    if (!comment) throw new Error("Bình luận không tồn tại.");

    // Sử dụng logic Toggle để Admin có thể Ẩn hoặc Hiện lại bình luận
    comment.isHidden = !comment.isHidden;
    return await comment.save();
};
