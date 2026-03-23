import { Request, Response } from "express";
import userModel from "../models/userModel.ts";
import { 
    sanitizeUserInfo, 
    extractTargetUserId 
} from "../utils/userUtils.ts";
import { 
    getAllUsersSafe, 
    updateUserRole, 
    updatePasswordForUser, 
    processSaveUser, 
    removeUserById 
} from "../services/userService.ts";

/**
 * Controller: Lấy toàn bộ người dùng (Cho Admin)
 */
export const allUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
        const users = await getAllUsersSafe();
        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Thay đổi vai trò (Cập nhật quyền - Admin)
 */
export const changeRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, role } = req.body;
        if (!userId || !role) {
            res.status(400).json({ success: false, message: "Thiếu ID người dùng hoặc vai trò" });
            return;
        }

        const updated = await updateUserRole(userId as any, role);
        res.json({ success: true, message: "Cập nhật vai trò thành công", data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Cập nhật mật khẩu cho người dùng bất kỳ (Admin)
 */
export const adminUpdatePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, newPassword } = req.body;
        if (!userId) {
            res.status(400).json({ success: false, message: "Thiếu ID người dùng" });
            return;
        }

        await updatePasswordForUser(userId as any, newPassword);
        res.json({ success: true, message: "Cập nhật mật khẩu thành công" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Tạo người dùng mới trực tiếp (Admin)
 */
export const adminCreateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;
        const file = req.file;

        // Xử lý tạo mới thông qua Service (bao gồm upload ảnh đại diện)
        const newUser = await processSaveUser(undefined, data, file);

        res.status(201).json({ success: true, message: "Tạo tài khoản thành công", data: newUser });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Cập nhật thông tin người dùng (Admin)
 */
export const adminUpdateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const targetId = extractTargetUserId(req.body, req.params);
        if (!targetId) {
            res.status(400).json({ success: false, message: "Thiếu ID người dùng" });
            return;
        }

        const data = req.body;
        const file = req.file;

        // Xử lý cập nhật thông qua Service
        const updatedUser = await processSaveUser(targetId as any, data, file);

        res.json({ success: true, message: "Cập nhật thông tin thành công", data: updatedUser });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Xóa người dùng (Admin)
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ success: false, message: "Thiếu ID người dùng" });
            return;
        }

        await removeUserById(userId as any);
        res.json({ success: true, message: "Xóa người dùng thành công" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Controller: Lấy thông tin chi tiết một người dùng
 */
export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const user = await userModel.findById(userId).select("-password");
        if (!user) {
            res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
            return;
        }

        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
