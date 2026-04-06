import type { RootState } from '@/lib/redux/store';

export const selectAllBookings = (state: RootState) => state.booking.bookings;
export const selectSelectedBooking = (state: RootState) => state.booking.selectedBooking;
export const selectBookingLoading = (state: RootState) => state.booking.loading;
export const selectBookingUpdating = (state: RootState) => state.booking.updating;
export const selectBookingError = (state: RootState) => state.booking.error;

export const selectBookingsByStatus = (status: string) => (state: RootState) =>
    state.booking.bookings.filter((b: any) => b.status === status);

export const selectBookingCountByStatus = (status: string) => (state: RootState) =>
    status === 'all'
        ? state.booking.bookings.length
        : state.booking.bookings.filter((b: any) => b.status === status).length;
