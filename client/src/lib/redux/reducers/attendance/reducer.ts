import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AttendanceState, AttendanceData } from './types';
import { 
    checkInThunk, 
    checkOutThunk,
    fetchMyAttendanceThunk, 
    fetchAllAttendanceThunk, 
    grantLeaveThunk 
} from './thunks';

const initialState: AttendanceState = {
    records: [],
    myRecords: [],
    loading: false,
    error: null,
};

export const attendanceSlice = createSlice({
    name: 'attendance',
    initialState,
    reducers: {
        clearAttendanceError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Check-in
        builder
            .addCase(checkInThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkInThunk.fulfilled, (state, action: PayloadAction<AttendanceData>) => {
                state.loading = false;
                state.myRecords.unshift(action.payload);
                state.records.unshift(action.payload);
            })
            .addCase(checkInThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Lỗi điểm danh';
            });

        // Check-out
        builder
            .addCase(checkOutThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkOutThunk.fulfilled, (state, action: PayloadAction<AttendanceData>) => {
                state.loading = false;
                // Cập nhật bản ghi check-out trong danh sách
                const myIdx = state.myRecords.findIndex(r => r._id === action.payload._id || r.id === action.payload.id);
                if (myIdx !== -1) state.myRecords[myIdx] = action.payload;

                const globalIdx = state.records.findIndex(r => r._id === action.payload._id || r.id === action.payload.id);
                if (globalIdx !== -1) state.records[globalIdx] = action.payload;
            })
            .addCase(checkOutThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Lỗi kết thúc ca';
            });

        // Fetch My Attendance
        builder
            .addCase(fetchMyAttendanceThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyAttendanceThunk.fulfilled, (state, action: PayloadAction<AttendanceData[]>) => {
                state.loading = false;
                state.myRecords = action.payload;
            })
            .addCase(fetchMyAttendanceThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Lỗi tải lịch sử điểm danh';
            });

        // Fetch All Attendance
        builder
            .addCase(fetchAllAttendanceThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllAttendanceThunk.fulfilled, (state, action: PayloadAction<AttendanceData[]>) => {
                state.loading = false;
                state.records = action.payload;
            })
            .addCase(fetchAllAttendanceThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Lỗi tải danh sách điểm danh';
            });

        // Grant Leave
        builder
            .addCase(grantLeaveThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(grantLeaveThunk.fulfilled, (state, action: PayloadAction<AttendanceData>) => {
                state.loading = false;
                const index = state.records.findIndex(r => r.user_id._id === action.payload.user_id && r.date === action.payload.date);
                if (index !== -1) {
                    state.records[index] = action.payload;
                } else {
                    state.records.unshift(action.payload);
                }
            })
            .addCase(grantLeaveThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Lỗi cấp phép nghỉ';
            });
    },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export const attendanceReducer = attendanceSlice.reducer;
