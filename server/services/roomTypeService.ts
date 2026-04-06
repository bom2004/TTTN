import roomTypeModel from "../models/roomTypeModel.ts";
import roomModel from "../models/roomModel.ts";
import imagekit from "../config/imagekit.ts";

/**
 * Service: Xử lý lưu hoặc cập nhật loại phòng (Bao gồm upload ảnh)
 */
export const processSaveRoomType = async (id: string | undefined, data: any, files?: any[]) => {
    const updateData = { ...data };

    // 0. Xử lý logic parse dữ liệu JSON từ FormData (nếu cần)
    if (typeof updateData.amenities === 'string') {
        try {
            updateData.amenities = JSON.parse(updateData.amenities);
        } catch (e) {
            console.error("Lỗi parse amenities JSON:", e);
        }
    }

    // Ép kiểu số cho các trường dữ liệu từ FormData (vốn là string)
    if (updateData.basePrice) updateData.basePrice = Number(updateData.basePrice);
    if (updateData.capacity) updateData.capacity = Number(updateData.capacity);
    if (updateData.size) updateData.size = Number(updateData.size);

    // 1. Xử lý logic parse dữ liệu image
    let remainingImages: string[] = [];
    if (updateData.remainingImages) {
        try {
            remainingImages = JSON.parse(updateData.remainingImages);
        } catch (e) {
            console.error("Lỗi parse remainingImages JSON:", e);
        }
        delete updateData.remainingImages;
    }

    const mainIdx = Number(updateData.mainImageIndex) || 0;
    delete updateData.mainImageIndex;

    // 2. Xử lý upload danh sách ảnh mới nếu có
    let newImageUrls: string[] = [];
    if (files && files.length > 0) {
        const uploadPromises = files.map((file: any) => 
            imagekit.upload({
                file: file.buffer.toString("base64"),
                fileName: `roomtype_${Date.now()}`,
                folder: "/room_types",
            })
        );
        
        const uploadResults = await Promise.all(uploadPromises);
        newImageUrls = uploadResults.map(res => res.url);
    }

    // 3. Hợp nhất ảnh cũ (còn lại) và ảnh mới
    if (id) {
        // Trường hợp cập nhật
        const existing = await roomTypeModel.findById(id);
        if (!existing) throw new Error("Không tìm thấy loại phòng để cập nhật.");
        
        // Nếu không gửi remainingImages (trường hợp API cũ hoặc không dùng UI mới), 
        // mặc định giữ lại ảnh cũ nếu không có ảnh mới.
        const finalImages = (remainingImages.length > 0 || (files && files.length > 0)) 
            ? [...remainingImages, ...newImageUrls] 
            : existing.images || [];

        updateData.images = finalImages;
        updateData.image = finalImages[mainIdx] || finalImages[0] || existing.image;
    } else {
        // Trường hợp thêm mới
        updateData.images = newImageUrls;
        updateData.image = newImageUrls[mainIdx] || newImageUrls[0] || "";
    }

    if (id) {
        // Cập nhật loại phòng cũ
        const updated = await roomTypeModel.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
        if (!updated) throw new Error("Không tìm thấy loại phòng để cập nhật.");
        return updated;
    } else {
        // Tạo mới loại phòng (Cần kiểm tra tên duy nhất)
        if (!updateData.name || !updateData.basePrice) {
            throw new Error("Vui lòng cung cấp đầy đủ tên và giá cơ bản.");
        }

        const exists = await roomTypeModel.findOne({ name: updateData.name.trim() });
        if (exists) throw new Error("Loại phòng này đã tồn tại trong hệ thống.");

        const newRoomType = new roomTypeModel({
            ...updateData,
            name: updateData.name.trim()
        });
        await newRoomType.save();
        return newRoomType;
    }
};

/**
 * Service: Lấy danh sách loại phòng với bộ lọc Admin
 */
export const fetchRoomTypes = async (isAdmin: boolean) => {
    const filter = isAdmin ? {} : { isActive: true };
    const roomTypes = await roomTypeModel.find(filter).lean();

    // Tính toán số lượng kho thực tế từ roomModel
    const roomCounts = await roomModel.aggregate([
        { $match: { status: { $ne: 'maintenance' } } },
        { $group: { _id: "$roomTypeId", count: { $sum: 1 } } }
    ]);
    const countMap = new Map();
    roomCounts.forEach(c => countMap.set(c._id.toString(), c.count));

    return roomTypes.map(rt => ({
        ...rt,
        totalInventory: countMap.get(rt._id.toString()) || 0
    }));
};

/**
 * Service: Xóa loại phòng
 */
export const removeRoomType = async (id: string) => {
    const deleted = await roomTypeModel.findByIdAndDelete(id); //findByIdAndDelete(id) tìm phòng có id khớp với id truyền vào
    if (!deleted) throw new Error("Không tìm thấy loại phòng để xóa.");
    return deleted;
};
