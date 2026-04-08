import { Request, Response } from "express";
import userModel from "../models/userModel.ts";
import { 
    hashPassword, 
    comparePassword, 
    createAndSendOTP, 
    checkOTPValidity, 
    removeOTP 
} from "../services/authService.ts";
import { createToken } from "../utils/authUtils.ts";

/**
 * Controller: Đăng ký người dùng mới
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { full_name, email, phone, password } = req.body;

        // Kiểm tra email tồn tại
        const exists = await userModel.findOne({ email });
        if (exists) {
            res.status(400).json({ success: false, message: "Email này đã được sử dụng, vui lòng chọn email khác." });
            return;
        }

        // Mã hóa mật khẩu thông qua Service
        const hashedPassword = await hashPassword(password);

        // Lưu thông tin người dùng
        const newUser = new userModel({
            full_name,
            email,
            phone,
            password: hashedPassword,
        });

        const user = await newUser.save();
        
        // Tạo JWT Token thông qua Utils
        const token = createToken(String(user._id));

        res.status(201).json({
            success: true,
            token,
            userData: {
                id: user._id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                totalSpent: user.totalSpent,
                membershipLevel: user.membershipLevel
            },
            message: "Đăng ký thành công"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Đăng nhập truyền thống (Email & Mật khẩu)
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
            return;
        }

        // Kiểm tra mật khẩu thông qua Service
        const isMatch = await comparePassword(password, user.password || "");
        if (!isMatch) {
            res.status(400).json({ success: false, message: "Mật khẩu không chính xác" });
            return;
        }

        const token = createToken(String(user._id));
        res.json({
            success: true,
            token,
            userData: {
                id: user._id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                totalSpent: user.totalSpent,
                membershipLevel: user.membershipLevel
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Gửi mã OTP
 */
export const sendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, checkExist } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: "Email là bắt buộc" });
            return;
        }

        // Kiểm tra tồn tại nếu được yêu cầu (với đăng ký)
        if (checkExist) {
            const exists = await userModel.findOne({ email });
            if (exists) {
                res.status(400).json({ success: false, message: "Email này đã tồn tại, vui lòng sử dụng email khác." });
                return;
            }
        }

        // Gọi Service để tạo và gửi mã OTP
        await createAndSendOTP(email);

        res.json({ success: true, message: "Mã OTP đã được gửi đến email của bạn" });

    } catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({ success: false, message: "Không thể gửi OTP: " + (error as Error).message });
    }
};

/**
 * Controller: Đăng nhập bằng mã OTP
 */
export const loginWithOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;
        
        // Kiểm tra tính hợp lệ của mã qua Service
        const otpData = await checkOTPValidity(email, otp);

        if (!otpData) {
            res.status(400).json({ success: false, message: "Mã OTP không đúng hoặc đã hết hạn" });
            return;
        }

        // Tìm hoặc tạo mới người dùng
        let user = await userModel.findOne({ email });
        if (!user) {
            user = new userModel({
                full_name: email.split('@')[0],
                email,
                avatar: "",
                phone: ""
            });
            await user.save();
        }

        const token = createToken(String(user._id));
        
        // Xóa mã OTP sau khi dùng
        await removeOTP(String(otpData._id));

        res.json({
            success: true,
            token,
            userData: {
                id: user._id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                totalSpent: user.totalSpent,
                membershipLevel: user.membershipLevel
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Chỉ xác thực OTP (cho đặt lại mật khẩu)
 */
export const verifyOTPOnly = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;
        
        const otpData = await checkOTPValidity(email, otp);

        if (!otpData) {
            res.status(400).json({ success: false, message: "Mã OTP không đúng hoặc đã hết hạn" });
            return;
        }

        res.json({ success: true, message: "Mã OTP hợp lệ" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/**
 * Controller: Đặt lại mật khẩu mới
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp, newPassword } = req.body;

        const otpData = await checkOTPValidity(email, otp);
        if (!otpData) {
            res.status(400).json({ success: false, message: "Phiên làm việc hết hạn, vui lòng gửi lại OTP" });
            return;
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
            return;
        }

        // Mã hóa mật khẩu mới và cập nhật
        const hashedPassword = await hashPassword(newPassword);
        await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });
        
        // Xóa mã OTP sau khi dùng
        await removeOTP(String(otpData._id));

        res.json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};
