import React, { useMemo } from 'react';

interface AssignRoomModalProps {
    booking: any;
    onClose: () => void;
    getAvailableRoomsForBooking: (booking: any, rooms: any[], bookings: any[]) => any[];
    allRooms: any[];
    bookings: any[];
    selectedRoomIds: string[];
    setSelectedRoomIds: (ids: string[]) => void;
    handleAssignAndConfirm: (bookingId: string, roomIds: string[]) => void;
}

const AssignRoomModal: React.FC<AssignRoomModalProps> = ({
    booking,
    onClose,
    getAvailableRoomsForBooking,
    allRooms,
    bookings,
    selectedRoomIds,
    setSelectedRoomIds,
    handleAssignAndConfirm
}) => {
    if (!booking) return null;

    const availableRooms = useMemo(() => {
        return getAvailableRoomsForBooking(booking, allRooms, bookings);
    }, [booking, allRooms, bookings, getAvailableRoomsForBooking]);

    const toggleRoom = (roomId: string) => {
        if (selectedRoomIds.includes(roomId)) {
            setSelectedRoomIds(selectedRoomIds.filter(id => id !== roomId));
        } else {
            if (selectedRoomIds.length < booking.roomQuantity) {
                setSelectedRoomIds([...selectedRoomIds, roomId]);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-lg my-auto rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Gán phòng cho đơn đặt</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Mã đơn: #{booking._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                        <p className="text-sm font-bold text-blue-900">Yêu cầu: {booking.roomQuantity} phòng</p>
                        <p className="text-sm font-bold text-emerald-600">Đã chọn: {selectedRoomIds.length}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Danh sách phòng trống loại {booking.roomTypeId?.name || 'N/A'}</label>
                        <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-1">
                            {availableRooms.length > 0 ? (
                                availableRooms.map((room: any) => {
                                    const isSelected = selectedRoomIds.includes(room._id);
                                    return (
                                        <button
                                            key={room._id}
                                            onClick={() => toggleRoom(room._id)}
                                            className={`py-2 px-1 border rounded-lg text-sm font-bold transition-all ${
                                                isSelected 
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                            }`}
                                        >
                                            {room.roomNumber}
                                        </button>
                                    );
                                })
                            ) : (
                                <p className="col-span-4 text-center text-sm text-gray-500 py-4 bg-gray-50 rounded-md border border-gray-100">Không có phòng trống nào phù hợp.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t px-6 py-4 flex justify-end gap-2 bg-white rounded-b-lg">
                    <button onClick={onClose} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition">
                        Hủy
                    </button>
                    <button
                        onClick={() => handleAssignAndConfirm(booking._id, selectedRoomIds)}
                        disabled={selectedRoomIds.length !== booking.roomQuantity}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition shadow-md shadow-blue-200"
                    >
                        Xác nhận gán
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignRoomModal;
