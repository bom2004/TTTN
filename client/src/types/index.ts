export interface UserData {
    id: string;
    _id?: string;
    full_name: string;
    email: string;
    phone?: string;
    role: 'customer' | 'staff' | 'admin' | 'hotelOwner' | 'receptionist' | 'accountant';
    avatar: string;
    totalSpent: number;
    membershipLevel: 'silver' | 'gold' | 'diamond' | 'platinum';
}


export interface RoomType {
    _id: string;
    name: string;
    description?: string;
    basePrice: number;
    totalInventory: number;
    capacity: number;
    size: number;
    bedType: string;
    view?: string;
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
    isActive: boolean;
    image: string;
    images: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Room {
    _id: string;
    roomNumber: string;
    roomTypeId: RoomType | string | any;
    status: 'available' | 'occupied' | 'maintenance';
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
    maxDiscountAmount: number; // New field
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
