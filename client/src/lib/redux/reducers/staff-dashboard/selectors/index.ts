import type { RootState } from '@/lib/redux/store';

export const selectDashboardStats = (state: RootState) => state.staffDashboard.stats;
export const selectDashboardLoading = (state: RootState) => state.staffDashboard.loading;
export const selectDashboardError = (state: RootState) => state.staffDashboard.error;
export const selectTodayBookings = (state: RootState) => state.staffDashboard.stats.todayBookings;
export const selectAvailableRoomCount = (state: RootState) => state.staffDashboard.stats.availableRooms;
export const selectTotalCustomers = (state: RootState) => state.staffDashboard.stats.totalCustomers;
export const selectPendingCheckins = (state: RootState) => state.staffDashboard.stats.pendingCheckins;
