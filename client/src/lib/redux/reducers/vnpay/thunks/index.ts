import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../api/axiosInstance';

export const fetchVNPayHistoryThunk = createAsyncThunk(
    'vnpay/fetchHistory',
    async (userId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/vnpay/history/${userId}`);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Lấy lịch sử giao dịch thất bại');
        }
    }
);

export const createVNPayPaymentThunk = createAsyncThunk(
    'vnpay/createPayment',
    async (payload: { amount: number; userId: string }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/vnpay/create-payment', payload);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Tạo giao dịch thất bại');
        }
    }
);

export const deleteVNPayHistoryThunk = createAsyncThunk(
    'vnpay/deleteHistory',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.delete(`/api/vnpay/history/${id}`);
            return { id, success: res.data.success, message: res.data.message };
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Xóa lịch sử thất bại');
        }
    }
);

export const continueVNPayPaymentThunk = createAsyncThunk(
    'vnpay/continuePayment',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/vnpay/continue-payment/${id}`);
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Lỗi khi tiếp tục thanh toán');
        }
    }
);

export const verifyVNPayReturnThunk = createAsyncThunk(
    'vnpay/verifyReturn',
    async (params: Record<string, string>, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get('/api/vnpay/vnpay-return', { params });
            return res.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Có lỗi khi xác thực giao dịch');
        }
    }
);
