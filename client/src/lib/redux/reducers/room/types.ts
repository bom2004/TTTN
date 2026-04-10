// ===== ROOM TYPES =====

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

export interface RoomState {
    rooms: Room[];
    searchResults: Room[];
    selectedRoom: Room | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
}

export interface CreateRoomPayload {
    name: string;
    roomType: string;
    capacity: number;
    size: number;
    bedType: string;
    view?: string;
    description: string;
    price: number;
    availableRooms: number;
    amenities?: Partial<Room['amenities']>;
}

export interface UpdateRoomPayload extends Partial<CreateRoomPayload> {
    id: string;
    formData: FormData;
}
