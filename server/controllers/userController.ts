import { Request, Response } from "express";
import userModel from "../models/userModel.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import imagekit from "../config/imagekit.ts";
import sendMail from "../utils/sendMail.ts";
import otpModel from "../models/otpModel.ts";

// Function to generate JWT
const createToken = (id: string): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

// API to register user
const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { full_name, email, phone, password } = req.body;

        // Checking if user already exists
        const exists = await userModel.findOne({ email });
        if (exists) {
            res.status(400).json({ success: false, message: "User already exists with this email" });
            return;
        }

        // Hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Creating new user
        const newUser = new userModel({
            full_name,
            email,
            phone,
            password: hashedPassword,
        });

        const user = await newUser.save();
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
                balance: user.balance,
                totalRecharged: user.totalRecharged
            }
,
            message: "Registration successful"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// API to login user
const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            res.status(404).json({ success: false, message: "User doesn't exist" });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password || '');

        if (isMatch) {
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
                    balance: user.balance,
                    totalRecharged: user.totalRecharged
                },

                message: "Login successful"
            });
        } else {
            res.status(401).json({ success: false, message: "Sai thông tin: Tên đăng nhập hoặc mật khẩu sai" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// API to get all users (Admin only ideally, but keeping it simple)
const allUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
        const users = await userModel.find({}).select("-password");
        res.json({ success: true, users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// Phân quyền
// API to update user role
const changeRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, role } = req.body;
        await userModel.findByIdAndUpdate(userId, { role });
        res.json({ success: true, message: "Cập nhật vai trò thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// API for Admin to update any user's password
const adminUpdatePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({ success: false, message: "Mật khẩu phải ít nhất 6 ký tự" });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await userModel.findByIdAndUpdate(userId, { password: hashedPassword });
        res.json({ success: true, message: "Cập nhật mật khẩu thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// API for Admin to create a new user
const adminCreateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { full_name, email, phone, password, role, balance } = req.body;


        if (!full_name || !email || !password) {
            res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc: tên, email và mật khẩu." });
            return;
        }

        const exists = await userModel.findOne({ email });
        if (exists) {
            res.status(400).json({ success: false, message: "Email đã được sử dụng" });
            return;
        }


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let avatarUrl = "";
        if (req.file) {
            try {
                const uploadResponse = await imagekit.upload({
                    file: req.file.buffer.toString("base64"),
                    fileName: `admin_created_${email}_${Date.now()}`,
                    folder: "/users",
                });
                avatarUrl = uploadResponse.url;
            } catch (imageError) {
                console.error("Avatar Upload Error:", imageError);
                res.status(400).json({ success: false, message: "Lỗi tải ảnh đại diện: " + (imageError as Error).message });
                return;
            }
        }


        const newUser = new userModel({
            full_name,
            email,
            phone,
            password: hashedPassword,
            role: role || 'customer',
            avatar: avatarUrl,
            balance: balance ? Number(balance) : 0,
            totalRecharged: req.body.totalRecharged ? Number(req.body.totalRecharged) : 0
        });



        await newUser.save();
        res.status(201).json({ success: true, message: "Tạo tài khoản thành công" });
    } catch (error) {
        console.error("Admin Create User Error:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống: " + (error as Error).message });
    }
};


// API for Admin to update user info
const adminUpdateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, id, full_name, email, phone, role, balance } = req.body;

        const targetId = userId || id;

        if (!targetId) {
            res.status(400).json({ success: false, message: "Thiếu ID người dùng" });
            return;
        }

        const user = await userModel.findById(targetId);
        if (!user) {
            res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
            return;
        }



        // Check if email is already taken by another user
        const existingUser = await userModel.findOne({ email, _id: { $ne: targetId } });
        if (existingUser) {
            res.status(400).json({ success: false, message: "Email đã được sử dụng bởi người dùng khác" });
            return;
        }

        const updateData: Record<string, any> = { full_name, email, phone };
        if (role) updateData.role = role;
        if (balance !== undefined) updateData.balance = Number(balance);
        if (req.body.totalRecharged !== undefined) updateData.totalRecharged = Number(req.body.totalRecharged);



        if (req.file) {
            try {
                const uploadResponse = await imagekit.upload({
                    file: req.file.buffer.toString("base64"),
                    fileName: `admin_updated_${targetId}_${Date.now()}`,
                    folder: "/users",
                });
                updateData.avatar = uploadResponse.url;
            } catch (imageError) {
                console.error("Avatar Update Error:", imageError);
                res.status(400).json({ success: false, message: "Lỗi cập nhật ảnh đại diện: " + (imageError as Error).message });
                return;
            }
        }


        await userModel.findByIdAndUpdate(targetId, updateData);

        res.json({ success: true, message: "Cập nhật thông tin thành công" });
    } catch (error) {
        console.error("Admin Update User Error:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống: " + (error as Error).message });
    }
};


// API for Admin to delete a user
const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;
        
        // Find user to check exists
        const user = await userModel.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
            return;
        }

        await userModel.findByIdAndDelete(userId);
        res.json({ success: true, message: "Xóa người dùng thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// API to get single user
const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const user = await userModel.findById(userId).select("-password");
        if (!user) {
            res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
            return;
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// API to send OTP to Google Email
const sendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, checkExist } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: "Email là bắt buộc" });
            return;
        }

        if (checkExist) {
            const exists = await userModel.findOne({ email });
            if (exists) {
                res.status(400).json({ success: false, message: "Email này đã tồn tại, vui lòng sử dụng email khác." });
                return;
            }
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to DB with 5 min expiry
        await otpModel.findOneAndUpdate(
            { email },
            { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
            { upsert: true, returnDocument: 'after' }
        );

        // Send Email
        try {
            await sendMail(
                email,
                "Mã xác thực đăng nhập QuickStay",
                `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 5 phút.`
            );
        } catch (mailError) {
            console.error("Nodemailer Detail Error:", mailError);
            throw new Error("Lỗi dịch vụ gửi mail (SMTP): " + (mailError as Error).message);
        }

        res.json({ success: true, message: "Mã OTP đã được gửi đến email của bạn" });

    } catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({ success: false, message: "Không thể gửi OTP: " + (error as Error).message });
    }
};

