import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StatsState, StatsData } from './types.ts';
import { fetchAdminStatsThunk } from './thunks.ts';

const initialState: StatsState = {
    data: null,
    loading: false,
    error: null,
};

const statsSlice = createSlice({
    name: 'stats',
    initialState,
    reducers: {
        clearStats: (state) => {
            state.data = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminStatsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminStatsThunk.fulfilled, (state, action: PayloadAction<StatsData>) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchAdminStatsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { clearStats } = statsSlice.actions;
export default statsSlice.reducer;
