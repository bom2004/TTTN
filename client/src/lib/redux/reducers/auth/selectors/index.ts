import type { RootState } from '@/lib/redux/store';

export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsLoggedIn = (state: RootState) => !!state.auth.user;
export const selectUserRole = (state: RootState) => state.auth.user?.role ?? null;
export const selectIsAdmin = (state: RootState) =>
    state.auth.user?.role === 'admin' || state.auth.user?.role === 'hotelOwner';

export const selectIsStaff = (state: RootState) =>
    ['staff', 'receptionist', 'accountant', 'admin'].includes(state.auth.user?.role || '');
