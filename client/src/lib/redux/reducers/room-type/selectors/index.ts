import type { RootState } from '@/lib/redux/store';

export const selectAllRoomTypes = (state: RootState) => state.roomType.roomTypes;
export const selectSelectedRoomType = (state: RootState) => state.roomType.selectedRoomType;
export const selectRoomTypeLoading = (state: RootState) => state.roomType.loading;
export const selectRoomTypeSaving = (state: RootState) => state.roomType.saving;
export const selectRoomTypeError = (state: RootState) => state.roomType.error;
export const selectActiveRoomTypes = (state: RootState) =>
    state.roomType.roomTypes.filter((rt) => rt.isActive);
