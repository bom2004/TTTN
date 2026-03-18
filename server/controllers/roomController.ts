import { Request, Response } from "express";
import roomModel from "../models/roomModel.ts";
import roomTypeModel from "../models/roomTypeModel.ts";
import bookingModel from "../models/bookingModel.ts";
import bookingDetailModel from "../models/bookingDetailModel.ts";
import imagekit from "../config/imagekit.ts";

// @desc    Add a new room
// @route   POST /api/rooms
export const addRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { 
            name, roomType, capacity, size, bedType, view, description, 
            price, originalPrice, availableRooms, status, 
            amenities, hotelId, rating, reviewCount 
        } = req.body;

        // Validation - Required fields according to your detailed schema
        if (!name || !roomType || !size || !bedType || !price || !description) {
            res.status(400).json({ 
                success: false, 
                message: "Thiếu thông tin bắt buộc: name, roomType, size, bedType, price, và description là bắt buộc." 
            });
            return;
        }

        let thumbnailUrl = "";
        let imagesUrls: string[] = [];

        // Handle file uploads
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        
        // Processing Thumbnail
        if (files?.thumbnail?.[0]) {
            const uploadResponse = await imagekit.upload({
                file: files.thumbnail[0].buffer.toString("base64"),
                fileName: `room_thumb_${name.replace(/\s+/g, '_')}_${Date.now()}`,
                folder: "/rooms/thumbnails",
            });
            thumbnailUrl = uploadResponse.url;
        } else {
            res.status(400).json({ success: false, message: "Vui lòng cung cấp ảnh thumbnail (ảnh chính)." });
            return;
        }

        // Processing Gallery Images
        if (files?.images) {
            for (const file of files.images) {
                const uploadResponse = await imagekit.upload({
                    file: file.buffer.toString("base64"),
                    fileName: `room_gallery_${name.replace(/\s+/g, '_')}_${Date.now()}`,
                    folder: "/rooms/gallery",
                });
                imagesUrls.push(uploadResponse.url);
            }
        }

        // Parse amenities from JSON string if necessary
        let parsedAmenities = amenities;
        if (typeof amenities === 'string') {
            try {
                parsedAmenities = JSON.parse(amenities);
            } catch (e) {
                parsedAmenities = {};
            }
        }

        // Create the new room instance
        const newRoom = new roomModel({
            name,
            roomType,
            capacity: Number(capacity || 2),
            size: Number(size),

            bedType,
            view: view || "",
            description,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            availableRooms: availableRooms ? Number(availableRooms) : 0,
            status: status || "available",
            thumbnail: thumbnailUrl,
            images: imagesUrls,
            amenities: {
                wifi: String(parsedAmenities?.wifi) === 'true',
                airConditioner: String(parsedAmenities?.airConditioner) === 'true',
                breakfast: String(parsedAmenities?.breakfast) === 'true',
                minibar: String(parsedAmenities?.minibar) === 'true',
                tv: String(parsedAmenities?.tv) === 'true',
                balcony: String(parsedAmenities?.balcony) === 'true',
            },
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



// @desc    Get all rooms (can filter by hotelId)
// @route   GET /api/rooms
export const getAllRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const { hotelId } = req.query;
        const filter = hotelId ? { hotelId } : {};
        
        const roomsResult = await roomModel.find(filter).lean();
        
        // --- TÍNH TOÁN TRẠNG THÁI HIỆN TẠI TỰ ĐỘNG CHO HÔM NAY ---
        const today = new Date();
        today.setHours(0,0,0,0);
        const tonight = new Date(today);
        tonight.setDate(today.getDate() + 1);

        // Lấy danh sách các đơn trùng ngày hôm nay
        const activeBookings = await bookingModel.find({
            status: { $nin: ['cancelled', 'completed'] },
            checkInDate: { $lt: tonight },
            checkOutDate: { $gt: today }
        });

        const bookedCountByRoom: Record<string, number> = {};
        if (activeBookings.length > 0) {
            const bookingIds = activeBookings.map(b => b._id);
            const bookedDetails = await bookingDetailModel.find({
                bookingId: { $in: bookingIds },
                roomStatus: { $ne: 'cancelled' }
            });

            for (const detail of bookedDetails) {
                const rid = detail.roomId.toString();
                bookedCountByRoom[rid] = (bookedCountByRoom[rid] || 0) + 1;
            }
        }

        const rooms = roomsResult.map((room: any) => {
            const bookedCount = bookedCountByRoom[room._id.toString()] || 0;
            // availableRooms ở đây là "tổng số lượng vật lý" thiết lập trong DB
            let baseAvailable = Number(room.availableRooms || 0);

            // --- ĐUÔI SỬA LỖI DỮ LIỆU CŨ ---
            // Nếu DB đang kẹt ở 0 (do logic cũ trừ thẳng vào database) mà hôm nay chưa ai đặt đơn nào
            // thì ta khôi phục tạm thời thành 1 để phòng có thể hiện "Sẵn sàng" trong quản lý.
            if (baseAvailable <= 0 && bookedCount === 0) {
                baseAvailable = 1; 
            }

            const realTimeAvail = Math.max(0, baseAvailable - bookedCount);
            
            return {
                ...room,
                // Ghi đè số lượng còn lại THỰC TẾ hôm nay để Staff nhìn thấy
                availableRooms: realTimeAvail,
                // Tự động chuyển status sang sold_out nếu hôm nay đã kín chỗ
                status: realTimeAvail <= 0 ? 'sold_out' : 'available'
            };
        });

        res.json({ success: true, data: rooms });

    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Update room status or details
// @route   PUT /api/rooms/:id
export const updateRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const updateData: Record<string, any> = { ...req.body };

        // Handle file uploads
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        
        if (files?.thumbnail?.[0]) {
            const uploadResponse = await imagekit.upload({
                file: files.thumbnail[0].buffer.toString("base64"),
                fileName: `room_thumb_update_${Date.now()}`,
                folder: "/rooms/thumbnails",
            });
            updateData.thumbnail = uploadResponse.url;
        }

        if (files?.images) {
            const imagesUrls: string[] = [];
            for (const file of files.images) {
                const uploadResponse = await imagekit.upload({
                    file: file.buffer.toString("base64"),
                    fileName: `room_gallery_update_${Date.now()}`,
                    folder: "/rooms/gallery",
                });
                imagesUrls.push(uploadResponse.url);
            }
            updateData.images = imagesUrls;
        }

        // Robust parsing for numbers
        if (updateData.price) updateData.price = Number(updateData.price);
        if (updateData.capacity) updateData.capacity = Number(updateData.capacity);
        if (updateData.size) updateData.size = Number(updateData.size);
        if (updateData.originalPrice) updateData.originalPrice = Number(updateData.originalPrice);
        if (updateData.availableRooms) updateData.availableRooms = Number(updateData.availableRooms);
        if (updateData.rating) updateData.rating = Number(updateData.rating);
        if (updateData.reviewCount) updateData.reviewCount = Number(updateData.reviewCount);


        // Handle nested amenities update
        if (updateData.amenities) {
            let parsedAmenities = updateData.amenities;
            if (typeof updateData.amenities === 'string') {
                try {
                    parsedAmenities = JSON.parse(updateData.amenities);
                } catch (e) {
                    parsedAmenities = {};
                }
            }
            // Merge or set amenities
            updateData.amenities = {
                wifi: String(parsedAmenities?.wifi) === 'true',
                airConditioner: String(parsedAmenities?.airConditioner) === 'true',
                breakfast: String(parsedAmenities?.breakfast) === 'true',
                minibar: String(parsedAmenities?.minibar) === 'true',
                tv: String(parsedAmenities?.tv) === 'true',
                balcony: String(parsedAmenities?.balcony) === 'true',
            };
        }

        const updatedRoom = await roomModel.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!updatedRoom) {
            res.status(404).json({ success: false, message: "Không tìm thấy phòng để cập nhật." });
            return;
        }
        res.json({ success: true, message: "Cập nhật phòng thành công", data: updatedRoom });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống: " + (error as Error).message });
    }
};



