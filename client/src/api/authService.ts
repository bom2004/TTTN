import axios from 'axios';
import { ApiResponse, UserData } from '../types';

const backendUrl = "http://localhost:3000";

const authService = {
    // Đăng ký tài khoản mới
    register: async (formData: any) => {
        const response = await axios.post<ApiResponse<UserData>>(`${backendUrl}/api/auth/register`, formData);
        return response.data;
    },

    // Đăng nhập bằng Email & Mật khẩu
    login: async (formData: any) => {
        const response = await axios.post<ApiResponse<UserData>>(`${backendUrl}/api/auth/login`, formData);
        return response.data;
    },

    // Gửi mã OTP (cho Đăng ký/Quên mật khẩu/Đăng nhập OTP)
    sendOTP: async (email: string, checkExist: boolean = false) => {
        const response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/auth/send-otp`, { email, checkExist });
        return response.data;
    },

    // Xác thực OTP để Đăng nhập
    verifyOTP: async (email: string, otp: string) => {
        const response = await axios.post<ApiResponse<UserData>>(`${backendUrl}/api/auth/verify-otp`, { email, otp });
        return response.data;
    },

    // Chỉ xác thực OTP (cho Quên mật khẩu)
    verifyOTPOnly: async (email: string, otp: string) => {
        const response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/auth/verify-otp-only`, { email, otp });
        return response.data;
    },

    // Đặt lại mật khẩu mới
    resetPassword: async (formData: any) => {
        const response = await axios.post<ApiResponse<any>>(`${backendUrl}/api/auth/reset-password`, formData);
        return response.data;
    }
};

export default authService;
