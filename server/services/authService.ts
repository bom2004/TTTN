import bcrypt from "bcryptjs";
import userModel from "../models/userModel.ts";
import otpModel from "../models/otpModel.ts";
import sendMail from "../utils/sendMail.ts";

/**
 * Service xử lý mã hóa mật khẩu
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

/**
 * Service kiểm tra mật khẩu
 */
export const comparePassword = async (password: string, hashed: string): Promise<boolean> => {
    return await bcrypt.compare(password, hashed);
};

/**
 * Service tạo và gửi mã OTP qua Email
 */
export const createAndSendOTP = async (email: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu OTP vào database (Ghi đè nếu đã tồn tại)
    await otpModel.findOneAndUpdate(
        { email },
        { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
        { upsert: true, returnDocument: 'after' }
    );

    // Gửi mail
    try {
        await sendMail(
            email,
            "Mã xác thực từ QuickStay",
            `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 5 phút.`
        );
        return true;
    } catch (mailError) {
        console.error("Mail service error:", mailError);
        throw new Error("Lỗi dịch vụ gửi mail (SMTP): " + (mailError as Error).message);
    }
};

/**
 * Service kiểm tra mã OTP
 */
export const checkOTPValidity = async (email: string, otp: string) => {
    const otpData = await otpModel.findOne({ email, otp });
    return otpData;
};

/**
 * Service xóa mã OTP sau khi dùng xong
 */
export const removeOTP = async (otpId: string) => {
    await otpModel.deleteOne({ _id: otpId });
};
