import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../api/axiosInstance';

/** Lấy thống kê tổng quan cho staff dashboard */
export const fetchDashboardStatsThunk = createAsyncThunk(
    'staffDashboard/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const [usersRes, roomsRes] = await Promise.all([
                axiosInstance.get('/api/user/all-users'),
                axiosInstance.get('/api/rooms'),
            ]);

            const totalCustomers = usersRes.data.success
                ? (usersRes.data.data?.length || 0)
                : 0;
            const availableRooms = roomsRes.data.success
                ? (roomsRes.data.data?.filter((r: any) => r.status === 'available').length || 0)
                : 0;

            return {
                todayBookings: 12, // Sẽ cập nhật khi có API thống kê
                availableRooms,
                totalCustomers,
                pendingCheckins: 5, // Sẽ cập nhật khi có API thống kê
            };
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Không thể tải thống kê');
        }
    }
);
