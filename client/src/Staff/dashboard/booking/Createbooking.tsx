import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../../lib/redux/store';
import { createBookingThunk } from '../../../lib/redux/reducers/booking';
import { fetchAllUsersThunk } from '../../../lib/redux/reducers/user/thunks';
import { selectCustomers } from '../../../lib/redux/reducers/user/selectors';

interface CreateBookingProps {
    isOpen: boolean;
    onClose: () => void;
    roomTypes: any[];
    onSuccess: () => void;
}

const CreateBooking: React.FC<CreateBookingProps> = ({ isOpen, onClose, roomTypes, onSuccess }) => {
    const dispatch = useAppDispatch();
    const customers = useAppSelector(selectCustomers);
    const [showCustomerList, setShowCustomerList] = useState(false);
    const [bookingForm, setBookingForm] = useState({
        customerId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        roomTypeId: '',
        roomQuantity: 1,
        checkInDate: '',
        checkOutDate: '',
        paymentMethod: 'cash' as 'vnpay' | 'cash',
        paymentStatus: 'unpaid' as 'unpaid' | 'paid' | 'deposited',
        specialRequests: '',
        checkInTime: '14:00'
    });

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchAllUsersThunk());
        }
    }, [isOpen, dispatch]);

    const filteredCustomers = (customers || []).filter(c => {
        const searchName = (bookingForm.customerName || '').toLowerCase();
        const userName = (c.full_name || '').toLowerCase();
        const userPhone = (c.phone || '');
        return userName.includes(searchName) || userPhone.includes(searchName);
    });

    const handleSelectCustomer = (customer: any) => {
        setBookingForm({
            ...bookingForm,
            customerId: customer._id || customer.id,
            customerName: customer.full_name,
            customerEmail: customer.email || '',
            customerPhone: customer.phone || ''
        });
        setShowCustomerList(false);
    };

    if (!isOpen) return null;

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            userId: bookingForm.customerId || undefined,
            customerInfo: {
                name: bookingForm.customerName,
                email: bookingForm.customerEmail,
                phone: bookingForm.customerPhone
            },
            roomTypeId: bookingForm.roomTypeId,
            roomQuantity: bookingForm.roomQuantity,
            checkInDate: new Date(bookingForm.checkInDate),
            checkOutDate: new Date(bookingForm.checkOutDate),
            paymentMethod: bookingForm.paymentMethod,
            paymentStatus: bookingForm.paymentStatus,
            paidAmount: 0,
            specialRequests: bookingForm.specialRequests,
            checkInTime: bookingForm.checkInTime,
            status: 'confirmed'
        };

        try {
            await dispatch(createBookingThunk(data)).unwrap();
            toast.success("Tạo đặt phòng thành công");
            onClose();
            setBookingForm({
                customerId: '',
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                roomTypeId: '',
                roomQuantity: 1,
                checkInDate: '',
                checkOutDate: '',
                paymentMethod: 'cash',
                paymentStatus: 'unpaid',
                specialRequests: '',
                checkInTime: '14:00'
            });
            onSuccess();
        } catch (error: any) {
            toast.error(error || "Tạo đặt phòng thất bại");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl my-auto animate-in fade-in zoom-in duration-300">
                <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <div className="text-left">
                        <h2 className="text-lg font-semibold text-gray-900">Tạo đơn đặt phòng mới</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Đặt phòng thủ công cho khách hàng</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                </div>

                <form onSubmit={handleCreateBooking} className="p-6 space-y-5 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1 relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên khách hàng</label>
                            <div className="relative">
                                <input
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    placeholder="Vd: Nguyễn Văn A"
                                    value={bookingForm.customerName}
                                    onFocus={() => setShowCustomerList(true)}
                                    onBlur={() => setTimeout(() => setShowCustomerList(false), 200)}
                                    onChange={(e) => {
                                        setBookingForm({ ...bookingForm, customerName: e.target.value });
                                        setShowCustomerList(true);
                                    }}
                                />
                                {showCustomerList && filteredCustomers.length > 0 && (
                                    <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {filteredCustomers.map((c: any) => (
                                            <div
                                                key={c._id || c.id}
                                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                                onClick={() => handleSelectCustomer(c)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-gray-900 text-sm">{c.full_name}</span>
                                                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                                        Khách cũ
                                                    </span>
                                                </div>
                                                <div className="flex gap-4 mt-1 text-[11px] text-gray-500 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">phone</span>
                                                        {c.phone}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">mail</span>
                                                        {c.email}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                            <input
                                required
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="Vd: 0987654321"
                                value={bookingForm.customerPhone}
                                onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                            <input
                                required
                                type="email"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="Vd: khach@gmail.com"
                                value={bookingForm.customerEmail}
                                onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Loại phòng</label>
                            <select
                                required
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                value={bookingForm.roomTypeId}
                                onChange={(e) => setBookingForm({ ...bookingForm, roomTypeId: e.target.value })}
                            >
                                <option value="">-- Chọn loại phòng --</option>
                                {roomTypes.map((rt: any) => (
                                    <option key={rt._id || rt.id} value={rt._id || rt.id}>
                                        {rt.name} - {new Intl.NumberFormat('vi-VN').format(rt.basePrice)}₫/ngày
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày nhận phòng</label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                value={bookingForm.checkInDate}
                                onChange={(e) => setBookingForm({ ...bookingForm, checkInDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày trả phòng</label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                value={bookingForm.checkOutDate}
                                onChange={(e) => setBookingForm({ ...bookingForm, checkOutDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số lượng phòng</label>
                            <input
                                type="number"
                                min="1"
                                required
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                value={bookingForm.roomQuantity}
                                onChange={(e) => setBookingForm({ ...bookingForm, roomQuantity: parseInt(e.target.value) })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hình thức thanh toán</label>
                            <select
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                value={bookingForm.paymentMethod}
                                onChange={(e: any) => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}
                            >
                                <option value="cash">💵 Tiền mặt</option>
                                <option value="vnpay">💳 Chuyển khoản (VNPay)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Trạng thái thanh toán</label>
                            <select
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                value={bookingForm.paymentStatus}
                                onChange={(e: any) => setBookingForm({ ...bookingForm, paymentStatus: e.target.value })}
                            >
                                <option value="unpaid">Chưa thanh toán</option>
                                <option value="deposited">Đã đặt cọc</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giờ nhận phòng dự kiến</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="Vd: 14:00"
                                value={bookingForm.checkInTime}
                                onChange={(e) => setBookingForm({ ...bookingForm, checkInTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Yêu cầu đặc biệt</label>
                        <textarea
                            rows={2}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                            placeholder="Ghi chú thêm từ khách hàng..."
                            value={bookingForm.specialRequests}
                            onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 border-t flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            Xác nhận tạo đơn
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBooking;
