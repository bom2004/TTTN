import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserState, User, AdminRechargeResult } from './types';
import {
    fetchAllUsersThunk,
    createUserThunk,
    updateUserThunk,
    deleteUserThunk,
    adminUpdatePasswordThunk,
    adminRechargeThunk,
} from './thunks';

const initialState: UserState = {
    users: [],
    selectedUser: null,
    loading: false,
    saving: false,
    error: null,
    onlineUserIds: [] as string[],
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setSelectedUser(state, action: PayloadAction<User | null>) {
            state.selectedUser = action.payload;
        },
        clearUserError(state) {
            state.error = null;
        },
        setOnlineUsers(state, action: PayloadAction<string[]>) {
            state.onlineUserIds = action.payload;
        },
        addOnlineUser(state, action: PayloadAction<string>) {
            if (!state.onlineUserIds.includes(action.payload)) {
                state.onlineUserIds.push(action.payload);
            }
        },
        removeOnlineUser(state, action: PayloadAction<string>) {
            state.onlineUserIds = state.onlineUserIds.filter(id => id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        // Fetch all
        builder
            .addCase(fetchAllUsersThunk.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAllUsersThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(fetchAllUsersThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Create
        builder
            .addCase(createUserThunk.pending, (state) => { state.saving = true; })
            .addCase(createUserThunk.fulfilled, (state, action) => {
                state.saving = false;
                if (action.payload) state.users.push(action.payload);
            })
            .addCase(createUserThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // Update
        builder
            .addCase(updateUserThunk.pending, (state) => { state.saving = true; })
            .addCase(updateUserThunk.fulfilled, (state, action) => {
                state.saving = false;
                const updated: User = action.payload;
                const idx = state.users.findIndex((u) => (u._id || u.id) === (updated._id || updated.id));
                if (idx !== -1) state.users[idx] = updated;
                if ((state.selectedUser?._id || state.selectedUser?.id) === (updated._id || updated.id)) state.selectedUser = updated;
            })
            .addCase(updateUserThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // Update Password (Admin)
        builder
            .addCase(adminUpdatePasswordThunk.pending, (state) => { state.saving = true; })
            .addCase(adminUpdatePasswordThunk.fulfilled, (state) => { state.saving = false; })
            .addCase(adminUpdatePasswordThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // Delete
        builder
            .addCase(deleteUserThunk.pending, (state) => { state.saving = true; })
            .addCase(deleteUserThunk.fulfilled, (state, action) => {
                state.saving = false;
                state.users = state.users.filter((u) => (u._id || u.id) !== action.payload);
                if ((state.selectedUser?._id || state.selectedUser?.id) === action.payload) {
                    state.selectedUser = null;
                }
            })
            .addCase(deleteUserThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });

        // Admin Recharge
        builder
            .addCase(adminRechargeThunk.pending, (state) => { state.saving = true; })
            .addCase(adminRechargeThunk.fulfilled, (state, action: PayloadAction<AdminRechargeResult>) => {
                state.saving = false;
                const { userId, data } = action.payload;
                const idx = state.users.findIndex((u) => (u._id || u.id) === userId);
                if (idx !== -1) {
                    state.users[idx] = { ...state.users[idx], ...data };
                }
                if ((state.selectedUser?._id || state.selectedUser?.id) === userId) {
                    state.selectedUser = { ...state.selectedUser, ...data } as User;
                }
            })
            .addCase(adminRechargeThunk.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload as string;
            });
    },
});

export const { setSelectedUser, clearUserError, setOnlineUsers, addOnlineUser, removeOnlineUser } = userSlice.actions;
export default userSlice.reducer;
