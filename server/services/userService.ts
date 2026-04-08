import userModel from "../models/userModel.ts";
import imagekit from "../config/imagekit.ts";
import { hashPassword } from "./authService.ts";

/**
 * Service: Lấy toàn bộ người dùng và trả về dữ liệu an toàn
 */
export const getAllUsersSafe = async () => {
    return await userModel.find({}).select("-password");
};

/**
 * Service: Cập nhật vai trò người dùng
 */
export const updateUserRole = async (userId: string, role: string) => {
    const updated = await userModel.findByIdAndUpdate(userId, { role }, { returnDocument: 'after' });
    if (!updated) throw new Error("Không tìm thấy người dùng để cập nhật vai trò.");
    return updated;
};

/**
 * Service: Cập nhật mật khẩu cho người dùng (Thường dủng cho Admin)
 */
export const updatePasswordForUser = async (userId: string, newPass: string) => {
    if (!newPass || newPass.length < 6) throw new Error("Mật khẩu phải ít nhất 6 ký tự");
    
    // Sử dụng chung hàm băm mật khẩu từ authService
    const hashedPassword = await hashPassword(newPass);
    await userModel.findByIdAndUpdate(userId, { password: hashedPassword });
    return true;
};

/**
 * Service: Xử lý lưu hoặc cập nhật thông tin người dùng (Bao gồm upload avatar)
 */
export const processSaveUser = async (id: string | undefined, data: any, file?: any) => {
    const updateData = { ...data };

    // 1. Nếu có mật khẩu mới, băm mật khẩu
    if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
    }

    // 2. Xử lý upload avatar lên ImageKit (nếu có)
    if (file) {
        const uploadRes = await imagekit.upload({
            file: file.buffer.toString("base64"),
            fileName: `user_avatar_${Date.now()}`,
            folder: "/users",
        });
        updateData.avatar = uploadRes.url;
    }

    // 3. Chuẩn hóa dữ liệu số (balance, totalRecharged)
    if (updateData.balance !== undefined) updateData.balance = Number(updateData.balance);
    if (updateData.totalRecharged !== undefined) {
        updateData.totalRecharged = Number(updateData.totalRecharged);

        // 4. Tự động tính lại hạng thành viên khi totalRecharged thay đổi
        const total = updateData.totalRecharged;
        if (total >= 150000000) {
            updateData.membershipLevel = 'platinum';
        } else if (total >= 50000000) {
            updateData.membershipLevel = 'diamond';
        } else if (total >= 10000000) {
            updateData.membershipLevel = 'gold';
        } else {
            updateData.membershipLevel = 'silver';
        }
    }

    if (id) {
        // Cập nhật người dùng cũ
        // Kiểm tra email trùng lắp (ngoại trừ chính mình)
        if (updateData.email) {
            const exists = await userModel.findOne({ email: updateData.email, _id: { $ne: id } });
            if (exists) throw new Error("Email này đã được sử dụng bởi một tài khoản khác.");
        }

        const updated = await userModel.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
        if (!updated) throw new Error("Không tìm thấy người dùng để cập nhật.");
        return updated;
    } else {
        // Tạo người dùng mới
        if (!updateData.email || !updateData.password) throw new Error("Vui lòng cung cấp đầy đủ Email và Mật khẩu.");
        
        const exists = await userModel.findOne({ email: updateData.email });
        if (exists) throw new Error("Email này đã được đăng ký.");

        const newUser = new userModel(updateData);
        await newUser.save();
        return newUser;
    }
};

/**
 * Service: Xóa người dùng theo ID
 */
export const removeUserById = async (userId: string) => {
    const deleted = await userModel.findByIdAndDelete(userId);
    if (!deleted) throw new Error("Không tìm thấy người dùng để xóa.");
    return deleted;
};

/**
 * Service: Cập nhật tổng chi tiêu và thăng hạng thành viên
 * @param userId ID của người dùng
 * @param amountToAdd Số tiền cộng thêm vào tổng chi tiêu
 * @param session Mongoose session (nếu có)
 */
export const updateUserMembership = async (userId: string, amountToAdd: number, session?: any) => {
    const user = await userModel.findById(userId).session(session as any);
    if (!user) return null;

    // 1. Cộng dồn chi tiêu
    user.totalSpent = (user.totalSpent || 0) + amountToAdd;

    // 2. Tính toán lại hạng thành viên (Ngưỡng 2 - 7 - 12 triệu)
    let newLevel: 'silver' | 'gold' | 'diamond' | 'platinum' = 'silver';
    const spent = user.totalSpent;
    if (spent >= 12000000) newLevel = 'platinum';
    else if (spent >= 7000000) newLevel = 'diamond';
    else if (spent >= 2000000) newLevel = 'gold';

    user.membershipLevel = newLevel;
    await user.save({ session });

    // 3. Thông báo thăng hạng nếu có thay đổi hoặc cộng tiền thành công
    import('../socket.ts').then(({ emitToUser, emitToAll }) => {
        emitToUser(String(user._id), 'user_membership_upgraded', {
            userId: String(user._id),
            membershipLevel: newLevel,
            totalSpent: user.totalSpent
        });
        emitToAll('user_updated', user);
    }).catch(err => console.error("Socket emit failed: ", err));

    return user;
};
