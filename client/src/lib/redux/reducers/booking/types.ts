// ===== BOOKING TYPES =====

export interface BookingDetail {
    _id: string;
    bookingId: string;
    roomId: {
        _id: string;
        name: string;
        roomType: string;
        thumbnail: string;
        avatar?: string;
    };
    price: number;
    roomStatus: string;
}

export interface Booking {
    _id: string;
    userId: {
        _id: string;
        full_name: string;
        email: string;
    };
    customerInfo: {
        name: string;
        email: string;
        phone: string;
    };
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    promotionCode: string;
    roomTypeId?: any;
    roomQuantity?: number;
    roomTypeInfo?: {
        name: string;
        images?: string[];
        basePrice?: number;
    };
    status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled';
    paymentStatus: 'unpaid' | 'paid' | 'deposited';
    paymentMethod: 'vnpay' | 'cash' | 'balance' | 'wallet';
    paidAmount?: number;
    checkInTime: string;
    specialRequests: string;
    details?: BookingDetail[];
    createdAt: string;
}

export interface BookingState {
    bookings: Booking[];
    selectedBooking: Booking | null;
    loading: boolean;
    updating: boolean;
    error: string | null;
}

export interface UpdateBookingStatusPayload {
    id: string;
    status: string;
    paymentStatus?: string;
}
