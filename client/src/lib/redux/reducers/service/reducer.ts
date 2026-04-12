import { createSlice } from '@reduxjs/toolkit';
import { ServiceState } from './types';
import * as thunks from './thunks';

const initialState: ServiceState = {
    categories: [],
    services: [],
    orders: [],
    loading: false,
    error: null,
};

const serviceSlice = createSlice({
    name: 'service',
    initialState,
    reducers: {
        clearServiceError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Categories
            .addCase(thunks.fetchCategoriesThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(thunks.fetchCategoriesThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload;
            })
            .addCase(thunks.fetchCategoriesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch Services
            .addCase(thunks.fetchServicesThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(thunks.fetchServicesThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.services = action.payload;
            })
            .addCase(thunks.fetchServicesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Create Category
            .addCase(thunks.createCategoryThunk.fulfilled, (state, action) => {
                state.categories.push(action.payload);
            })
            // Update Category
            .addCase(thunks.updateCategoryThunk.fulfilled, (state, action) => {
                const index = state.categories.findIndex(c => c._id === action.payload._id);
                if (index !== -1) state.categories[index] = action.payload;
            })
            // Delete Category
            .addCase(thunks.deleteCategoryThunk.fulfilled, (state, action) => {
                state.categories = state.categories.filter(c => c._id !== action.payload);
            })
            // Fetch Orders
            .addCase(thunks.fetchServiceOrdersThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(thunks.fetchServiceOrdersThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload;
            })
            .addCase(thunks.fetchServiceOrdersThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Update Order Status
            .addCase(thunks.updateOrderStatusThunk.fulfilled, (state, action) => {
                const index = state.orders.findIndex(o => o._id === action.payload._id);
                if (index !== -1) state.orders[index] = action.payload;
            });
    },
});

export const { clearServiceError } = serviceSlice.actions;
export default serviceSlice.reducer;
