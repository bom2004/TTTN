import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../api/axiosInstance';

export const fetchAllPromotionsThunk = createAsyncThunk(
    'promotion/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get('/api/promotions');
            return res.data.success ? res.data.data : [];
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Không thể tải khuyến mãi');
        }
    }
);

export const createPromotionThunk = createAsyncThunk(
    'promotion/create',
    async (formData: FormData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/promotions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.success ? res.data.data : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Tạo khuyến mãi thất bại');
        }
    }
);

export const updatePromotionThunk = createAsyncThunk(
    'promotion/update',
    async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/promotions/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.success ? res.data.data : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Cập nhật khuyến mãi thất bại');
        }
    }
);

export const deletePromotionThunk = createAsyncThunk(
    'promotion/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.delete(`/api/promotions/${id}`);
            return res.data.success ? id : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Xóa khuyến mãi thất bại');
        }
    }
);
export const fetchUserPromotionHistoryThunk = createAsyncThunk(
    'promotion/fetchHistory',
    async (userId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/promotions/user-history/${userId}`);
            return res.data.success ? res.data.data : [];
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Không thể tải lịch sử khuyến mãi');
        }
    }
);
export const togglePromotionStatusThunk = createAsyncThunk(
    'promotion/toggleStatus',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/promotions/${id}/toggle-status`);
            return res.data.success ? { id, status: res.data.data.status } : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Thay đổi trạng thái thất bại');
        }
    }
);
