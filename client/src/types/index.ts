export interface UserData {
    id: string;
    _id?: string;
    full_name: string;
    email: string;
    phone?: string;
    role: 'customer' | 'staff' | 'admin' | 'hotelOwner';
    avatar: string;
    balance: number;
    totalRecharged: number;
}


export interface RoomType {
    _id: string;
    name: string;
    description?: string;
    basePrice: number;
    isActive: boolean;
    image: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Room {
    _id: string;
    name: string;
    roomType: string;
    capacity: number;
    size: number;

    bedType: string;
    view?: string;
    description: string;
    price: number;
    originalPrice?: number;
    availableRooms: number;
    status: 'available' | 'sold_out';
    thumbnail: string;
    images: string[];
    amenities: {
        wifi: boolean;
        airConditioner: boolean;
        breakfast: boolean;
        minibar: boolean;
        tv: boolean;
        balcony: boolean;
    };
    rating: number;
    reviewCount: number;
    hotelId?: string;
    createdAt?: string;
    updatedAt?: string;
}


export interface IPromotion {
    _id: string;
    title: string;
    description: string;
    discountPercent: number;
    code: string;
    startDate: string;
    endDate: string;
    minOrderValue: number;
    usageLimit: number;
    usedCount: number;
    usedBy?: string[];
    roomTypes?: string[]; // New field
    image?: string;
    minGeniusLevel: number;
    status: 'active' | 'inactive' | 'expired';
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    users?: T; // For user list response
    user?: T;  // For single user response
    token?: string;
    userData?: UserData;
    paymentUrl?: string; // For VNPay response
    amount?: number;    // For VNPay return response
}
