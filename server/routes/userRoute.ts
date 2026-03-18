import express from "express";
import { registerUser, loginUser, sendOTP, loginWithOTP, verifyOTPOnly, resetPassword, allUsers, changeRole, adminUpdatePassword, adminCreateUser, adminUpdateUser, deleteUser, getUser } from "../controllers/userController.ts";
import { updateProfile } from "../controllers/updateUserController.ts";
import upload from "../middlewares/multer.ts";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/send-otp", sendOTP);
userRouter.post("/verify-otp", loginWithOTP);
userRouter.post("/verify-otp-only", verifyOTPOnly);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/update-profile", upload.single("avatar"), updateProfile);
userRouter.get("/profile/:userId", getUser);
userRouter.get("/all-users", allUsers);
userRouter.post("/change-role", changeRole);
userRouter.post("/admin-update-password", adminUpdatePassword);
userRouter.post("/admin-create-user", upload.single("avatar"), adminCreateUser);
userRouter.post("/admin-update-user", upload.single("avatar"), adminUpdateUser);
userRouter.post("/delete-user", deleteUser);

export default userRouter;
