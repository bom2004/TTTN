import { Request, Response } from "express";
import roomModel from "../models/roomModel.ts";
import {
    parseAmenitiesObject,
    normalizeDateUTC
} from "../utils/roomUtils.ts";
import {
    handleRoomImageUpload,
    calculateRoomAvailability,
    syncRoomTypeInventory
} from "../services/roomService.ts";
import { emitToAll } from "../socket.ts";

/**
 * Controller: Thêm phòng mới
 */
export const addRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomNumber, roomTypeId, status, hotelId } = req.body;

        if (!roomNumber || !roomTypeId) {
            res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc: Tên/Số phòng và Loại phòng." });
            return;
        }

        // Tạo phòng mới
        const newRoom = new roomModel({
            roomNumber,
            roomTypeId,
            status: status || "available",
            hotelId: hotelId || undefined
        });

        await newRoom.save();
        
        // Đồng bộ số lượng vào Loại phòng tương ứng
        await syncRoomTypeInventory(roomTypeId);

        res.status(201).json({ success: true, message: "Thêm phòng thành công", data: newRoom });

    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống: " + (error as Error).message });
    }
};

/**
 * Controller: Lấy toàn bộ danh sách phòng (Dành cho Admin)
 */
export const getAllRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const { hotelId } = req.query;
        const filter = hotelId ? { hotelId } : {};

        const roomsResult = await roomModel.find(filter).populate('roomTypeId').lean();

        res.json({ success: true, data: roomsResult });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Cập nhật thông tin phòng
 */
export const updateRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomNumber, roomTypeId, status, hotelId } = req.body;
        const updateData: Record<string, any> = {};

        if (roomNumber) updateData.roomNumber = roomNumber;
        if (roomTypeId) updateData.roomTypeId = roomTypeId;
        if (status) updateData.status = status;
        if (hotelId) updateData.hotelId = hotelId;

        const updatedRoom = await roomModel.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });

        if (!updatedRoom) {
            res.status(404).json({ success: false, message: "Không tìm thấy phòng." });
            return;
        }

        // Đồng bộ số lượng (Trường hợp typeId thay đổi hoặc phòng thay đổi)
        if (roomTypeId || updatedRoom.roomTypeId) {
            await syncRoomTypeInventory(roomTypeId || updatedRoom.roomTypeId.toString());
        }

        if (updatedRoom) {
            emitToAll('room_status_changed', { id: updatedRoom._id, status: updatedRoom.status, room: updatedRoom });
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

        // Đồng bộ xóa số lượng về Loại phòng
        if (deletedRoom.roomTypeId) {
            await syncRoomTypeInventory(deletedRoom.roomTypeId.toString());
        }

        res.json({ success: true, message: "Xóa phòng thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Tìm kiếm và lọc loại phòng (Tính toán phòng trống theo kho)
 */
export const searchRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, bedType, capacity, minPrice, maxPrice, sort, wifi, airConditioner, breakfast, checkIn, checkOut, roomId } = req.query;

        const conditions: any[] = [{ isActive: true }];
        const searchQuery = query as string;

        if (roomId) conditions.push({ _id: roomId }); // Lấy chi tiết khi click vào 1 roomType
        if (searchQuery) {
            conditions.push({
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } }
                ]
            });
        }
        if (bedType) conditions.push({ bedType });
        if (capacity) conditions.push({ capacity: { $gte: Number(capacity) } });
        if (minPrice || maxPrice) {
            const priceFilter: any = {};
            if (minPrice) priceFilter.$gte = Number(minPrice);
            if (maxPrice) priceFilter.$lte = Number(maxPrice);
            conditions.push({ basePrice: priceFilter });
        }
        if (wifi === 'true') conditions.push({ 'amenities.wifi': true });
        if (airConditioner === 'true') conditions.push({ 'amenities.airConditioner': true });
        if (breakfast === 'true') conditions.push({ 'amenities.breakfast': true });

        const filter = conditions.length > 0 ? { $and: conditions } : {};

        let sortOption: any = {};
        if (sort === 'price_asc') sortOption = { basePrice: 1 };
        else if (sort === 'price_desc') sortOption = { basePrice: -1 };
        else if (sort === 'rating') sortOption = { rating: -1 };
        else sortOption = { createdAt: -1 };

        const { default: roomTypeModel } = await import('../models/roomTypeModel.ts');
        const roomTypesResult = await roomTypeModel.find(filter).sort(sortOption).lean() as any[];

        // Gọi Service tính toán trạng thái phòng trống theo ngày
        let roomTypes = await calculateRoomAvailability(roomTypesResult, checkIn as string, checkOut as string);

        // Chỉ ẩn loại phòng khi user đã chọn ngày cụ thể VÀ phòng thực sự kín trong khoảng đó
        // Nếu không có ngày lọc → hiển thị tất cả (không ẩn loại phòng nào)
        if (checkIn && checkOut) {
            roomTypes = (roomTypes || []).filter((rt: any) => rt.availableRooms > 0);
        }

        res.json({ success: true, count: roomTypes?.length || 0, data: roomTypes || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};
