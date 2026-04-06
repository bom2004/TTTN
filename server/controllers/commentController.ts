import { Request, Response } from "express";
import { 
    saveComment, 
    fetchCommentsByRoomType, 
    updateCommentReply, 
    removeComment,
    fetchAllCommentsForAdmin
} from "../services/commentService.ts";

/**
 * Controller: Thêm bình luận mới
 */
export const addComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, roomTypeId, bookingId, rating, comment, images } = req.body;

        if (!userId || !roomTypeId || !bookingId || !rating || !comment) {
            res.status(400).json({ success: false, message: "Vui lòng cung cấp đầy đủ thông tin: userId, roomTypeId, bookingId, rating và nội dung bình luận." });
            return;
        }

        const newComment = await saveComment({
            userId,
            roomTypeId,
            bookingId,
            rating,
            comment,
            images
        });

        res.status(201).json({ success: true, message: "Đánh giá thành công!", data: newComment });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Lấy danh sách bình luận của Loại phòng
 */
export const getComments = async (req: Request, res: Response) => {
    const { roomTypeId } = req.query;
    try {
        const comments = await fetchCommentsByRoomType(roomTypeId as string);
        res.json({ success: true, data: comments });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllComments = async (req: Request, res: Response) => {
    try {
        const comments = await fetchAllCommentsForAdmin();
        res.json({ success: true, data: comments });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Admin phản hồi bình luận
 */
export const replyComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId, replyContent } = req.body;
        if (!commentId || !replyContent) {
            res.status(400).json({ success: false, message: "Thiếu ID bình luận hoặc nội dung phản hồi." });
            return;
        }

        const updated = await updateCommentReply(commentId, replyContent);
        res.json({ success: true, message: "Phản hồi thành công.", data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Xóa hoặc Ẩn bình luận (Admin)
 */
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId } = req.body;
        if (!commentId) {
            res.status(400).json({ success: false, message: "Thiếu ID bình luận." });
            return;
        }

        await removeComment(commentId);
        res.json({ success: true, message: "Xóa bình luận thành công." });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
