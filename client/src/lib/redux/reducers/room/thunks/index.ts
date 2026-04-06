import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../api/axiosInstance';
import type { UpdateRoomPayload } from '../types';

export const fetchAllRoomsThunk = createAsyncThunk(
    'room/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get('/api/rooms');
            return res.data.success ? res.data.data : [];
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Không thể tải danh sách phòng');
        }
    }
);

export const fetchRoomByIdThunk = createAsyncThunk(
    'room/fetchById',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/rooms/${id}`);
            return res.data.success ? res.data.data : null;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Không thể tải chi tiết phòng');
        }
    }
);

export const createRoomThunk = createAsyncThunk(
    'room/create',
    async (formData: FormData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/rooms', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.success ? res.data.data : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Tạo phòng thất bại');
        }
    }
);

export const updateRoomThunk = createAsyncThunk(
    'room/update',
    async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/rooms/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.success ? res.data.data : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Cập nhật phòng thất bại');
        }
    }
);

export const deleteRoomThunk = createAsyncThunk(
    'room/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.delete(`/api/rooms/${id}`);
            return res.data.success ? id : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Xóa phòng thất bại');
        }
    }
);

export const updateRoomStatusThunk = createAsyncThunk(
    'room/updateStatus',
    async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/rooms/${id}`, { status });
            return res.data.success ? { id, status: (res.data.data || res.data.room).status } : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
        }
    }
);

export const searchRoomsThunk = createAsyncThunk(
    'room/search',
    async (params: any, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get('/api/rooms/search', { params });
            return res.data.success ? res.data.data : [];
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Tìm kiếm phòng thất bại');
        }
    }
);
