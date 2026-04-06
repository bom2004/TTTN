import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RoomTypeState, RoomType } from './types';
import {
    fetchAllRoomTypesThunk,
    createRoomTypeThunk,
    updateRoomTypeThunk,
    deleteRoomTypeThunk,
    toggleRoomTypeStatusThunk,
} from './thunks';

const initialState: RoomTypeState = {
    roomTypes: [],
    selectedRoomType: null,
    loading: false,
    saving: false,
    error: null,
};

const roomTypeSlice = createSlice({
    name: 'roomType',
    initialState,
    reducers: {
        setSelectedRoomType(state, action: PayloadAction<RoomType | null>) {
            state.selectedRoomType = action.payload;
        },
        clearRoomTypeError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch all
        builder
            .addCase(fetchAllRoomTypesThunk.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAllRoomTypesThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.roomTypes = action.payload;
            })
            .addCase(fetchAllRoomTypesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Create
        builder
            .addCase(createRoomTypeThunk.pending, (state) => { state.saving = true; })
            .addCase(createRoomTypeThunk.fulfilled, (state, action) => {
                state.saving = false;
                if (action.payload) {
                    state.roomTypes.push({ ...action.payload, totalInventory: action.payload.totalInventory || 0 });
                }
            })
            .addCase(createRoomTypeThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // Update
        builder
            .addCase(updateRoomTypeThunk.pending, (state) => { state.saving = true; })
            .addCase(updateRoomTypeThunk.fulfilled, (state, action) => {
                state.saving = false;
                const updated: RoomType = action.payload;
                const idx = state.roomTypes.findIndex((rt) => rt._id === updated._id);
                if (idx !== -1) {
                    state.roomTypes[idx] = { ...state.roomTypes[idx], ...updated };
                }
                if (state.selectedRoomType?._id === updated._id) state.selectedRoomType = updated;
            })
            .addCase(updateRoomTypeThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // Delete
        builder
            .addCase(deleteRoomTypeThunk.pending, (state) => { state.saving = true; })
            .addCase(deleteRoomTypeThunk.fulfilled, (state, action) => {
                state.saving = false;
                state.roomTypes = state.roomTypes.filter((rt) => rt._id !== action.payload);
                if (state.selectedRoomType?._id === action.payload) state.selectedRoomType = null;
            })
            .addCase(deleteRoomTypeThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // Toggle status
        builder
            .addCase(toggleRoomTypeStatusThunk.fulfilled, (state, action) => {
                const { id, isActive } = action.payload as any;
                const idx = state.roomTypes.findIndex((rt) => rt._id === id);
                if (idx !== -1) state.roomTypes[idx].isActive = isActive;
            });
    },
});

export const { setSelectedRoomType, clearRoomTypeError } = roomTypeSlice.actions;
export default roomTypeSlice.reducer;
