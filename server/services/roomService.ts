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
 * Service: Tính toán phòng trống thực tế trong một khoảng thời gian (Dynamic Availability)
 */
export const calculateRoomAvailability = async (
    rooms: any[],
    checkIn: string | Date | undefined,
    checkOut: string | Date | undefined
) => {
    // 1. Chuẩn hóa ngày (Mặc định là hôm nay và ngày mai nếu không có)
    const targetIn = normalizeDateUTC(checkIn || new Date());
    const targetOut = normalizeDateUTC(checkOut || new Date(new Date().setDate(new Date().getDate() + 1)));

    // 2. Tìm các đơn đặt trùng khoảng thời gian (Confirmed/Pending)
    const activeBookings = await bookingModel.find({
        status: { $nin: ['cancelled', 'completed'] },
        checkInDate: { $lt: targetOut },
        checkOutDate: { $gt: targetIn }
    });

    // 3. Đếm số lượng loại phòng đã bị đặt
    const bookedCountByRoom: Record<string, number> = {};
    if (activeBookings.length > 0) {
        const ids = activeBookings.map(b => b._id);
        const details = await bookingDetailModel.find({
            bookingId: { $in: ids },
            roomStatus: { $ne: 'cancelled' }
        });

        for (const detail of details) {
            const rid = detail.roomId.toString();
            bookedCountByRoom[rid] = (bookedCountByRoom[rid] || 0) + 1;
        }
    }

    // 4. Map lại danh sách phòng với trạng thái thực tế
    return rooms.map(room => {
        const ridStr = room._id.toString();
        const booked = bookedCountByRoom[ridStr] || 0;
        let baseAvail = Number(room.availableRooms || 0);

        // --- FALLBACK: Khôi phục capacity nếu DB lỗi kẹt ở 0 (như logic cũ) ---
        if (baseAvail < 1 && booked === 0) {
            baseAvail = 1; 
        }

        const realTimeAvail = Math.max(0, baseAvail - booked);
        
        return {
            ...room,
            availableRooms: realTimeAvail,
            status: realTimeAvail <= 0 ? 'sold_out' : 'available'
        };
    });
};
