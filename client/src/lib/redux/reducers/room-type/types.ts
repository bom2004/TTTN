// ===== ROOM TYPE TYPES =====

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

export interface RoomTypeState {
    roomTypes: RoomType[];
    selectedRoomType: RoomType | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
}

export interface CreateRoomTypePayload {
    name: string;
    description?: string;
    basePrice: number;
    isActive?: boolean;
}

export interface UpdateRoomTypePayload extends Partial<CreateRoomTypePayload> {
    id: string;
}
