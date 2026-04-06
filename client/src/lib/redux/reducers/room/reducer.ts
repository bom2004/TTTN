import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RoomState, Room } from './types';
import {
    fetchAllRoomsThunk,
    fetchRoomByIdThunk,
    createRoomThunk,
    updateRoomThunk,
    deleteRoomThunk,
    searchRoomsThunk,
    updateRoomStatusThunk,
} from './thunks';

const initialState: RoomState = {
    rooms: [],
    searchResults: [],
    selectedRoom: null,
    loading: false,
    saving: false,
    error: null,
};

const roomSlice = createSlice({
    name: 'room',
    initialState,
    reducers: {
        setSelectedRoom(state, action: PayloadAction<Room | null>) {
            state.selectedRoom = action.payload;
        },
        clearRoomError(state) {
            state.error = null;
        },
        updateRoomStatusSocket(state, action: PayloadAction<{ id: string, status: Room['status'] }>) {
            const { id, status } = action.payload;
            const idx = state.rooms.findIndex(r => r._id === id);
            if (idx !== -1) {
                state.rooms[idx].status = status;
            }
            if (state.selectedRoom?._id === id) {
                state.selectedRoom.status = status;
            }
        },
    },
    extraReducers: (builder) => {
        // Fetch all
        builder
            .addCase(fetchAllRoomsThunk.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAllRoomsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.rooms = action.payload;
            })
            .addCase(fetchAllRoomsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch by id
        builder
            .addCase(fetchRoomByIdThunk.pending, (state) => { state.loading = true; })
            .addCase(fetchRoomByIdThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedRoom = action.payload;
            })
            .addCase(fetchRoomByIdThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Create
        builder
            .addCase(createRoomThunk.pending, (state) => { state.saving = true; })
            .addCase(createRoomThunk.fulfilled, (state, action) => {
                state.saving = false;
                if (action.payload) state.rooms.push(action.payload);
            })
            .addCase(createRoomThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // Update
        builder
            .addCase(updateRoomThunk.pending, (state) => { state.saving = true; })
            .addCase(updateRoomThunk.fulfilled, (state, action) => {
                state.saving = false;
                const updated: Room = action.payload;
                const idx = state.rooms.findIndex((r) => r._id === updated._id);
                if (idx !== -1) state.rooms[idx] = updated;
                if (state.selectedRoom?._id === updated._id) state.selectedRoom = updated;
            })
            .addCase(updateRoomThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // Delete
        builder
            .addCase(deleteRoomThunk.pending, (state) => { state.saving = true; })
            .addCase(deleteRoomThunk.fulfilled, (state, action) => {
                state.saving = false;
                state.rooms = state.rooms.filter((r) => r._id !== action.payload);
                if (state.selectedRoom?._id === action.payload) state.selectedRoom = null;
            })
            .addCase(deleteRoomThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // Search
        builder
            .addCase(searchRoomsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(searchRoomsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.searchResults = action.payload;
            })
            .addCase(searchRoomsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
        // Update status
        builder
            .addCase(updateRoomStatusThunk.fulfilled, (state, action) => {
                const { id, status } = action.payload as any;
                const idx = state.rooms.findIndex((room) => room._id === id);
                if (idx !== -1) {
                    state.rooms[idx].status = status;
                }
            });
    },
});

export const { setSelectedRoom, clearRoomError, updateRoomStatusSocket } = roomSlice.actions;
export default roomSlice.reducer;
