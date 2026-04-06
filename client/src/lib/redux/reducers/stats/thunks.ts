import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { StatsData } from './types.ts';

const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export const fetchAdminStatsThunk = createAsyncThunk(
    'stats/fetchAdminStats',
    async (period: string = 'month', { rejectWithValue }) => {
        try {
            const response = await axios.get(`${baseUrl}/api/stats/admin-stats?period=${period}`);
            if (response.data.success) {
                return response.data.data as StatsData;
            }
            return rejectWithValue("Không thể lấy dữ liệu thống kê.");
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Lỗi kết nối Server.");
        }
    }
);
