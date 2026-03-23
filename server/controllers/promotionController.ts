import { Request, Response } from "express";
import promotionModel from "../models/promotionModel.ts";
import {
    processSavePromotion,
    validatePromoCode
} from "../services/promotionService.ts";

/**
 * Controller: Lưu hoặc cập nhật mã khuyến mãi (Admin)
 */
export const savePromotion = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id; // Lấy trực tiếp từ params
        const data = req.body;
        const file = (req as any).file; // Ép kiểu any để tránh lỗi TypeScript không tìm thấy trường file

        // Gọi Service xử lý upload ảnh, parse roomTypes và lưu DB
        const promotion = await processSavePromotion(id as any, data, file);

        res.status(id ? 200 : 201).json({
            success: true,
            message: id ? "Cập nhật khuyến mãi thành công" : "Tạo khuyến mãi thành công",
            data: promotion
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Lấy danh sách toàn bộ khuyến mãi (Admin)
 */
export const getPromotions = async (req: Request, res: Response): Promise<void> => {
    try {
        const promos = await promotionModel.find().populate('roomTypes', 'name').sort({ createdAt: -1 });
        res.json({ success: true, data: promos });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Bật/Tắt trạng thái hoạt động (Admin)
 */
export const togglePromotionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const promo = await promotionModel.findById(id);

        if (!promo) {
            res.status(404).json({ success: false, message: "Không tìm thấy khuyến mãi" });
            return;
        }

        // Thay đổi trạng thái
        promo.status = promo.status === 'active' ? 'inactive' : 'active';
        await promo.save();

        res.json({ success: true, message: `Đã ${promo.status === 'active' ? 'kích hoạt' : 'tạm ngưng'} khuyến mãi`, data: promo });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Xóa khuyến mãi (Admin)
 */
export const deletePromotion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const promo = await promotionModel.findByIdAndDelete(id);

        if (!promo) {
            res.status(404).json({ success: false, message: "Không tìm thấy khuyến mãi" });
            return;
        }

        res.json({ success: true, message: "Xóa khuyến mãi thành công" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Kiểm tra tính hợp lệ của mã (Client)
 */
export const validatePromotion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, orderValue, userId, roomTypeId } = req.body;

        // Gọi Service để xác thực mã khuyến mãi
        const promoData = await validatePromoCode(code, orderValue, userId, roomTypeId);

        res.json({
            success: true,
            message: "Mã hợp lệ",
            data: promoData
        });

    } catch (error: any) {
        // Trả về thông báo lỗi cụ thể từ Service (Ví dụ: Mã hết hạn, đơn hàng chưa đủ...)
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Lấy lịch sử sử dụng khuyến mãi của người dùng (Client)
 */
export const getUserPromotionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const promos = await promotionModel.find({
            usedBy: userId
        }).populate('roomTypes', 'name').sort({ updatedAt: -1 });

        res.json({ success: true, data: promos });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
