import { Request, Response } from "express";
import {
    processSaveRoomType,
    fetchRoomTypes,
    removeRoomType
} from "../services/roomTypeService.ts";

/**
 * Controller: Thêm loại phòng mới
 */
export const addRoomType = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;
        const files = req.files as any[];

        // Gọi Service để tạo loại phòng và xử lý ảnh
        const newRoomType = await processSaveRoomType(undefined, data, files);

        res.status(201).json({ success: true, message: "Thêm loại phòng thành công", data: newRoomType });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Lấy danh sách toàn bộ loại phòng (Admin/Public)
 */
export const getAllRoomTypes = async (req: Request, res: Response): Promise<void> => {
    try {
        const isAdmin = req.query.admin === 'true';

        // Gọi Service lấy dữ liệu theo trạng thái
        const roomTypes = await fetchRoomTypes(isAdmin);

        res.json({ success: true, data: roomTypes });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Cập nhật loại phòng
 */
export const updateRoomType = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const data = req.body;
        const files = req.files as any[];

        // Gọi Service để cập nhật dữ liệu và ảnh mới nếu có
        const updated = await processSaveRoomType(id as any, data, files);

        res.json({ success: true, message: "Cập nhật loại phòng thành công", data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Xóa loại phòng
 */
export const deleteRoomType = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Gọi Service xóa dựa trên ID
        await removeRoomType(id as any);

        res.json({ success: true, message: "Xóa loại phòng thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};
