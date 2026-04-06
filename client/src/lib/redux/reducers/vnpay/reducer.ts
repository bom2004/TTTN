import { createSlice } from '@reduxjs/toolkit';
import { fetchVNPayHistoryThunk, deleteVNPayHistoryThunk } from './thunks';
import type { VNPayState } from './types';

const initialState: VNPayState = {
    history: [],
    loading: false,
    error: null,
};

const vnpaySlice = createSlice({
    name: 'vnpay',
    initialState,
    reducers: {
        clearVNPayError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch History
        builder
            .addCase(fetchVNPayHistoryThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVNPayHistoryThunk.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.success) {
                    state.history = action.payload.history || [];
                }
            })
            .addCase(fetchVNPayHistoryThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Delete History
        builder
            .addCase(deleteVNPayHistoryThunk.fulfilled, (state, action) => {
                if (action.payload.success) {
                    state.history = state.history.filter(item => (item._id || item.id) !== action.payload.id);
                }
            });
    },
});

export const { clearVNPayError } = vnpaySlice.actions;
export default vnpaySlice.reducer;
