import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../api/axiosInstance';

/** Lấy toàn bộ users */
export const fetchAllUsersThunk = createAsyncThunk(
    'user/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get('/api/user/all-users');
            return res.data.success ? res.data.data : [];
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Không thể tải danh sách người dùng');
        }
    }
);

/** Admin tạo user mới */
export const createUserThunk = createAsyncThunk(
    'user/create',
    async (formData: FormData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/user/admin-create-user', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.success ? res.data.data : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Tạo người dùng thất bại');
        }
    }
);

/** Admin cập nhật user */
export const updateUserThunk = createAsyncThunk(
    'user/update',
    async (formData: FormData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/user/admin-update-user', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.success ? res.data.data : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Cập nhật người dùng thất bại');
        }
    }
);

/** Xóa user */
export const deleteUserThunk = createAsyncThunk(
    'user/delete',
    async (userId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/user/delete-user', { userId });
            return res.data.success ? userId : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Xóa người dùng thất bại');
        }
    }
);

/** Cập nhật profile cá nhân */
export const updateProfileThunk = createAsyncThunk(
    'user/updateProfile',
    async (formData: FormData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/user/update-profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.success ? res.data.data : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Cập nhật profile thất bại');
        }
    }
);

/** Admin cập nhật mật khẩu */
export const adminUpdatePasswordThunk = createAsyncThunk(
    'user/adminUpdatePassword',
    async ({ userId, newPassword }: { userId: string; newPassword: string }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/user/admin-update-password', { userId, newPassword });
            return res.data.success ? res.data.message : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Cập nhật mật khẩu thất bại');
        }
});


