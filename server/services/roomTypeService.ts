import roomTypeModel from "../models/roomTypeModel.ts";
import imagekit from "../config/imagekit.ts";

/**
 * Service: Xử lý lưu hoặc cập nhật loại phòng (Bao gồm upload ảnh)
 */
export const processSaveRoomType = async (id: string | undefined, data: any, file?: any) => {
    const updateData = { ...data };

    // 1. Xử lý upload ảnh nếu có file mới
    if (file) {
        const uploadRes = await imagekit.upload({
            file: file.buffer.toString("base64"),
            fileName: `roomtype_${Date.now()}`,
            folder: "/room_types",
        });
        updateData.image = uploadRes.url;
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
    return await roomTypeModel.find(filter);
};

/**
 * Service: Xóa loại phòng
 */
export const removeRoomType = async (id: string) => {
    const deleted = await roomTypeModel.findByIdAndDelete(id); //findByIdAndDelete(id) tìm phòng có id khớp với id truyền vào
    if (!deleted) throw new Error("Không tìm thấy loại phòng để xóa.");
    return deleted;
};
