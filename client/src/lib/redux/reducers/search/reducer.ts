import { createSlice } from '@reduxjs/toolkit';
import { globalSearchThunk } from './thunks';
import type { SearchState } from './types';

const initialState: SearchState = {
    results: null,
    loading: false,
    error: null,
};

const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {
        clearSearchResults: (state) => {
            state.results = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(globalSearchThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(globalSearchThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.results = action.payload;
            })
            .addCase(globalSearchThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearSearchResults } = searchSlice.actions;
export default searchSlice.reducer;
