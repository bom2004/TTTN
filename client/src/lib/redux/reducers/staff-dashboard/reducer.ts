import { createSlice } from '@reduxjs/toolkit';
import type { StaffDashboardState } from './types';
import { fetchDashboardStatsThunk } from './thunks';

const initialState: StaffDashboardState = {
    stats: {
        todayBookings: 0,
        availableRooms: 0,
        totalCustomers: 0,
        pendingCheckins: 0,
    },
    loading: false,
    error: null,
};

const staffDashboardSlice = createSlice({
    name: 'staffDashboard',
    initialState,
    reducers: {
        clearDashboardError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardStatsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDashboardStatsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload;
            })
            .addCase(fetchDashboardStatsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearDashboardError } = staffDashboardSlice.actions;
export default staffDashboardSlice.reducer;
