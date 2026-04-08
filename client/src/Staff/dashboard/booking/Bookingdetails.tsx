import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch } from '../../../lib/redux/store';
import { adminUpdateBookingThunk, addExtraPaymentThunk } from '../../../lib/redux/reducers/booking';

interface BookingDetailsProps {
    booking: any;
    onClose: () => void;
    isAdmin: boolean;
    roomTypes: any[];
    formatCheckInTime: (booking: any) => string;
    formatPaymentMethod: (method: string) => string;
    isUpdating: boolean;
    handleUpdateStatus: (id: string, status: string, paymentStatus?: string) => void;
    handleDeleteBooking: (id: string) => void;
    handleExportInvoice: (booking: any) => void;
    isBeforeCheckIn: (booking: any) => boolean;
    setSelectedRoomIds: (ids: string[]) => void;
    setIsAssignModalOpen: (val: boolean) => void;
    fetchBookings: () => void;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({
    booking,
    onClose,
    isAdmin,
    roomTypes,
    formatCheckInTime,
    formatPaymentMethod,
    isUpdating,
    handleUpdateStatus,
    handleDeleteBooking,
    handleExportInvoice,
    isBeforeCheckIn,
    setSelectedRoomIds,
    setIsAssignModalOpen,
    fetchBookings
}) => {
    const dispatch = useAppDispatch();
    
    // Local States for Editing
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editForm, setEditForm] = useState<any>(null);
    const [isAddingPayment, setIsAddingPayment] = useState<boolean>(false);
    const [extraAmount, setExtraAmount] = useState<number>(0);
    const [extraNote, setExtraNote] = useState<string>('');
    const [originalRoomTypeId, setOriginalRoomTypeId] = useState<string>('');

    if (!booking) return null;

