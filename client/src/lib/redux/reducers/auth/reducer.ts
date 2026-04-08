import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AuthUser } from './types';
import { loginThunk, registerThunk, verifyOTPThunk, getProfileThunk, updateProfileThunk } from './thunks';

// Khôi phục user từ localStorage khi khởi động app
const storedRaw = localStorage.getItem('userData');
const storedUser: AuthUser | null = storedRaw ? JSON.parse(storedRaw) : null;

const initialState: AuthState = {
    user: storedUser,
    token: storedUser?.token ?? null,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.token = null;
            state.error = null;
            localStorage.removeItem('userData');
            localStorage.removeItem('token');
        },
        clearError(state) {
            state.error = null;
        },
        setUser(state, action: PayloadAction<AuthUser>) {
            state.user = action.payload;
            state.token = action.payload.token ?? null;
            localStorage.setItem('userData', JSON.stringify(action.payload));
            if (action.payload.token) {
                localStorage.setItem('token', action.payload.token);
            }
        },
        updateUserAuthSocket(state, action: PayloadAction<{ membershipLevel: 'silver' | 'gold' | 'diamond' | 'platinum'; totalSpent: number }>) {
            if (state.user) {
                state.user.membershipLevel = action.payload.membershipLevel;
                state.user.totalSpent = action.payload.totalSpent;
                localStorage.setItem('userData', JSON.stringify(state.user));
            }
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(loginThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.success && action.payload.userData) {
                    const userData: AuthUser = {
                        ...action.payload.userData,
                        token: action.payload.token,
                    };
                    state.user = userData;
                    state.token = action.payload.token ?? null;
                    localStorage.setItem('userData', JSON.stringify(userData));
                    if (action.payload.token) {
                        localStorage.setItem('token', action.payload.token);
                    }
                }
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Register
        builder
            .addCase(registerThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerThunk.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(registerThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Verify OTP (đăng nhập bằng OTP)
        builder
            .addCase(verifyOTPThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyOTPThunk.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.success && action.payload.userData) {
                    const userData: AuthUser = {
                        ...action.payload.userData,
                        token: action.payload.token,
                    };
                    state.user = userData;
                    state.token = action.payload.token ?? null;
                    localStorage.setItem('userData', JSON.stringify(userData));
                    if (action.payload.token) {
                        localStorage.setItem('token', action.payload.token);
                    }
                }
            })
            .addCase(verifyOTPThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Get Profile
        builder
            .addCase(getProfileThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(getProfileThunk.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.success && action.payload.data) {
                    const dbUser = action.payload.data;
                    const userData: AuthUser = {
                        id: dbUser._id || dbUser.id,
                        full_name: dbUser.full_name,
                        email: dbUser.email,
                        phone: dbUser.phone,
                        role: dbUser.role,
                        avatar: dbUser.avatar,
                        totalSpent: dbUser.totalSpent || 0,
                        membershipLevel: dbUser.membershipLevel || 'silver',
                        token: state.token!, 
                    };
                    state.user = userData;
                    localStorage.setItem('userData', JSON.stringify(userData));
                }
            })
            .addCase(getProfileThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Update Profile
        builder
            .addCase(updateProfileThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfileThunk.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.success && action.payload.userData) {
                    const updatedUser: AuthUser = {
                        ...state.user!,
                        ...action.payload.userData,
                    };
                    state.user = updatedUser;
                    localStorage.setItem('userData', JSON.stringify(updatedUser));
                }
            })
            .addCase(updateProfileThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { logout, clearError, setUser, updateUserAuthSocket } = authSlice.actions;
export default authSlice.reducer;
