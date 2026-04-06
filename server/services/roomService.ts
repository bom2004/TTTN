import roomModel from "../models/roomModel.ts";
import bookingModel from "../models/bookingModel.ts";
import bookingDetailModel from "../models/bookingDetailModel.ts";
import imagekit from "../config/imagekit.ts";
import { normalizeDateUTC } from "../utils/roomUtils.ts";

/**
 * Service: Xử lý upload hình ảnh Thumbnail và Gallery của phòng lên ImageKit
 */
export const handleRoomImageUpload = async (name: string, files: any, isUpdate: boolean = false) => {
    let thumbnailUrl = "";
    let imagesUrls: string[] = [];

    // 1. Xử lý Thumbnail
    if (files?.thumbnail?.[0]) {
        const thumbRes = await imagekit.upload({
            file: files.thumbnail[0].buffer.toString("base64"),
            fileName: `room_thumb_${name.replace(/\s+/g, '_')}_${isUpdate ? 'upd_' : ''}${Date.now()}`,
            folder: "/rooms/thumbnails",
        });
        thumbnailUrl = thumbRes.url;
    }

    // 2. Xử lý Gallery
    if (files?.images) {
        for (const file of files.images) {
            const galleryRes = await imagekit.upload({
                file: file.buffer.toString("base64"),
                fileName: `room_gallery_${name.replace(/\s+/g, '_')}_${isUpdate ? 'upd_' : ''}${Date.now()}`,
                folder: "/rooms/gallery",
            });
            imagesUrls.push(galleryRes.url);
        }
    }

    return { thumbnailUrl, imagesUrls };
};

/**
 * Service: Tính toán phòng trống theo loại phòng (Inventory-based)
 */
export const calculateRoomAvailability = async (
    roomTypes: any[],
    checkIn: string | Date | undefined,
    checkOut: string | Date | undefined
) => {
    const targetIn = normalizeDateUTC(checkIn || new Date());
    const targetOut = normalizeDateUTC(checkOut || new Date(new Date().setDate(new Date().getDate() + 1)));

    // Lấy các đơn đặt trùng khoảng thời gian (Confirmed/Pending/Checked-in)
    const activeBookings = await bookingModel.find({
        status: { $nin: ['cancelled', 'completed', 'checked_out'] },
        checkInDate: { $lt: targetOut },
        checkOutDate: { $gt: targetIn }
    });

    // Gom số phòng đã đặt theo roomTypeId
    const bookedCountByRoomType: Record<string, number> = {};
    if (activeBookings.length > 0) {
        for (const b of activeBookings) {
            const rtId = b.roomTypeId?.toString();
            if (rtId) {
                bookedCountByRoomType[rtId] = (bookedCountByRoomType[rtId] || 0) + (b.roomQuantity || 1);
            }
        }
    }
    
    // Lấy tổng số lượng phòng vật lý thực tế không bị bảo trì (bán được)
    const physicalRoomsCountList = await roomModel.aggregate([
        { $match: { status: { $ne: 'maintenance' } } },
        { $group: { _id: "$roomTypeId", count: { $sum: 1 } } }
    ]);
    const physicalCountMap = new Map();
    physicalRoomsCountList.forEach(c => physicalCountMap.set(c._id.toString(), c.count));

    // Map lại danh sách loại phòng với inventory thực tế để cho phép đặt
    return roomTypes.map(rt => {
        const rtIdStr = rt._id.toString();
        const booked = bookedCountByRoomType[rtIdStr] || 0;
        
        // Ưu tiên dùng số lượng phòng vật lý đếm được từ aggregation
        // Nếu không tìm thấy (có thể do chưa tạo phòng hoặc lỗi mapping), dùng totalInventory từ Loại phòng làm fallback
        const baseAvail = physicalCountMap.has(rtIdStr) ? physicalCountMap.get(rtIdStr) : (rt.totalInventory || 0);

        const realTimeAvail = Math.max(0, baseAvail - booked);
        
        return {
            ...rt,
            availableRooms: realTimeAvail,
            status: realTimeAvail <= 0 ? 'sold_out' : 'available',
            // Gán thêm roomType vào chính nó vì component ở FE đang đọc `room.roomType` để hiển thị
            roomType: rt.name,
            price: rt.basePrice // Component đọc room.price nên ta map basePrice sang price
        };
    });
};

/**
 * Service: Đồng bộ tổng số lượng phòng vào Loại phòng (Lưu trực tiếp DB)
 */
export const syncRoomTypeInventory = async (roomTypeId: string) => {
    try {
        const { default: roomTypeModel } = await import('../models/roomTypeModel.ts');
        
        // Cập nhật tổng số lượng phòng (ALL rooms)
        const totalCount = await roomModel.countDocuments({ roomTypeId: roomTypeId });
        
        await roomTypeModel.findByIdAndUpdate(roomTypeId, { totalInventory: totalCount });
    } catch (error) {
        console.error("Lỗi khi đồng bộ số lượng loại phòng:", error);
    }
};
