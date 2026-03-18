import { Request, Response } from "express";
import promotionModel from "../models/promotionModel.ts";
import userModel from "../models/userModel.ts";
import imagekit from "../config/imagekit.ts";

const calculateGeniusLevel = (totalRecharged: number): number => {
    if (!totalRecharged || totalRecharged < 100000) return 0;
    if (totalRecharged < 500000) return 1;
    const level = Math.floor(totalRecharged / 500000) + 1;
    return Math.min(level, 10);
};


// Create or Update Promotion
export const savePromotion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (req.file) {
            const uploadResponse = await imagekit.upload({
                file: req.file.buffer.toString("base64"),
                fileName: `promotion_${Date.now()}`,
                folder: "/promotions",
            });
            data.image = uploadResponse.url;
        }

        if (data.roomTypes && typeof data.roomTypes === 'string') {
            try {
                data.roomTypes = JSON.parse(data.roomTypes);
            } catch (e) {
                console.error("Lỗi parse roomTypes:", e);
            }
        }

        // Sanitize roomTypes to be an array of IDs
        if (Array.isArray(data.roomTypes)) {
            data.roomTypes = data.roomTypes.map((rt: any) => typeof rt === 'string' ? rt : rt._id).filter(Boolean);
        }

        if (id) {
            // Update
            const updatedPromo = await promotionModel.findByIdAndUpdate(id, data, { new: true });
            if (!updatedPromo) {
                res.status(404).json({ success: false, message: "Không tìm thấy khuyến mãi" });
                return;
            }
            res.json({ success: true, message: "Cập nhật khuyến mãi thành công", data: updatedPromo });
        } else {
            // Create
            const exists = await promotionModel.findOne({ code: data.code });
            if (exists) {
                res.status(400).json({ success: false, message: "Mã khuyến mãi đã tồn tại" });
                return;
            }
            const newPromo = new promotionModel(data);
            await newPromo.save();
            res.status(201).json({ success: true, message: "Tạo khuyến mãi thành công", data: newPromo });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all promotions (Admin)
export const getPromotions = async (req: Request, res: Response): Promise<void> => {
    try {
        const promos = await promotionModel.find().populate('roomTypes', 'name').sort({ createdAt: -1 });
        res.json({ success: true, data: promos });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle Status (Admin)
export const togglePromotionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const promo = await promotionModel.findById(id);

        if (!promo) {
            res.status(404).json({ success: false, message: "Không tìm thấy khuyến mãi" });
            return;
        }

        promo.status = promo.status === 'active' ? 'inactive' : 'active';
        await promo.save();

        res.json({ success: true, message: `Đã ${promo.status === 'active' ? 'kích hoạt' : 'tạm ngưng'} khuyến mãi`, data: promo });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Promotion (Admin)
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

// Validate Promotion (Client)
export const validatePromotion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, orderValue, userId, roomTypeId } = req.body;

        if (!code) {
            res.status(400).json({ success: false, message: "Vui lòng nhập mã khuyến mãi" });
            return;
        }

        const promo = await promotionModel.findOne({ code: code.toUpperCase() });

        if (!promo) {
            res.status(404).json({ success: false, message: "Mã khuyến mãi không tồn tại" });
            return;
        }

        if (promo.status !== 'active') {
            res.status(400).json({ success: false, message: "Mã khuyến mãi không hoạt động" });
            return;
        }

        const now = new Date();
        if (now < new Date(promo.startDate) || now > new Date(promo.endDate)) {
            res.status(400).json({ success: false, message: "Mã khuyến mãi đã hết hạn hoặc chưa đến thời gian sử dụng" });
            return;
        }

        if (orderValue && promo.minOrderValue > orderValue) {
            res.status(400).json({ success: false, message: `Đơn hàng tối thiểu phải từ ${promo.minOrderValue.toLocaleString('vi-VN')}đ` });
            return;
        }

        if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
            res.status(400).json({ success: false, message: "Mã khuyến mãi đã hết lượt sử dụng" });
            return;
        }

        if (userId && promo.usedBy && promo.usedBy.some(id => id.toString() === userId)) {
            res.status(400).json({ success: false, message: "Bạn đã sử dụng mã khuyến mãi này rồi" });
            return;
        }

        // Check loại phòng có hợp lý
        if (roomTypeId && promo.roomTypes && promo.roomTypes.length > 0) {
            const isApplicable = promo.roomTypes.some(id => id.toString() === roomTypeId);
            if (!isApplicable) {
                res.status(400).json({ success: false, message: "Mã khuyến mãi không áp dụng cho loại phòng này" });
                return;
            }
        }

        if (promo.minGeniusLevel > 0) {
            if (!userId) {
                res.status(401).json({ success: false, message: "Bạn cần đăng nhập để sử dụng mã này" });
                return;
            }

            const user = await userModel.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
                return;
            }

            const userLevel = calculateGeniusLevel(user.totalRecharged || 0);

            if (userLevel < promo.minGeniusLevel) {
                res.status(400).json({ success: false, message: `Mã này chỉ dành cho khách hàng hạng Genius ${promo.minGeniusLevel} trở lên. Hạng của bạn hiện tại là Genius ${userLevel}.` });
                return;
            }
        }

        res.json({
            success: true,
            message: "Mã hợp lệ",
            data: {
                discountPercent: promo.discountPercent,
                code: promo.code,
                minOrderValue: promo.minOrderValue,
                minGeniusLevel: promo.minGeniusLevel,
                roomTypes: promo.roomTypes
            }
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user's promotion history (Client)
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
