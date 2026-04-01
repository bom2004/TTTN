import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../api/axiosInstance';
import { AttendanceData } from '../types';

export interface CheckInPayload {
    userId: string;
    latitude?: number;
    longitude?: number;
    image_base64?: string;
}

export const checkInThunk = createAsyncThunk<AttendanceData, CheckInPayload, { rejectValue: string }>(
    'attendance/checkIn',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/api/attendance/check-in`, payload);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi điểm danh');
        }
    }
);

export const checkOutThunk = createAsyncThunk<AttendanceData, string, { rejectValue: string }>(
    'attendance/checkOut',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/api/attendance/check-out`, { userId });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi kết thúc ca');
        }
    }
);

export const fetchMyAttendanceThunk = createAsyncThunk<AttendanceData[], string, { rejectValue: string }>(
    'attendance/fetchMy',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/api/attendance/my-attendance/${userId}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải lịch sử điểm danh');
        }
    }
);

export const fetchAllAttendanceThunk = createAsyncThunk<AttendanceData[], string | undefined, { rejectValue: string }>(
    'attendance/fetchAll',
    async (monthYear, { rejectWithValue }) => {
        try {
            const url = monthYear ? `/api/attendance/all?monthYear=${monthYear}` : `/api/attendance/all`;
            const response = await axiosInstance.get(url);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải danh sách điểm danh');
        }
    }
);

export const grantLeaveThunk = createAsyncThunk<AttendanceData, { userId: string; date: string; note?: string }, { rejectValue: string }>(
    'attendance/grantLeave',
    async (data, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/api/attendance/grant-leave`, data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi cấp phép nghỉ');
        }
    }
);
