import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../api/axiosInstance';
import type { SearchResult } from '../types';

export const globalSearchThunk = createAsyncThunk(
    'search/globalSearch',
    async (query: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/search?query=${encodeURIComponent(query)}`);
            return res.data.success ? res.data.data : { rooms: [], roomTypes: [], promotions: [] };
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Tìm kiếm thất bại');
        }
    }
);
