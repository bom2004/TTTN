import { IUser } from "../models/userModel.ts";

/**
 * Hàm hỗ trợ: Trả về dữ liệu người dùng đã loại bỏ mật khẩu và các thông tin nhạy cảm
 */
export const sanitizeUserInfo = (user: IUser) => {
    // Chuyển đổi sang object thuần để xóa password
    const safeUser = user.toObject();
    if (safeUser.password) {
        delete safeUser.password;
    }
    return safeUser;
};

/**
 * Hàm hỗ trợ: Trích xuất ID người dùng từ các nguồn khác nhau trong req.body hoặc req.params
 */
export const extractTargetUserId = (data: any, params: any): string | undefined => {
    return data.userId || data.id || params.userId || params.id;
};
