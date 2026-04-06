import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../api/axiosInstance';
import type { LoginPayload, RegisterPayload, OTPPayload, ResetPasswordPayload } from '../types';

export const loginThunk = createAsyncThunk(
    'auth/login',
    async (payload: LoginPayload, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/auth/login', payload);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Đăng nhập thất bại');
        }
    }
);

export const registerThunk = createAsyncThunk(
    'auth/register',
    async (payload: RegisterPayload, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/auth/register', payload);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Đăng ký thất bại');
        }
    }
);

export const sendOTPThunk = createAsyncThunk(
    'auth/sendOTP',
    async ({ email, checkExist = false }: { email: string; checkExist?: boolean }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/auth/send-otp', { email, checkExist });
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Gửi OTP thất bại');
        }
    }
);

export const verifyOTPThunk = createAsyncThunk(
    'auth/verifyOTP',
    async (payload: OTPPayload, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/auth/verify-otp', payload);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Xác thực OTP thất bại');
        }
    }
);

export const resetPasswordThunk = createAsyncThunk(
    'auth/resetPassword',
    async (payload: ResetPasswordPayload, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/auth/reset-password', payload);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Đặt lại mật khẩu thất bại');
        }
    }
);
export const verifyOTPOnlyThunk = createAsyncThunk(
    'auth/verifyOTPOnly',
    async (payload: OTPPayload, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/auth/verify-otp-only', payload);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Xác thực OTP thất bại');
        }
    }
);

export const getProfileThunk = createAsyncThunk(
    'auth/getProfile',
    async (userId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/user/profile/${userId}`);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Không thể tải thông tin cá nhân');
        }
    }
);

export const updateProfileThunk = createAsyncThunk(
    'auth/updateProfile',
    async (formData: FormData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/user/update-profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Cập nhật hồ sơ thất bại');
        }
    }
);
