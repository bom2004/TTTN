import type { RootState } from '@/lib/redux/store';

export const selectAllRooms = (state: RootState) => state.room.rooms;
export const selectSelectedRoom = (state: RootState) => state.room.selectedRoom;
export const selectRoomLoading = (state: RootState) => state.room.loading;
export const selectRoomSaving = (state: RootState) => state.room.saving;
export const selectRoomError = (state: RootState) => state.room.error;
export const selectAvailableRooms = (state: RootState) =>
    state.room.rooms.filter((r: any) => r.status === 'available');
export const selectAvailableRoomCount = (state: RootState) =>
    state.room.rooms.filter((r: any) => r.status === 'available').length;
