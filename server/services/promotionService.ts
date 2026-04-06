import promotionModel from "../models/promotionModel.ts";
import userModel from "../models/userModel.ts";
import imagekit from "../config/imagekit.ts";
import { calculateGeniusLevel } from "../utils/bookingUtils.ts";
import { 
    formatPromotionCode, 
    isPromotionTimeValid 
} from "../utils/promotionUtils.ts";

/**
 * Service: Xử lý lưu hoặc cập nhật chương trình khuyến mãi (Bao gồm upload ảnh)
 */
export const processSavePromotion = async (id: string | undefined, data: any, file?: any) => {
    const updateData = { ...data };

    // 1. Chuẩn hóa mã khuyến mãi (Viết hoa từ Utils)
    if (updateData.code) {
        updateData.code = formatPromotionCode(updateData.code);
    }

    // 2. Xử lý upload ảnh (nếu có)
    if (file) {
        const uploadRes = await imagekit.upload({
            file: file.buffer.toString("base64"),
            fileName: `promotion_${Date.now()}`,
            folder: "/promotions",
        });
        updateData.image = uploadRes.url;
    }

    // 3. Xử lý chuyển đổi roomTypes (nếu là chuỗi JSON)
    if (updateData.roomTypes && typeof updateData.roomTypes === 'string') {
        try {
            updateData.roomTypes = JSON.parse(updateData.roomTypes);
        } catch (e) {
            console.error("Lỗi phân tích roomTypes:", e);
        }
    }

    // 4. Chuẩn hóa mảng các ID phòng (Sanitize)
    if (Array.isArray(updateData.roomTypes)) {
        updateData.roomTypes = updateData.roomTypes
            .map((rt: any) => typeof rt === 'string' ? rt : rt._id)
            .filter(Boolean);
    }

    if (id) {
        // Cập nhật khuyến mãi cũ
        const updated = await promotionModel.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
        if (!updated) throw new Error("Không tìm thấy chương trình khuyến mãi để cập nhật.");
        return updated;
    } else {
        // Kiểm tra xem mã đã tồn tại chưa (với đơn tạo mới)
        const exists = await promotionModel.findOne({ code: updateData.code });
        if (exists) throw new Error("Mã khuyến mãi này đã tồn tại trong hệ thống.");
        
        const newPromo = new promotionModel(updateData);
        await newPromo.save();
        return newPromo;
    }
};

/**
 * Service: Xác thực mã khuyến mãi (Validation core logic)
 */
export const validatePromoCode = async (
    code: string,
    orderValue: number,
    userId?: string,
    roomTypeId?: string
) => {
    if (!code) throw new Error("Vui lòng nhập mã khuyến mãi");

    // Lấy mã chuẩn hóa từ Utils
    const formattedCode = formatPromotionCode(code);
    const promo = await promotionModel.findOne({ code: formattedCode });

    if (!promo) throw new Error("Mã khuyến mãi này không tồn tại.");
    if (promo.status !== 'active') throw new Error("Khuyến mãi đã tạm ngưng hoặc kết thúc.");

    // Kiểm tra thời gian hiệu lực từ Utils
    if (!isPromotionTimeValid(promo.startDate, promo.endDate)) {
        throw new Error("Mã khuyến mãi đã hết hạn hoặc chưa đến thời gian hiệu lực.");
    }

    if (orderValue && promo.minOrderValue > orderValue) {
        throw new Error(`Đơn hàng tối thiểu phải từ ${promo.minOrderValue.toLocaleString('vi-VN')}đ`);
    }

    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
        throw new Error("Mã này đã hết lượt sử dụng.");
    }

    if (userId && promo.usedBy && promo.usedBy.some(id => id.toString() === userId)) {
        throw new Error("Mã này khách hàng đã sử dụng một lần rồi.");
    }

    // Kiểm tra loại phòng áp dụng
    if (roomTypeId && promo.roomTypes && promo.roomTypes.length > 0) {
        const isApplicable = promo.roomTypes.some(id => id.toString() === roomTypeId);
        if (!isApplicable) throw new Error("Mã này không áp dụng cho phòng bạn đặt.");
    }

    // Kiểm tra cấp độ Thành viên VIP
    if (promo.minGeniusLevel > 0) {
        if (!userId) throw new Error("Vui lòng đăng nhập để sử dụng mã đặc quyền Thành viên.");

        const user = await userModel.findById(userId);
        if (!user) throw new Error("Thông tin người dùng không tìm thấy.");

        const userLevel = calculateGeniusLevel(user.totalRecharged || 0);
        if (userLevel < promo.minGeniusLevel) {
            const levels = ['Silver', 'Gold', 'Diamond', 'Platinum'];
            const requireLevelName = levels[promo.minGeniusLevel] || 'Platinum';
            const currentLevelName = levels[userLevel] || 'Silver';
            throw new Error(`Mã này ưu đãi độc quyền dành cho hạng ${requireLevelName} trở lên. Bạn hiện đang ở hạng ${currentLevelName}. Hãy nạp thêm để thăng hạng!`);
        }
    }

    // Trả về dữ liệu chi tiết của khuyến mãi
    return {
        discountPercent: promo.discountPercent,
        code: promo.code,
        minOrderValue: promo.minOrderValue,
        minGeniusLevel: promo.minGeniusLevel,
        roomTypes: promo.roomTypes
    };
};
