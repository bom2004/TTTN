import { Request, Response } from "express";
import roomModel from "../models/roomModel.ts";
import { 
    parseAmenitiesObject, 
    normalizeDateUTC 
} from "../utils/roomUtils.ts";
import { 
    handleRoomImageUpload, 
    calculateRoomAvailability 
} from "../services/roomService.ts";

/**
 * Controller: Thêm phòng mới
 */
export const addRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { 
            name, roomType, capacity, size, bedType, view, description, 
            price, originalPrice, availableRooms, status, 
            amenities, hotelId, rating, reviewCount 
        } = req.body;

        if (!name || !roomType || !size || !bedType || !price || !description) {
            res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
            return;
        }

        // 1. Xử lý tải ảnh thông qua Service
        const files = req.files as any;
        const { thumbnailUrl, imagesUrls } = await handleRoomImageUpload(name, files);

        if (!thumbnailUrl) {
            res.status(400).json({ success: false, message: "Vui lòng cung cấp ảnh thumbnail (ảnh chính)." });
            return;
        }

        // 2. Chuẩn hóa tiện nghi
        const parsedAmenities = parseAmenitiesObject(amenities);

        // 3. Tạo phòng mới
        const newRoom = new roomModel({
            name, roomType, bedType, view: view || "", description,
            capacity: Number(capacity || 2),
            size: Number(size),
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            availableRooms: availableRooms ? Number(availableRooms) : 0,
            status: status || "available",
            thumbnail: thumbnailUrl,
            images: imagesUrls,
            amenities: parsedAmenities,
            hotelId: hotelId || undefined,
            rating: rating ? Number(rating) : 0,
            reviewCount: reviewCount ? Number(reviewCount) : 0
        });

        await newRoom.save();
        res.status(201).json({ success: true, message: "Thêm phòng thành công", data: newRoom });

    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống: " + (error as Error).message });
    }
};

/**
 * Controller: Lấy toàn bộ danh sách phòng (Tính toán phòng trống thời gian thực)
 */
export const getAllRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const { hotelId } = req.query;
        const filter = hotelId ? { hotelId } : {};
        
        const roomsResult = await roomModel.find(filter).lean() as any[];
        
        // Gọi Service tính toán trạng thái phòng dựa theo ngày hôm nay
        const rooms = await calculateRoomAvailability(roomsResult, new Date(), new Date(new Date().setDate(new Date().getDate() + 1)));

        res.json({ success: true, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Cập nhật thông tin phòng
 */
export const updateRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const updateData: Record<string, any> = { ...req.body };
        const files = req.files as any;

        // 1. Xử lý ảnh mới nếu có
        const { thumbnailUrl, imagesUrls } = await handleRoomImageUpload(updateData.name || "update", files, true);
        if (thumbnailUrl) updateData.thumbnail = thumbnailUrl;
        if (imagesUrls.length > 0) updateData.images = imagesUrls;

        // 2. Chuẩn hóa các trường số
        const numFields = ['price', 'capacity', 'size', 'originalPrice', 'availableRooms', 'rating', 'reviewCount'];
        numFields.forEach(field => {
            if (updateData[field] !== undefined) updateData[field] = Number(updateData[field]);
        });

        // 3. Xử lý tiện nghi (amenities)
        if (updateData.amenities) {
            updateData.amenities = parseAmenitiesObject(updateData.amenities);
        }

        const updatedRoom = await roomModel.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });

        if (!updatedRoom) {
            res.status(404).json({ success: false, message: "Không tìm thấy phòng." });
            return;
        }
        res.json({ success: true, message: "Cập nhật phòng thành công", data: updatedRoom });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống: " + (error as Error).message });
    }
};

/**
 * Controller: Xóa phòng
 */
export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedRoom = await roomModel.findByIdAndDelete(req.params.id);
        if (!deletedRoom) {
            res.status(404).json({ success: false, message: "Không tìm thấy phòng" });
            return;
        }
        res.json({ success: true, message: "Xóa phòng thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Tìm kiếm và lọc phòng theo ngày (Tính toán phòng trống linh hoạt)
 */
export const searchRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, bedType, type, capacity, minPrice, maxPrice, sort, wifi, airConditioner, breakfast, checkIn, checkOut, roomId } = req.query;

        const conditions: any[] = [];
        const searchQuery = query as string;

        if (roomId) conditions.push({ _id: roomId });
        if (searchQuery) {
            conditions.push({ $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { roomType: { $regex: searchQuery, $options: 'i' } }
            ]});
        }
        if (bedType) conditions.push({ bedType });
        if (capacity) conditions.push({ capacity: { $gte: Number(capacity) } });
        if (type) conditions.push({ $or: [ { roomType: type }, { roomType: { $regex: `^${type}$`, $options: 'i' } }]});
        if (minPrice || maxPrice) {
            const priceFilter: any = {};
            if (minPrice) priceFilter.$gte = Number(minPrice);
            if (maxPrice) priceFilter.$lte = Number(maxPrice);
            conditions.push({ price: priceFilter });
        }
        if (wifi === 'true') conditions.push({ 'amenities.wifi': true });
        if (airConditioner === 'true') conditions.push({ 'amenities.airConditioner': true });
        if (breakfast === 'true') conditions.push({ 'amenities.breakfast': true });

        const filter = conditions.length > 0 ? { $and: conditions } : {};

        let sortOption: any = {};
        if (sort === 'price_asc') sortOption = { price: 1 };
        else if (sort === 'price_desc') sortOption = { price: -1 };
        else if (sort === 'rating') sortOption = { rating: -1 };
        else sortOption = { createdAt: -1 };

        let roomsResult = await roomModel.find(filter).sort(sortOption).lean() as any[];

        // Gọi Service tính toán trạng thái phòng trống theo ngày cụ thể được khách hàng chọn
        const rooms = await calculateRoomAvailability(roomsResult, checkIn as string, checkOut as string);

        res.json({ success: true, count: rooms.length, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};
