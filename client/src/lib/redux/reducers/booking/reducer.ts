import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BookingState, Booking } from './types';
import {
    fetchAllBookingsThunk,
    fetchMyBookingsThunk,
    fetchBookingByIdThunk,
    updateBookingStatusThunk,
    deleteBookingThunk,
    cancelMyBookingThunk,
    createBookingThunk,
    adminUpdateBookingThunk,
    addExtraPaymentThunk,
} from './thunks';

const initialState: BookingState = {
    bookings: [],
    selectedBooking: null,
    loading: false,
    updating: false,
    error: null,
};

const bookingSlice = createSlice({
    name: 'booking',
    initialState,
    reducers: {
        setSelectedBooking(state, action: PayloadAction<Booking | null>) {
            state.selectedBooking = action.payload;
        },
        clearBookingError(state) {
            state.error = null;
        },
        addBookingSocket(state, action: PayloadAction<Booking>) {
            const exists = state.bookings.some(b => b._id === action.payload._id);
            if (!exists) {
                state.bookings.unshift(action.payload);
            }
        },
        updateBookingSocket(state, action: PayloadAction<Booking>) {
            const idx = state.bookings.findIndex(b => b._id === action.payload._id);
            if (idx !== -1) {
                state.bookings[idx] = { ...state.bookings[idx], ...action.payload };
            }
            if (state.selectedBooking && state.selectedBooking._id === action.payload._id) {
                state.selectedBooking = { ...state.selectedBooking, ...action.payload };
            }
        },
        removeBookingSocket(state, action: PayloadAction<string>) {
            state.bookings = state.bookings.filter(b => b._id !== action.payload);
            if (state.selectedBooking?._id === action.payload) {
                state.selectedBooking = null;
            }
        },
    },
    extraReducers: (builder) => {
        // Fetch all
        builder
            .addCase(fetchAllBookingsThunk.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAllBookingsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.bookings = action.payload;
            })
            .addCase(fetchAllBookingsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch my bookings
        builder
            .addCase(fetchMyBookingsThunk.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchMyBookingsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.bookings = action.payload;
            })
            .addCase(fetchMyBookingsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch by id
        builder
            .addCase(fetchBookingByIdThunk.pending, (state) => { state.loading = true; })
            .addCase(fetchBookingByIdThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedBooking = action.payload;
            })
            .addCase(fetchBookingByIdThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Update status
        builder
            .addCase(updateBookingStatusThunk.pending, (state) => { state.updating = true; })
            .addCase(updateBookingStatusThunk.fulfilled, (state, action) => {
                state.updating = false;
                const { id, status, paymentStatus } = action.payload as any;
                const idx = state.bookings.findIndex((b) => b._id === id);
                if (idx !== -1) {
                    state.bookings[idx].status = status;
                    if (paymentStatus) state.bookings[idx].paymentStatus = paymentStatus;
                }
                if (state.selectedBooking && state.selectedBooking._id === id) {
                    state.selectedBooking.status = status as Booking['status'];
                    if (paymentStatus) state.selectedBooking.paymentStatus = paymentStatus;
                }
            })
            .addCase(updateBookingStatusThunk.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload as string;
            });

        // Cancel booking
        builder
            .addCase(cancelMyBookingThunk.pending, (state) => { state.updating = true; })
            .addCase(cancelMyBookingThunk.fulfilled, (state, action) => {
                state.updating = false;
                const { id, status } = action.payload as any;
                const idx = state.bookings.findIndex((b) => b._id === id);
                if (idx !== -1) {
                    state.bookings[idx].status = status;
                }
                if (state.selectedBooking && state.selectedBooking._id === id) {
                    state.selectedBooking.status = status as Booking['status'];
                }
            })
            .addCase(cancelMyBookingThunk.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload as string;
            });

        // Delete
        builder
            .addCase(deleteBookingThunk.pending, (state) => { state.updating = true; })
            .addCase(deleteBookingThunk.fulfilled, (state, action) => {
                state.updating = false;
                state.bookings = state.bookings.filter((b) => b._id !== action.payload);
                if (state.selectedBooking?._id === action.payload) state.selectedBooking = null;
            })
            .addCase(deleteBookingThunk.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload as string;
            });

        // Create
        builder
            .addCase(createBookingThunk.pending, (state) => { state.updating = true; })
            .addCase(createBookingThunk.fulfilled, (state, action) => {
                state.updating = false;
                if (action.payload.success && action.payload.data) {
                    state.bookings.unshift(action.payload.data);
                }
            })
            .addCase(createBookingThunk.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload as string;
            });

        // Admin Update
        builder
            .addCase(adminUpdateBookingThunk.pending, (state) => { state.updating = true; })
            .addCase(adminUpdateBookingThunk.fulfilled, (state, action) => {
                state.updating = false;
                const updated = action.payload;
                const idx = state.bookings.findIndex((b) => b._id === updated._id);
                if (idx !== -1) {
                    state.bookings[idx] = { ...state.bookings[idx], ...updated };
                }
                if (state.selectedBooking && state.selectedBooking._id === updated._id) {
                    state.selectedBooking = { ...state.selectedBooking, ...updated };
                }
            })
            .addCase(adminUpdateBookingThunk.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload as string;
            });

        // Add payment
        builder
            .addCase(addExtraPaymentThunk.pending, (state) => { state.updating = true; })
            .addCase(addExtraPaymentThunk.fulfilled, (state, action) => {
                state.updating = false;
                const updated = action.payload;
                const idx = state.bookings.findIndex((b) => b._id === updated._id);
                if (idx !== -1) {
                    state.bookings[idx] = { ...state.bookings[idx], ...updated };
                }
                if (state.selectedBooking && state.selectedBooking._id === updated._id) {
                    state.selectedBooking = { ...state.selectedBooking, ...updated };
                }
            })
            .addCase(addExtraPaymentThunk.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload as string;
            });
    },
});

export const { 
    setSelectedBooking, 
    clearBookingError, 
    addBookingSocket, 
    updateBookingSocket, 
    removeBookingSocket 
} = bookingSlice.actions;
export default bookingSlice.reducer;
