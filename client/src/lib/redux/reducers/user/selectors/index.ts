import type { RootState } from '@/lib/redux/store';

export const selectAllUsers = (state: RootState) => state.user.users;
export const selectSelectedUser = (state: RootState) => state.user.selectedUser;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserSaving = (state: RootState) => state.user.saving;
export const selectUserError = (state: RootState) => state.user.error;
export const selectCustomers = (state: RootState) =>
    state.user.users.filter((u) => u.role === 'customer');
export const selectStaff = (state: RootState) =>
    state.user.users.filter((u) => u.role === 'staff');
export const selectUserCount = (state: RootState) => state.user.users.length;
export const selectOnlineUserIds = (state: RootState) => state.user.onlineUserIds;