// @desc    Delete room
// @route   DELETE /api/rooms/:id
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

// @desc    Search and filter rooms
// @route   GET /api/rooms/search
export const searchRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, bedType, type, capacity, minPrice, maxPrice, sort, wifi, airConditioner, breakfast, checkIn, checkOut } = req.query;

        const conditions: any[] = [];
        const searchQuery = query as string;

        if (searchQuery) {
            conditions.push({
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } },
                    { roomType: { $regex: searchQuery, $options: 'i' } }
                ]
            });
        }

        if (bedType) {
            conditions.push({ bedType });
        }

        if (capacity) {
            conditions.push({ capacity: { $gte: Number(capacity) } });
        }


        if (type) {
            conditions.push({
                $or: [
                    { roomType: type },
                    { roomType: { $regex: `^${type}$`, $options: 'i' } }
                ]
            });
        }

        if (minPrice || maxPrice) {
            const priceFilter: any = {};
            if (minPrice) priceFilter.$gte = Number(minPrice);
            if (maxPrice) priceFilter.$lte = Number(maxPrice);
            conditions.push({ price: priceFilter });
        }

        // Filtering by boolean amenities
        if (wifi === 'true') conditions.push({ 'amenities.wifi': true });
        if (airConditioner === 'true') conditions.push({ 'amenities.airConditioner': true });
        if (breakfast === 'true') conditions.push({ 'amenities.breakfast': true });

        const filter = conditions.length > 0 ? { $and: conditions } : {};

        let sortOption: any = {};
        if (sort === 'price_asc') sortOption = { price: 1 };
        else if (sort === 'price_desc') sortOption = { price: -1 };
        else if (sort === 'rating') sortOption = { rating: -1 };
        else sortOption = { createdAt: -1 };

        let rooms = await roomModel.find(filter).sort(sortOption).lean() as any[];

        // Kiểm tra phòng trống theo ngày
        let targetCheckIn = checkIn ? new Date(checkIn as string) : new Date();
        let targetCheckOut = checkOut ? new Date(checkOut as string) : new Date(new Date().setDate(new Date().getDate() + 1));
        
        targetCheckIn.setHours(0,0,0,0);
        targetCheckOut.setHours(0,0,0,0);

        // Lấy danh sách các đơn trùng ngày
        const overlappingBookings = await bookingModel.find({
            status: { $nin: ['cancelled', 'completed'] },
            checkInDate: { $lt: targetCheckOut },
            checkOutDate: { $gt: targetCheckIn }
        });

        // Đếm số lượng loại phòng đã được đặt trong những ngày này
        const bookedCountByRoom: Record<string, number> = {};
        
        if (overlappingBookings.length > 0) {
            const bookingIds = overlappingBookings.map((b: any) => b._id);
            const bookedDetails = await bookingDetailModel.find({
                bookingId: { $in: bookingIds },
                roomStatus: { $ne: 'cancelled' }
            });

            for (const detail of bookedDetails) {
                const roomIdStr = detail.roomId.toString();
                bookedCountByRoom[roomIdStr] = (bookedCountByRoom[roomIdStr] || 0) + 1;
            }
        }

        // Cập nhật trạng thái từng phòng dựa theo số ngày cụ thể này
        rooms = rooms.map(room => {
            const booked = bookedCountByRoom[room._id.toString()] || 0;
            let baseAvailable = Number(room.availableRooms || 0);

            // Khôi phục capacity ảo (1) cho các phòng bị dữ liệu cũ trừ xuống 0 nhưng thực tế không có ai đặt
            if (baseAvailable <= 0 && booked === 0) {
                 baseAvailable = 1; 
            }

            const currentAvail = Math.max(0, baseAvailable - booked);
            
            return {
                ...room,
                availableRooms: currentAvail,
                status: currentAvail <= 0 ? 'sold_out' : 'available'
            };
        });

        res.json({ success: true, count: rooms.length, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

