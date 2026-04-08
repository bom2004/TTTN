import { Request, Response } from "express";
import userModel from "../models/userModel.ts";
import bcrypt from "bcryptjs";
import imagekit from "../config/imagekit.ts";

import otpModel from "../models/otpModel.ts";

// API to update user profile
const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, full_name, email, otp, phone, oldPassword, newPassword } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        if (full_name) {
            user.full_name = full_name;
        }

        if (email && email !== user.email) {
            if (!otp) {
                res.status(400).json({ success: false, message: "Cần mã OTP để thay đổi Email" });
                return;
            }

            const otpData = await otpModel.findOne({ email, otp });
            if (!otpData) {
                res.status(400).json({ success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
                return;
            }

            // check if email is taken
            const emailExists = await userModel.findOne({ email });
            if (emailExists) {
                res.status(400).json({ success: false, message: "Email đã được sử dụng" });
                return;
            }

            await otpModel.deleteOne({ _id: otpData._id });
            user.email = email;
        }

        // Update phone if provided
        if (phone) {
            user.phone = phone;
        }

        // Update password if both old and new passwords are provided
        if (oldPassword && newPassword) {
            const isMatch = await bcrypt.compare(oldPassword, user.password || '');
            if (!isMatch) {
                res.status(400).json({ success: false, message: "Mật khẩu cũ không chính xác" });
                return;
            }
            
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Handle avatar upload
        if (req.file) {
            const uploadResponse = await imagekit.upload({
                file: req.file.buffer.toString("base64"),
                fileName: `user_${user._id}_${Date.now()}`,
                folder: "/users",
            });
            user.avatar = uploadResponse.url;
        }

        await user.save();

        res.json({ 
            success: true, 
            message: "Cập nhật thành công",
            userData: {
                id: user._id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                totalSpent: user.totalSpent || 0,
                membershipLevel: user.membershipLevel || 'silver'
            }

        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export { updateProfile };
