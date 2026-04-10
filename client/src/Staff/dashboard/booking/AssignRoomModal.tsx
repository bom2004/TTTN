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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#f8fafc] dark:bg-slate-800 w-full max-w-lg my-auto rounded-[32px] shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-8 py-6 flex justify-between items-center text-left">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <span className="material-symbols-outlined text-2xl">meeting_room</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">Gán số phòng</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Booking ID: #{booking._id.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-slate-600 rounded-full transition-all"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Requirement Banner */}
                    <div className="bg-indigo-900 dark:bg-slate-900 rounded-2xl p-5 text-white flex justify-between items-center shadow-lg shadow-indigo-900/20">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">YÊU CẦU ĐẶT</span>
                            <span className="text-xs font-black uppercase text-white leading-none">{booking.roomQuantity} PHÒNG ({booking.roomTypeId?.name || 'N/A'})</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ĐÃ CHỌN</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-white leading-none">{selectedRoomIds.length}</span>
                                <span className={`w-2.5 h-2.5 rounded-full ${selectedRoomIds.length === booking.roomQuantity ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]'}`}></span>
                            </div>
                        </div>
                    </div>

                    {/* Room Grid Area */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách phòng khả dụng</label>
                             <span className="text-[10px] font-bold text-slate-300 italic">{availableRooms.length} phòng trống</span>
                        </div>
                        
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar p-1">
                            {availableRooms.length > 0 ? (
                                availableRooms.map((room: any) => {
                                    const isSelected = selectedRoomIds.includes(room._id);
                                    return (
                                        <button
                                            key={room._id}
                                            onClick={() => toggleRoom(room._id)}
                                            className={`relative h-12 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-300 border shadow-sm active:scale-95 ${
                                                isSelected 
                                                    ? 'bg-[#2c2f31] dark:bg-white text-white dark:text-slate-900 border-[#2c2f31] dark:border-white shadow-lg' 
                                                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/30'
                                            }`}
                                        >
                                            {room.roomNumber}
                                            {isSelected && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 mb-3 block">hotel_class</span>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Hệ thống đã hết phòng<br/>thuộc loại này vào ngày đã chọn</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-8 py-6 flex items-center justify-between">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                        Quay lại
                    </button>
                    <button
                        onClick={() => handleAssignAndConfirm(booking._id, selectedRoomIds)}
                        disabled={selectedRoomIds.length !== booking.roomQuantity}
                        className="px-10 py-3 bg-[#0050d4] hover:bg-[#0046bb] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-[#0050d4]/20 transition-all disabled:opacity-40 disabled:grayscale active:scale-95"
                    >
                        Tiến hành gán phòng ngay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignRoomModal;
