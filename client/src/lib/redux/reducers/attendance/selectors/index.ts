import { RootState } from '../../../store';

export const selectAllAttendance = (state: RootState) => state.attendance.records;
export const selectMyAttendance = (state: RootState) => state.attendance.myRecords;
export const selectAttendanceLoading = (state: RootState) => state.attendance.loading;
export const selectAttendanceError = (state: RootState) => state.attendance.error;
