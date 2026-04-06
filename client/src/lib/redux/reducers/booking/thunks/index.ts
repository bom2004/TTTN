import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../api/axiosInstance';
import type { UpdateBookingStatusPayload } from '../types';

/** Lấy toàn bộ danh sách đặt phòng (admin/staff) */
export const fetchAllBookingsThunk = createAsyncThunk(
    'booking/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get('/api/bookings');
            if (res.data.success && res.data.data) {
                // Enrich từng booking với chi tiết phòng
                const enriched = await Promise.all(
                    res.data.data.map(async (b: any) => {
                        try {
                            const detail = await axiosInstance.get(`/api/bookings/${b._id}`);
                            return detail.data.success ? detail.data.data : b;
                        } catch {
                            return b;
                        }
                    })
                );
                return enriched;
            }
            return [];
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Không thể tải danh sách đặt phòng');
        }
    }
);

/** Lấy danh sách đặt phòng của user hiện tại */
export const fetchMyBookingsThunk = createAsyncThunk(
    'booking/fetchMine',
    async (userId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/bookings/user/${userId}`);
            return res.data.success ? res.data.data : [];
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Không thể tải lịch sử đặt phòng');
        }
    }
);

/** Lấy chi tiết một booking */
export const fetchBookingByIdThunk = createAsyncThunk(
    'booking/fetchById',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/bookings/${id}`);
            return res.data.success ? res.data.data : null;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Không thể tải chi tiết đặt phòng');
        }
    }
);

/** Cập nhật trạng thái đặt phòng */
export const updateBookingStatusThunk = createAsyncThunk(
    'booking/updateStatus',
    async ({ id, status, paymentStatus }: UpdateBookingStatusPayload, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/bookings/${id}/status`, { status, paymentStatus });
            return res.data.success ? { id, status, paymentStatus } : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
        }
    }
);

/** Xóa một booking */
export const deleteBookingThunk = createAsyncThunk(
    'booking/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.delete(`/api/bookings/${id}`);
            return res.data.success ? id : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Xóa đặt phòng thất bại');
        }
    }
);
/** Hủy đơn đặt phòng (user) */
export const cancelMyBookingThunk = createAsyncThunk(
    'booking/cancel',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/bookings/${id}/cancel`);
            return res.data.success ? { id, status: 'cancelled' } : rejectWithValue(res.data.message);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Hủy đơn hàng thất bại');
        }
    }
);

export const createBookingThunk = createAsyncThunk(
    'booking/create',
    async (bookingData: any, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/bookings', bookingData);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Đặt phòng thất bại');
        }
    }
);
