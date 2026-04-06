import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../api/axiosInstance';

export const fetchAllRoomTypesThunk = createAsyncThunk(
    'roomType/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get('/api/room-types?admin=true');
            return res.data.success ? res.data.data : [];
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Không thể tải loại phòng');
        }
    }
);

export const createRoomTypeThunk = createAsyncThunk(
    'roomType/create',
    async (formData: FormData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/room-types', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.success ? res.data.data : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Tạo loại phòng thất bại');
        }
    }
);

export const updateRoomTypeThunk = createAsyncThunk(
    'roomType/update',
    async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/room-types/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.success ? res.data.data : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Cập nhật loại phòng thất bại');
        }
    }
);

export const deleteRoomTypeThunk = createAsyncThunk(
    'roomType/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.delete(`/api/room-types/${id}`);
            return res.data.success ? id : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Xóa loại phòng thất bại');
        }
    }
);

export const toggleRoomTypeStatusThunk = createAsyncThunk(
    'roomType/toggleStatus',
    async ({ id, isActive }: { id: string; isActive: boolean }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/room-types/${id}`, { isActive });
            return res.data.success ? { id, isActive } : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Thay đổi trạng thái thất bại');
        }
    }
);
