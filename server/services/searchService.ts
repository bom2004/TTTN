import roomModel from "../models/roomModel.ts";
import roomTypeModel from "../models/roomTypeModel.ts";
import promotionModel from "../models/promotionModel.ts";

/**
 * Service: Tìm kiếm toàn cầu trên toàn bộ Phòng, Loại phòng và Khuyến mãi
 * Trả về kết quả phân loại
 */
export const performGlobalSearch = async (query: string) => {
    const searchQuery = String(query);

    // 1. Tìm kiếm trong danh sách Phòng (theo tên, mô tả, loại phòng)
    const rooms = await roomModel.find({
        $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } },
            { roomType: { $regex: searchQuery, $options: 'i' } }
        ]
    });

    // 2. Tìm kiếm trong danh sách Loại phòng (theo tên, mô tả)
    const roomTypes = await roomTypeModel.find({
        $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } }
        ]
    });

    // 3. Tìm kiếm trong danh sách Khuyến mãi (theo mã, tiêu đề, mô tả)
    const promotions = await promotionModel.find({
        $or: [
            { code: { $regex: searchQuery, $options: 'i' } },
            { title: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } }
        ],
        status: 'active'
    });

    return {
        rooms,
        roomTypes,
        promotions
    };
};
