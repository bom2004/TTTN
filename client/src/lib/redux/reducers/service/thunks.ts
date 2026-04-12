import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/service-bookings';

// Categories
export const fetchCategoriesThunk = createAsyncThunk(
    'service/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/categories`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải danh mục');
        }
    }
);

export const createCategoryThunk = createAsyncThunk(
    'service/createCategory',
    async (data: { name: string; description?: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/categories`, data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi thêm danh mục');
        }
    }
);

export const updateCategoryThunk = createAsyncThunk(
    'service/updateCategory',
    async ({ id, data }: { id: string; data: { name: string; description?: string } }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/categories/${id}`, data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật danh mục');
        }
    }
);

export const deleteCategoryThunk = createAsyncThunk(
    'service/deleteCategory',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/categories/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi xóa danh mục');
        }
    }
);

// Services
export const fetchServicesThunk = createAsyncThunk(
    'service/fetchServices',
    async (categoryId: string | undefined, { rejectWithValue }) => {
        try {
            const url = categoryId ? `${API_URL}/services?categoryId=${categoryId}` : `${API_URL}/services`;
            const response = await axios.get(url);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải dịch vụ');
        }
    }
);

export const createServiceThunk = createAsyncThunk(
    'service/createService',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/services`, data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi thêm dịch vụ');
        }
    }
);

export const updateServiceThunk = createAsyncThunk(
    'service/updateService',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/services/${id}`, data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật dịch vụ');
        }
    }
);

export const deleteServiceThunk = createAsyncThunk(
    'service/deleteService',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/services/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi xóa dịch vụ');
        }
    }
);

// Orders
export const fetchServiceOrdersThunk = createAsyncThunk(
    'service/fetchOrders',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/orders`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải đơn hàng');
        }
    }
);

export const updateOrderStatusThunk = createAsyncThunk(
    'service/updateOrderStatus',
    async ({ id, status, paymentStatus }: { id: string; status: string; paymentStatus?: string }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/orders/${id}/status`, { status, paymentStatus });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật trạng thái');
        }
    }
);
