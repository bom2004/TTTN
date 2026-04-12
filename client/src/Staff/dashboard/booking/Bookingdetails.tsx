import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../../lib/redux/store';
import { adminUpdateBookingThunk, addExtraPaymentThunk } from '../../../lib/redux/reducers/booking';
import { selectAuthUser } from '../../../lib/redux/reducers/auth/selectors';

interface BookingDetailsProps {
    booking: any;
    onClose: () => void;
    isAdmin: boolean;
    roomTypes: any[];
    isUpdating: boolean;
    handleUpdateStatus: (id: string, status: string, paymentStatus?: string) => void;
    handleDeleteBooking: (id: string) => void;
    handleExportInvoice: (booking: any, staffName?: string) => void;
    setSelectedRoomIds: (ids: string[]) => void;
    setIsAssignModalOpen: (val: boolean) => void;
    fetchBookings: () => void;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({
    booking,
    onClose,
    isAdmin,
    roomTypes,
    isUpdating,
    handleUpdateStatus,
    handleDeleteBooking,
    handleExportInvoice,
    setSelectedRoomIds,
    setIsAssignModalOpen,
    fetchBookings
}) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectAuthUser);

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
                toast.success("Cập nhật thành công! Vui lòng gán phòng lại.");
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

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'pending': return { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' };
            case 'confirmed': return { label: 'Xác nhận', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' };
            case 'checked_in': return { label: 'Đã nhận phòng', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', dot: 'bg-indigo-500' };
            case 'completed': return { label: 'Đã trả phòng (Hoàn thành)', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' };
            case 'cancelled': return { label: 'Đã hủy', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', dot: 'bg-rose-500' };
            default: return { label: status, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' };
        }
    };

    const statusTheme = getStatusTheme(booking.status);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#f8fafc] dark:bg-slate-800 w-full max-w-4xl my-auto rounded-[32px] shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <span className="material-symbols-outlined text-2xl">receipt_long</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">
                                {isEditing ? "Chỉnh sửa đơn hàng" : `Đơn đặt #${booking._id.slice(-8).toUpperCase()}`}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${statusTheme.color}`}>
                                    <span className={`w-1 h-1 rounded-full ${statusTheme.dot}`}></span>
                                    {statusTheme.label}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• {new Date(booking.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && !isEditing && !['checked_in', 'checked_out', 'completed'].includes(booking.status) && (
                            <button
                                onClick={startEditing}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-xl border border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 transition-all"
                            >
                                <span className="material-symbols-outlined text-base">edit</span>
                                Chỉnh sửa
                            </button>
                        )}
                        <button
                            onClick={() => { setIsEditing(false); onClose(); }}
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-all"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Information Grid */}
                        <div className="space-y-6">
                            {/* Customer Card */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl">person</span>
                                </div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Thông tin khách hàng</h3>
                                {isEditing ? (
                                    <div className="space-y-3 relative z-10">
                                        <input
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-blue-500 outline-none transition-all"
                                            value={editForm.customerInfo.name}
                                            onChange={(e) => setEditForm({ ...editForm, customerInfo: { ...editForm.customerInfo, name: e.target.value } })}
                                            placeholder="Tên khách hàng"
                                        />
                                        <input
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-blue-500 outline-none transition-all"
                                            value={editForm.customerInfo.phone}
                                            onChange={(e) => setEditForm({ ...editForm, customerInfo: { ...editForm.customerInfo, phone: e.target.value } })}
                                            placeholder="Số điện thoại"
                                        />
                                        <input
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-blue-500 outline-none transition-all"
                                            value={editForm.customerInfo.email}
                                            onChange={(e) => setEditForm({ ...editForm, customerInfo: { ...editForm.customerInfo, email: e.target.value } })}
                                            placeholder="Email"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-3 relative z-10">
                                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{booking.customerInfo.name}</p>
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <span className="material-symbols-outlined text-lg">call</span>
                                                <span className="text-sm font-bold tracking-tight">{booking.customerInfo.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <span className="material-symbols-outlined text-lg">mail</span>
                                                <span className="text-sm font-medium">{booking.customerInfo.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Stay Details */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-700 shadow-sm">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Lịch trình lưu trú</h3>
                                {isEditing ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-1">
                                            <label className="text-[9px] font-black text-slate-400 block mb-1.5 ml-1">NGÀY NHẬN</label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                                value={editForm.checkInDate}
                                                onChange={(e) => setEditForm({ ...editForm, checkInDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[9px] font-black text-slate-400 block mb-1.5 ml-1">NGÀY TRẢ</label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                                value={editForm.checkOutDate}
                                                onChange={(e) => setEditForm({ ...editForm, checkOutDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2 mt-2">
                                            <label className="text-[9px] font-black text-slate-400 block mb-1.5 ml-1 uppercase">Giờ nhận dự kiến</label>
                                            <select
                                                className="w-full px-4 py-2.5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-sm font-bold text-blue-700 dark:text-blue-400"
                                                value={editForm.checkInTime}
                                                onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                                            >
                                                {["Tôi chưa biết", "00:00 - 02:00", "02:00 - 04:00", "04:00 - 06:00", "06:00 - 08:00", "08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00", "22:00 - 24:00"].map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">Ngày nhận phòng</span>
                                                <span className="text-base font-black text-slate-700 dark:text-slate-200">{new Date(booking.checkInDate).toLocaleDateString('vi-VN')}</span>
                                                <span className="text-xs font-bold text-blue-500 mt-0.5">{booking.checkInTime || '14:00'}</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-300">double_arrow</span>
                                            </div>
                                            <div className="flex flex-col items-end text-right">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">Ngày trả phòng</span>
                                                <span className="text-base font-black text-slate-700 dark:text-slate-200">{new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}</span>
                                                <span className="text-xs font-bold text-slate-400 mt-0.5">12:00</span>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-slate-50 dark:border-slate-800 text-center">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-[10px] font-black text-slate-500 dark:text-slate-300 tracking-widest uppercase">
                                                {nights} Ngày lưu trú
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Service Orders Section */}
                            {booking.serviceOrders?.length > 0 && (
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dịch vụ đã sử dụng</h3>
                                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 rounded-md">
                                            {booking.serviceOrders.length} đơn dịch vụ
                                        </span>
                                    </div>
                                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        {booking.serviceOrders.map((order: any) => (
                                            <div key={order._id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-black text-slate-400">#{order._id.slice(-6).toUpperCase()}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                                    }`}>
                                                        {order.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    {order.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between text-xs font-medium">
                                                            <span className="text-slate-600 dark:text-slate-300">{item.serviceId?.name} <span className="text-slate-400 text-[10px]">x{item.quantity}</span></span>
                                                            <span className="text-slate-700 dark:text-slate-200">{new Intl.NumberFormat('vi-VN').format(item.priceAtOrder * item.quantity)}₫</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center font-bold">
                                                    <span className="text-[10px] text-slate-400 uppercase">Tổng đơn</span>
                                                    <span className="text-xs text-indigo-600 dark:text-indigo-400">{new Intl.NumberFormat('vi-VN').format(order.totalAmount)}₫</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Financial Information */}
                        <div className="space-y-6">
                            {/* Room Allocation */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-700 shadow-sm min-h-[160px]">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Sản phẩm & Dịch vụ</h3>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 block mb-1.5 ml-1">LOẠI PHÒNG THUÊ</label>
                                            <select
                                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-bold ${roomTypeChanged ? 'border-amber-400 text-amber-600' : 'border-slate-200 dark:border-slate-700'}`}
                                                value={editForm.roomTypeId}
                                                onChange={(e) => setEditForm({ ...editForm, roomTypeId: e.target.value })}
                                            >
                                                {roomTypes.map((rt: any) => (
                                                    <option key={rt._id} value={rt._id}>{rt.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 block mb-1.5 ml-1 uppercase">Số lượng phòng</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                                value={editForm.roomQuantity}
                                                onChange={(e) => setEditForm({ ...editForm, roomQuantity: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                                                <span className="material-symbols-outlined text-2xl">bed</span>
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-700 dark:text-slate-100">{booking.roomTypeId?.name || booking.roomTypeInfo?.name || 'N/A'}</p>
                                                <p className="text-xs font-bold text-slate-400 mt-0.5">Quy mô: {booking.roomQuantity} phòng</p>
                                            </div>
                                        </div>
                                        {booking.details?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {booking.details.map((d: any) => (
                                                    <div key={d._id} className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 rounded-xl">
                                                        <span className="material-symbols-outlined text-xs text-blue-500">meeting_room</span>
                                                        <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">P.{d.roomId?.roomNumber}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Billing details */}
                            <div className="bg-slate-900 dark:bg-slate-900/50 p-7 rounded-[28px] text-white shadow-xl relative overflow-hidden">
                                <div className="absolute -right-8 -bottom-8 opacity-10">
                                    <span className="material-symbols-outlined text-[120px]">payments</span>
                                </div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Thanh toán</h3>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
                                        <span>Tiền phòng ({booking.roomQuantity} phòng x {nights} đêm)</span>
                                        <span>{new Intl.NumberFormat('vi-VN').format(booking.totalAmount)}₫</span>
                                    </div>
                                    {booking.totalServiceAmount > 0 && (
                                        <div className="flex justify-between items-center text-indigo-300 text-xs font-medium">
                                            <span>Tiền dịch vụ (Ăn uống/Giao phòng)</span>
                                            <span>+{new Intl.NumberFormat('vi-VN').format(booking.totalServiceAmount)}₫</span>
                                        </div>
                                    )}
                                    {booking.discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-rose-400 text-xs font-bold">
                                            <span>Giảm giá ({booking.promotionCode})</span>
                                            <span>-{new Intl.NumberFormat('vi-VN').format(booking.discountAmount)}₫</span>
                                        </div>
                                    )}
                                    <div className="pt-4 mt-4 border-t border-white/10 grid grid-cols-2 gap-4 items-end">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tổng phí lưu trú & DV</p>
                                            <p className="text-2xl font-black text-white tracking-tight">
                                                {new Intl.NumberFormat('vi-VN').format(booking.finalAmount + (booking.totalServiceAmount || 0))}
                                                <span className="text-base ml-0.5">₫</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest mb-1">Đã cọc / Đã thanh toán</p>
                                            <p className="text-lg font-black text-emerald-400">{new Intl.NumberFormat('vi-VN').format(booking.paidAmount || 0)}₫</p>
                                        </div>
                                        <div className="col-span-2 mt-2 pt-4 border-t border-white/5 flex justify-between items-center bg-white/5 -mx-4 px-4 py-3 rounded-2xl">
                                            <div className="flex flex-col">
                                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Cần thanh toán thêm</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">(Bao gồm phí phát sinh nếu có)</p>
                                            </div>
                                            <p className="text-2xl font-black text-rose-500">
                                                {new Intl.NumberFormat('vi-VN').format(Math.max(0, (booking.finalAmount + (booking.totalServiceAmount || 0)) - (booking.paidAmount || 0)))}₫
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action inside Payment Card */}
                                    {booking.finalAmount > (booking.paidAmount || 0) && booking.status === 'checked_in' && !isEditing && (
                                        <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                                            <button
                                                onClick={() => { 
                                                    setIsAddingPayment(!isAddingPayment); 
                                                    const remaining = (booking.finalAmount + (booking.totalServiceAmount || 0)) - (booking.paidAmount || 0);
                                                    setExtraAmount(Math.max(0, remaining)); 
                                                }}
                                                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-white/10"
                                            >
                                                {isAddingPayment ? "Đóng trình thu phí" : "Thu thêm tại quầy →"}
                                            </button>

                                            {isAddingPayment && (
                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3 animate-in slide-in-from-top-4 duration-300">
                                                    <input
                                                        type="number"
                                                        className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm font-bold text-white outline-none"
                                                        placeholder="Số tiền..."
                                                        value={extraAmount}
                                                        onChange={(e) => setExtraAmount(parseInt(e.target.value))}
                                                    />
                                                    <input
                                                        className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-xs text-slate-300 outline-none"
                                                        placeholder="Lý do thu bổ sung..."
                                                        value={extraNote}
                                                        onChange={(e) => setExtraNote(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={handleAddExtraPayment}
                                                        disabled={isUpdating || extraAmount <= 0}
                                                        className="w-full py-2.5 bg-[#0050d4] hover:bg-[#0046bb] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#0050d4]/20"
                                                    >
                                                        {isUpdating ? "Đang xử lý..." : "Xác nhận thu phí"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom notes section */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Yêu cầu đặc biệt</h3>
                            {isEditing ? (
                                <textarea
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none h-[100px]"
                                    value={editForm.specialRequests}
                                    onChange={(e) => setEditForm({ ...editForm, specialRequests: e.target.value })}
                                />
                            ) : (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-50 dark:border-slate-800">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed">
                                        {booking.specialRequests ? `"${booking.specialRequests}"` : "Khách hàng không có yêu cầu đặc biệt nào đi kèm."}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="bg-rose-50/30 dark:bg-rose-900/10 p-6 rounded-[24px] border border-rose-100 dark:border-rose-900/30 shadow-sm">
                            <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-3">Ghi chú quản trị</h3>
                            {isEditing ? (
                                <textarea
                                    className="w-full p-4 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-sm font-bold text-rose-700 dark:text-rose-400 outline-none h-[100px]"
                                    placeholder="Ghi chú quan trọng về đơn hàng này..."
                                    value={editForm.adminNote}
                                    onChange={(e) => setEditForm({ ...editForm, adminNote: e.target.value })}
                                />
                            ) : (
                                <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-white dark:border-slate-700">
                                    <p className="text-sm text-rose-600 dark:text-rose-400 font-bold leading-relaxed">{booking.adminNote || "Chưa có ghi chú quản trị nội bộ nào được ghi nhận."}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-8 py-6">
                    {isEditing ? (
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition-all"
                            >
                                Hủy thay đổi
                            </button>
                            <button
                                onClick={handleAdminUpdate}
                                disabled={isUpdating}
                                className="px-10 py-2.5 bg-[#2c2f31] dark:bg-white text-white dark:text-slate-900 font-black rounded-xl shadow-lg hover:scale-[1.02] transition-all"
                            >
                                {isUpdating ? "Đang xử lý..." : "Lưu dữ liệu"}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-3">
                            {booking.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => { setSelectedRoomIds([]); setIsAssignModalOpen(true); }}
                                        className="px-6 py-2.5 bg-[#0050d4] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#0050d4]/20 hover:bg-[#0046bb] transition-all"
                                    >
                                        Gán phòng & Xác nhận ngay
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                                        className="px-6 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-all"
                                    >
                                        Hủy trình duyệt
                                    </button>
                                </>
                            )}

                            {booking.status === 'confirmed' && (
                                <>
                                    <button
                                        onClick={() => { const currentAssignedIds = booking.details?.map((d: any) => d.roomId?._id || d.roomId) || []; setSelectedRoomIds(currentAssignedIds); setIsAssignModalOpen(true); }}
                                        className="px-6 py-2.5 bg-slate-50 dark:bg-slate-700 text-[#2c2f31] dark:text-slate-100 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-all border border-slate-100 dark:border-slate-600"
                                    >
                                        Cấu hình lại phòng
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(booking._id, 'checked_in')}
                                        className="px-8 py-2.5 bg-[#0050d4] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-[#0046bb] transition-all"
                                    >
                                        Xác nhận Nhận phòng
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                                        className="px-6 py-2.5 text-rose-500 font-bold text-xs uppercase tracking-wide hover:underline"
                                    >
                                        Hủy bỏ đơn này
                                    </button>
                                </>
                            )}

                            {booking.status === 'checked_in' && (
                                <button
                                    onClick={() => handleUpdateStatus(booking._id, 'completed', 'paid')}
                                    disabled={isUpdating || (booking.finalAmount + (booking.totalServiceAmount || 0)) > (booking.paidAmount || 0)}
                                    className="px-10 py-3 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    {(booking.finalAmount + (booking.totalServiceAmount || 0)) > (booking.paidAmount || 0) ? "Vui lòng thu đủ tiền để Trả phòng" : "Hoàn tất Trả phòng đơn hàng"}
                                </button>
                            )}

                            {['completed'].includes(booking.status) && (
                                <button
                                    onClick={() => handleExportInvoice(booking, user?.full_name)}
                                    className="px-8 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-xl">receipt_long</span>
                                    Xuất hóa đơn VAT
                                </button>
                            )}

                            {isAdmin && (
                                <button
                                    onClick={() => handleDeleteBooking(booking._id)}
                                    className="px-4 py-2 text-slate-300 hover:text-rose-500 font-bold text-[10px] uppercase tracking-widest ml-auto transition-colors"
                                >
                                    Khôi phục/Xóa vĩnh viễn
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingDetails;