// API to login with OTP
const loginWithOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            res.status(400).json({ success: false, message: "Email và OTP là bắt buộc" });
            return;
        }

        const otpData = await otpModel.findOne({ email, otp });

        if (!otpData) {
            res.status(400).json({ success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
            return;
        }

        // OTP is valid, delete it
        await otpModel.deleteOne({ _id: otpData._id });

        // Find or create user
        let user = await userModel.findOne({ email });

        if (!user) {
            // New user registration via Email Verification
            user = new userModel({
                full_name: email.split('@')[0], // Default name from email
                email,
                avatar: "", 
            });
            await user.save();
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
                balance: user.balance,
                totalRecharged: user.totalRecharged
            },

            message: "Đăng nhập thành công"
        });

    } catch (error) {
        console.error("Login OTP Error:", error);
        res.status(500).json({ success: false, message: "Đăng nhập thất bại: " + (error as Error).message });
    }
};

// API to verify OTP only (for Forgot Password)
const verifyOTPOnly = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;
        const otpData = await otpModel.findOne({ email, otp });

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

// API to Reset Password after OTP verification
const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp, newPassword } = req.body;

        // Verify OTP again for security
        const otpData = await otpModel.findOne({ email, otp });
        if (!otpData) {
            res.status(400).json({ success: false, message: "Phiên làm việc hết hạn, vui lòng gửi lại OTP" });
            return;
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
            return;
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });
        await otpModel.deleteOne({ _id: otpData._id });

        res.json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export { registerUser, loginUser, sendOTP, loginWithOTP, verifyOTPOnly, resetPassword, allUsers, changeRole, adminUpdatePassword, adminCreateUser, adminUpdateUser, deleteUser, getUser };