    const nights = Math.ceil(
        (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const startEditing = () => {
        const currentRoomTypeId = booking.roomTypeId?._id || booking.roomTypeId;
        setOriginalRoomTypeId(String(currentRoomTypeId));
        setEditForm({
            customerInfo: { ...booking.customerInfo },
            roomTypeId: currentRoomTypeId,
            roomQuantity: booking.roomQuantity,
            checkInDate: new Date(booking.checkInDate).toISOString().split('T')[0],
            checkOutDate: new Date(booking.checkOutDate).toISOString().split('T')[0],
            checkInTime: booking.checkInTime || "Tôi chưa biết",
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            paidAmount: booking.paidAmount || 0,
            specialRequests: booking.specialRequests,
            adminNote: booking.adminNote || ""
        });
        setIsEditing(true);
    };

    const roomTypeChanged = editForm ? String(editForm.roomTypeId) !== String(originalRoomTypeId) : false;
    const datesChanged = editForm ? (
        editForm.checkInDate !== new Date(booking.checkInDate).toISOString().split('T')[0] ||
        editForm.checkOutDate !== new Date(booking.checkOutDate).toISOString().split('T')[0]
    ) : false;
    const needsReassign = roomTypeChanged || datesChanged;

    const handleAdminUpdate = async () => {
        if (!booking) return;
        try {
            await dispatch(adminUpdateBookingThunk({
                id: booking._id,
                updateData: editForm
            })).unwrap();
            if (needsReassign) {
                toast.success("Cập nhật thành công! Đơn đã về trạng thái 'Chờ duyệt' — vui lòng gán phòng lại.");
            } else {
                toast.success("Cập nhật đơn hàng thành công!");
            }
            setIsEditing(false);
            fetchBookings();
        } catch (error: any) {
            toast.error(error || "Cập nhật thất bại");
        }
    };

    const handleAddExtraPayment = async () => {
        if (!booking || extraAmount <= 0) return;
        try {
            await dispatch(addExtraPaymentThunk({
                id: booking._id,
                amount: extraAmount,
                note: extraNote
            })).unwrap();
            toast.success("Ghi nhận thanh toán bổ sung thành công!");
            setIsAddingPayment(false);
            setExtraAmount(0);
            setExtraNote('');
            fetchBookings();
        } catch (error: any) {
            toast.error(error || "Ghi nhận thanh toán thất bại");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-4">
            <div className="bg-white w-full max-w-3xl my-auto rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10 rounded-t-lg">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {isEditing ? "Chỉnh sửa đơn hàng" : `Chi tiết đơn #${booking._id.slice(-8).toUpperCase()}`}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(booking.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin && !isEditing && !['checked_in', 'checked_out', 'completed'].includes(booking.status) && (
                            <button
                                onClick={startEditing}
                                className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded text-xs font-bold hover:bg-amber-100 transition flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                Chỉnh sửa
                            </button>
                        )}
                        <button onClick={() => { setIsEditing(false); onClose(); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Thông tin khách hàng</p>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input
                                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                                        value={editForm.customerInfo.name}
                                        onChange={(e) => setEditForm({ ...editForm, customerInfo: { ...editForm.customerInfo, name: e.target.value } })}
                                        placeholder="Tên khách"
                                    />
                                    <input
                                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                                        value={editForm.customerInfo.phone}
                                        onChange={(e) => setEditForm({ ...editForm, customerInfo: { ...editForm.customerInfo, phone: e.target.value } })}
                                        placeholder="Số điện thoại"
                                    />
                                    <input
                                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                                        value={editForm.customerInfo.email}
                                        onChange={(e) => setEditForm({ ...editForm, customerInfo: { ...editForm.customerInfo, email: e.target.value } })}
                                        placeholder="Email"
                                    />
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="font-bold text-gray-800">{booking.customerInfo.name}</p>
                                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2"><span className="material-symbols-outlined text-sm">call</span>{booking.customerInfo.phone}</p>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-2"><span className="material-symbols-outlined text-sm">mail</span>{booking.customerInfo.email}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Lịch lưu trú</p>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[9px] font-bold text-gray-400 block mb-0.5">NGÀY NHẬN</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                                            value={editForm.checkInDate}
                                            onChange={(e) => setEditForm({ ...editForm, checkInDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-gray-400 block mb-0.5">NGÀY TRẢ</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                                            value={editForm.checkOutDate}
                                            onChange={(e) => setEditForm({ ...editForm, checkOutDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-gray-400 block mb-0.5">GIỜ NHẬN DỰ KIẾN</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm font-bold text-amber-700 bg-amber-50"
                                            value={editForm.checkInTime}
                                            onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                                        >
                                            <option value="Tôi chưa biết">Tôi chưa biết</option>
                                            <option value="00:00 - 02:00">00:00 - 02:00</option>
                                            <option value="02:00 - 04:00">02:00 - 04:00</option>
                                            <option value="04:00 - 06:00">04:00 - 06:00</option>
                                            <option value="06:00 - 08:00">06:00 - 08:00</option>
                                            <option value="08:00 - 10:00">08:00 - 10:00</option>
                                            <option value="10:00 - 12:00">10:00 - 12:00</option>
                                            <option value="12:00 - 14:00">12:00 - 14:00</option>
                                            <option value="14:00 - 16:00">14:00 - 16:00 (Tiêu chuẩn)</option>
                                            <option value="16:00 - 18:00">16:00 - 18:00</option>
                                            <option value="18:00 - 20:00">18:00 - 20:00</option>
                                            <option value="20:00 - 22:00">20:00 - 22:00</option>
                                            <option value="22:00 - 24:00">22:00 - 24:00</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Check-in</p>
                                        <p className="text-sm font-medium">{new Date(booking.checkInDate).toLocaleDateString('vi-VN')} ({formatCheckInTime(booking)})</p>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Check-out</p>
                                        <p className="text-sm font-medium">{new Date(booking.checkOutDate).toLocaleDateString('vi-VN')} (12:00)</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-right">{nights} ngày lưu trú</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Room & Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phân bổ phòng</p>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[9px] font-bold text-gray-400 block mb-0.5">LOẠI PHÒNG</label>
                                        <select
                                            className={`w-full px-3 py-2 border rounded text-sm ${
                                                roomTypeChanged ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-gray-200'
                                            }`}
                                            value={editForm.roomTypeId}
                                            onChange={(e) => setEditForm({ ...editForm, roomTypeId: e.target.value })}
                                        >
                                            {roomTypes.map((rt: any) => (
                                                <option key={rt._id} value={rt._id}>{rt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {needsReassign && (
                                        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-300 rounded-lg">
                                            <span className="material-symbols-outlined text-amber-500 text-base mt-0.5">warning</span>
                                            <p className="text-[10px] text-amber-700 font-semibold leading-relaxed">
                                                {roomTypeChanged
                                                    ? 'Đổi loại phòng sẽ xóa phòng đã gán. Đơn sẽ về "Chờ duyệt" — cần gán phòng mới sau khi lưu.'
                                                    : 'Đổi ngày lưu trú sẽ xóa phòng đã gán. Cần gán phòng lại sau khi lưu.'}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-[9px] font-bold text-gray-400 block mb-0.5">SỐ LƯỢNG</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                                            value={editForm.roomQuantity}
                                            onChange={(e) => setEditForm({ ...editForm, roomQuantity: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 italic">
                                    <p className="text-sm font-bold text-blue-900">{booking.roomTypeId?.name || booking.roomTypeInfo?.name || 'N/A'}</p>
                                    <p className="text-xs text-blue-700 mt-1">Số lượng: {booking.roomQuantity} phòng</p>
                                    {booking.details?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {booking.details.map((d: any) => (
                                                <span key={d._id} className="px-2 py-0.5 bg-white border border-blue-200 rounded text-[10px] font-bold text-blue-600">
                                                    Phòng {d.roomId?.roomNumber || 'N/A'}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Chi phí & Thanh toán</p>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Giá niêm yết:</span>
                                    <span className="font-medium text-gray-700">{new Intl.NumberFormat('vi-VN').format(booking.totalAmount)}₫</span>
                                </div>
                                {booking.discountAmount > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Giảm giá ({booking.promotionCode}):</span>
                                        <span className="text-rose-500">-{new Intl.NumberFormat('vi-VN').format(booking.discountAmount)}₫</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-2 border-y border-gray-200">
                                    <span className="font-bold text-gray-900 uppercase text-[11px]">Tổng cộng:</span>
                                    <span className="font-black text-base text-gray-900">{new Intl.NumberFormat('vi-VN').format(booking.finalAmount)}₫</span>
                                </div>

                                <div className="pt-1">
                                    {isEditing ? (
                                        <div className="space-y-3 mt-4 bg-white p-3 border border-amber-200 rounded-lg">
                                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Tài chính đơn hàng</p>
                                            <div>
                                                <label className="text-[8px] font-bold text-gray-400 block mb-0.5 tracking-tighter">SỐ TIỀN KHÁCH ĐÃ NỘP (CỐ ĐỊNH)</label>
                                                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm font-bold text-emerald-700">
                                                    {new Intl.NumberFormat('vi-VN').format(editForm.paidAmount)}₫
                                                    <span className="text-[9px] ml-1 font-normal text-gray-500 italic">(Không được phép sửa)</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-bold text-gray-400 block mb-0.5 tracking-tighter">TRẠNG THÁI THANH TOÁN</label>
                                                <select
                                                    className="w-full px-3 py-2 border border-gray-200 rounded text-xs"
                                                    value={editForm.paymentStatus}
                                                    onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                                                >
                                                    <option value="unpaid">Chưa thanh toán</option>
                                                    <option value="deposited">Đã cọc</option>
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {(() => {
                                                const breakdown = booking.paymentHistory?.length > 0
                                                    ? booking.paymentHistory.reduce((acc: any, h: any) => {
                                                        acc[h.paymentMethod] = (acc[h.paymentMethod] || 0) + h.amount;
                                                        return acc;
                                                    }, { vnpay: 0, cash: 0 })
                                                    : {
                                                        vnpay: booking.paymentMethod === 'vnpay' ? (booking.paidAmount || 0) : 0,
                                                        cash: booking.paymentMethod === 'cash' ? (booking.paidAmount || 0) : 0
                                                    };

                                                return (
                                                    <div className="flex flex-col gap-1 py-1 border-b border-gray-100 mb-1 pb-2">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-500 font-bold uppercase text-[9px]">Tổng đã nộp:</span>
                                                            <span className="font-extrabold text-emerald-600">
                                                                {new Intl.NumberFormat('vi-VN').format(booking.paidAmount || 0)}₫
                                                            </span>
                                                        </div>

                                                        {/* Chi tiết từng nguồn tiền */}
                                                        <div className="flex flex-col gap-0.5 mt-1 border-t border-dashed border-gray-200 pt-1">
                                                            {breakdown.vnpay > 0 && (
                                                                <div className="flex justify-between text-[10px]">
                                                                    <span className="text-gray-400 italic">Đã cọc (VNPay):</span>
                                                                    <span className="font-medium text-blue-600">
                                                                        {new Intl.NumberFormat('vi-VN').format(breakdown.vnpay)}₫
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {breakdown.cash > 0 && (
                                                                <div className="flex justify-between text-[10px]">
                                                                    <span className="text-gray-400 italic">Tiền mặt tại quầy:</span>
                                                                    <span className="font-medium text-emerald-600">
                                                                        {new Intl.NumberFormat('vi-VN').format(breakdown.cash)}₫
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {breakdown.vnpay === 0 && breakdown.cash === 0 && (
                                                                <div className="text-center py-1">
                                                                    <span className="text-[9px] text-gray-400 italic">Chưa ghi nhận thanh toán</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Số tiền cần thanh toán:</span>
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-sm font-black ${booking.finalAmount <= (booking.paidAmount || 0) ? 'text-emerald-500' : 'text-rose-600'}`}>
                                                        {booking.finalAmount <= (booking.paidAmount || 0) ? 'HOÀN TẤT' : `${new Intl.NumberFormat('vi-VN').format(booking.finalAmount - (booking.paidAmount || 0))}₫`}
                                                    </span>
                                                    {booking.status === 'checked_in' && booking.finalAmount > (booking.paidAmount || 0) && !isEditing && (
                                                        <button
                                                            onClick={() => { setIsAddingPayment(!isAddingPayment); setExtraAmount(booking.finalAmount - (booking.paidAmount || 0)); }}
                                                            className="text-[10px] text-blue-600 font-bold hover:underline mt-1"
                                                        >
                                                            {isAddingPayment ? "Đóng" : "Thu thêm tại quầy →"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Thu thêm UI */}
                                            {isAddingPayment && booking.status === 'checked_in' && !isEditing && (
                                                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Ghi nhận thu tiền mặt</p>
                                                    <input
                                                        type="number"
                                                        className="w-full px-3 py-1.5 border border-blue-200 rounded text-xs font-bold text-emerald-700"
                                                        placeholder="Số tiền thu..."
                                                        value={extraAmount}
                                                        onChange={(e) => setExtraAmount(parseInt(e.target.value))}
                                                    />
                                                    <input
                                                        className="w-full px-3 py-1.5 border border-blue-200 rounded text-[10px]"
                                                        placeholder="Lý do thu (vd: phụ phí nâng cấp)..."
                                                        value={extraNote}
                                                        onChange={(e) => setExtraNote(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={handleAddExtraPayment}
                                                        disabled={isUpdating || extraAmount <= 0}
                                                        className="w-full py-1.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase hover:bg-blue-700 transition"
                                                    >
                                                        {isUpdating ? "Đang xử lý..." : "Xác nhận thu tiền"}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Notes & Special Requests */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Yêu cầu từ khách</p>
                            {isEditing ? (
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm italic bg-gray-50"
                                    value={editForm.specialRequests}
                                    onChange={(e) => setEditForm({ ...editForm, specialRequests: e.target.value })}
                                />
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-lg min-h-[80px]">
                                    <p className="text-sm text-gray-600 italic">{booking.specialRequests ? `"${booking.specialRequests}"` : "Không có yêu cầu đặc biệt."}</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-1">Ghi chú của Admin</p>
                            {isEditing ? (
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 border border-rose-100 rounded text-sm bg-rose-50 placeholder:text-rose-300"
                                    placeholder="Lưu lại lý do sửa đổi hoặc ghi chú nội bộ..."
                                    value={editForm.adminNote}
                                    onChange={(e) => setEditForm({ ...editForm, adminNote: e.target.value })}
                                />
                            ) : (
                                <div className="bg-rose-50 p-4 rounded-lg min-h-[80px] border border-rose-100">
                                    <p className="text-sm text-rose-700 font-medium">{booking.adminNote || "Giao dịch an toàn, chưa có ghi chú thêm."}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t pt-6 pb-2">
                        {isEditing ? (
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-2 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-100 transition shadow-sm"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleAdminUpdate}
                                    disabled={isUpdating}
                                    className="px-8 py-2 bg-gray-900 text-white font-black rounded-lg hover:bg-black transition shadow-lg flex items-center gap-2"
                                >
                                    {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                                    {!isUpdating && <span className="material-symbols-outlined text-sm">save</span>}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {booking.status === 'pending' && (
                                    <>
                                        <button onClick={() => { setSelectedRoomIds([]); setIsAssignModalOpen(true); }} disabled={isUpdating} className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-200">
                                            Gán phòng & Xác nhận
                                        </button>
                                        <button onClick={() => handleUpdateStatus(booking._id, 'cancelled')} disabled={isUpdating} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                                            Từ chối
                                        </button>
                                    </>
                                )}

                                {booking.status === 'confirmed' && (
                                    <>
                                        {isBeforeCheckIn(booking) && (
                                            <button onClick={() => { const currentAssignedIds = booking.details?.map((d: any) => d.roomId?._id || d.roomId) || []; setSelectedRoomIds(currentAssignedIds); setIsAssignModalOpen(true); }} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                                                Đổi số phòng
                                            </button>
                                        )}
                                        <button onClick={() => handleUpdateStatus(booking._id, 'checked_in')} disabled={isUpdating} className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-200">
                                            Thực hiện Check-in
                                        </button>
                                        <button onClick={() => handleUpdateStatus(booking._id, 'cancelled')} disabled={isUpdating} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                                            Hủy đặt phòng
                                        </button>
                                    </>
                                )}

                                {booking.status === 'checked_in' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(booking._id, 'completed', 'paid')}
                                            disabled={isUpdating || booking.finalAmount > (booking.paidAmount || 0)}
                                            className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition shadow-md shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Check-out & Hoàn tất
                                        </button>
                                    </>
                                )}

                                {['checked_out', 'completed'].includes(booking.status) && (
                                    <button onClick={() => handleExportInvoice(booking)} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">receipt_long</span>
                                        Xuất hóa đơn
                                    </button>
                                )}

                                {isAdmin && (
                                    <button onClick={() => handleDeleteBooking(booking._id)} className="px-5 py-2 border border-rose-200 text-rose-600 text-sm font-bold rounded-lg hover:bg-rose-50 transition ml-auto">
                                        Xóa vĩnh viễn
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetails;
