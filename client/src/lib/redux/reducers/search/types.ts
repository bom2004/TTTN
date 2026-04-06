import { Room, RoomType, IPromotion } from '../../../types';

export interface SearchResult {
    rooms: Room[];
    roomTypes: RoomType[];
    promotions: IPromotion[];
}

export interface SearchState {
    results: SearchResult | null;
    loading: boolean;
    error: string | null;
}
