import jwt from "jsonwebtoken";

/**
 * Hàm hỗ trợ: Tạo JWT Token từ ID người dùng
 */
export const createToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key', {
        expiresIn: '7d'
    });
};
