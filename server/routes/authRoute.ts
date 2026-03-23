import express from "express";
import { 
    registerUser, 
    loginUser, 
    sendOTP, 
    loginWithOTP, 
    verifyOTPOnly, 
    resetPassword 
} from "../controllers/authController.ts";

const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/send-otp", sendOTP);
authRouter.post("/verify-otp", loginWithOTP);
authRouter.post("/verify-otp-only", verifyOTPOnly);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
