// ===== SERVICE TYPES =====

export interface ServiceCategory {
    _id: string;
    name: string;
    description?: string;
}

export interface ServiceItem {
    _id: string;
    categoryId: string | ServiceCategory;
    name: string;
    price: number;
    unit: string;
    image?: string;
    isAvailable: boolean;
}

export interface ServiceOrder {
    _id: string;
    roomId: { _id: string; roomNumber: string } | null;
    bookingId: { _id: string; customerInfo: { name: string } } | null;
    items: {
        serviceId: { _id: string; name: string; image?: string };
        quantity: number;
        priceAtOrder: number;
    }[];
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'cancelled';
    paymentStatus: 'unpaid' | 'paid_now' | 'charged_to_room';
    note?: string;
    createdAt: string;
}

export interface ServiceState {
    categories: ServiceCategory[];
    services: ServiceItem[];
    orders: ServiceOrder[];
    loading: boolean;
    error: string | null;
}
