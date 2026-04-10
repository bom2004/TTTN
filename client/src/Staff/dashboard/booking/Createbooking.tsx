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


    const handleSelectCustomer = (customer: any) => {
        setBookingForm({
            ...bookingForm,
            customerId: customer._id || customer.id,
            customerName: customer.full_name,
            customerEmail: customer.email || '',
            customerPhone: customer.phone || ''
        });
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
            toast.success("Tạo đặt phòng trực tiếp thành công");
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
            toast.error(error || "Không thể tạo đơn đặt phòng");
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#f8fafc] dark:bg-slate-800 w-full max-w-2xl rounded-[32px] shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300 my-auto">
                <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-8 py-6 flex justify-between items-center text-left">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <span className="material-symbols-outlined text-2xl">add_shopping_cart</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">Tạo đơn mới tại quầy</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Tiếp nhận yêu cầu trực tiếp từ khách hàng</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-slate-600 rounded-full transition-all"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleCreateBooking} className="p-8 space-y-6 text-left">
                    {/* Section 1: Customer */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                             <span className="w-4 h-[2px] bg-blue-500 rounded-full"></span>
                             Thông tin khách hàng
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="md:col-span-2 relative">
                                <label className="text-[10px] font-black text-blue-500 block mb-1.5 ml-1 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">account_circle</span>
                                    CHỌN KHÁCH HÀNG CÓ SẴN (NẾU CÓ)
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none px-4 py-2.5 pl-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            if (selectedId === "") return;
                                            const customer = customers.find(c => (c._id || c.id) === selectedId);
                                            if (customer) handleSelectCustomer(customer);
                                        }}
                                        value={bookingForm.customerId}
                                    >
                                        <option value="">-- Chọn khách hàng từ danh sách --</option>
                                        {(customers || []).map((c: any) => (
                                            <option key={c._id || c.id} value={c._id || c.id}>
                                                {c.full_name} ({c.phone || 'N/A'})
                                            </option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
                                </div>
                            </div>
                            
                            <div className="md:col-span-2 flex items-center gap-4 my-2">
                                <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700"></div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">HOẶC NHẬP THÔNG TIN MỚI</span>
                                <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700"></div>
                            </div>

                            <div className="relative">
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 ml-1">TÊN KHÁCH HÀNG *</label>
                                <div className="relative">
                                    <input
                                        required
                                        className="w-full px-4 py-2.5 pl-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-blue-500 outline-none transition-all dark:text-slate-100"
                                        placeholder="Nguyễn Văn A..."
                                        value={bookingForm.customerName}
                                        onChange={(e) => {
                                            setBookingForm({ ...bookingForm, customerName: e.target.value, customerId: '' });
                                        }}
                                    />
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
                                </div>
                                {(() => {
                                    if (!bookingForm.customerName || bookingForm.customerName.length < 1) return null;
                                    const nameMatches = (customers || []).filter(c => 
                                        c.full_name?.toLowerCase().includes(bookingForm.customerName.toLowerCase())
                                    ).slice(0, 3);
                                    
                                    if (nameMatches.length > 0 && !nameMatches.some(m => (m._id || m.id) === bookingForm.customerId)) {
                                        return (
                                            <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1">Gợi ý từ tên ({nameMatches.length})</p>
                                                {nameMatches.map(matched => (
                                                    <div key={matched._id || matched.id} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex items-center justify-between group hover:bg-indigo-100 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 shadow-sm">
                                                                <span className="material-symbols-outlined text-sm">person</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-700 dark:text-slate-200">{matched.full_name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">{matched.phone}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectCustomer(matched)}
                                                            className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-lg uppercase tracking-wider hover:scale-105 transition-all"
                                                        >
                                                            Chọn
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 ml-1 uppercase">Số điện thoại liên hệ *</label>
                                <div className="relative">
                                    <input
                                        required
                                        className="w-full px-4 py-2.5 pl-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-blue-500 outline-none transition-all dark:text-slate-100"
                                        placeholder="09xx xxx xxx"
                                        value={bookingForm.customerPhone}
                                        onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                                    />
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">call</span>
                                </div>
                                {(() => {
                                    if (!bookingForm.customerPhone) return null;
                                    const matches = (customers || []).filter(c => 
                                        c.phone?.toString().trim().startsWith(bookingForm.customerPhone.trim())
                                    ).slice(0, 3); // Show top 3 matches
                                    
                                    if (matches.length > 0 && !matches.some(m => (m._id || m.id) === bookingForm.customerId)) {
                                        return (
                                            <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1">Gợi ý khách hàng ({matches.length})</p>
                                                {matches.map(matched => (
                                                    <div key={matched._id || matched.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center justify-between group hover:bg-blue-100 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 shadow-sm">
                                                                <span className="material-symbols-outlined text-sm">person</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-700 dark:text-slate-200">{matched.full_name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">{matched.phone}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectCustomer(matched)}
                                                            className="px-3 py-1 bg-[#2c2f31] dark:bg-white text-white dark:text-slate-900 text-[9px] font-black rounded-lg uppercase tracking-wider hover:scale-105 transition-all"
                                                        >
                                                            Chọn
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 ml-1 uppercase">Địa chỉ Email</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-4 py-2.5 pl-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-blue-500 outline-none transition-all dark:text-slate-100"
                                        placeholder="customer@domain.com"
                                        value={bookingForm.customerEmail}
                                        onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                                    />
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Stay & Room */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                             <span className="w-4 h-[2px] bg-indigo-500 rounded-full"></span>
                             Chi tiết đặt phòng
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 ml-1">LỰA CHỌN LOẠI PHÒNG</label>
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full appearance-none px-4 py-2.5 pl-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                        value={bookingForm.roomTypeId}
                                        onChange={(e) => setBookingForm({ ...bookingForm, roomTypeId: e.target.value })}
                                    >
                                        <option value="">Chọn một hạng phòng...</option>
                                        {roomTypes.map((rt: any) => (
                                            <option key={rt._id || rt.id} value={rt._id || rt.id}>
                                                {rt.name} — {new Intl.NumberFormat('vi-VN').format(rt.basePrice)}₫/ngày
                                            </option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">hotel</span>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">expand_more</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 ml-1">NGÀY CHECK-IN</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-100"
                                    value={bookingForm.checkInDate}
                                    onChange={(e) => setBookingForm({ ...bookingForm, checkInDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 ml-1">NGÀY CHECK-OUT</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-100"
                                    value={bookingForm.checkOutDate}
                                    onChange={(e) => setBookingForm({ ...bookingForm, checkOutDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 ml-1">SỐ LƯỢNG PHÒNG</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-100"
                                    value={bookingForm.roomQuantity}
                                    onChange={(e) => setBookingForm({ ...bookingForm, roomQuantity: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 ml-1">GIỜ NHẬN DỰ KIẾN</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-100 placeholder-slate-300"
                                    placeholder="Vd: 14:00"
                                    value={bookingForm.checkInTime}
                                    onChange={(e) => setBookingForm({ ...bookingForm, checkInTime: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Finance */}
                    <div className="space-y-4">
                         <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                             <span className="w-4 h-[2px] bg-emerald-500 rounded-full"></span>
                             Thanh toán & Ghi chú
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 ml-1 uppercase">Hình thức đóng phí</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                    value={bookingForm.paymentMethod}
                                    onChange={(e: any) => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}
                                >
                                    <option value="cash">💵 Tiền mặt tại quầy</option>
                                    <option value="vnpay">💳 Thẻ / Chuyển khoản (VNPay)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 ml-1 uppercase">Trạng thái ban đầu</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                    value={bookingForm.paymentStatus}
                                    onChange={(e: any) => setBookingForm({ ...bookingForm, paymentStatus: e.target.value })}
                                >
                                    <option value="unpaid">Yêu cầu thanh toán sau</option>
                                    <option value="deposited">Khách đã đặt cọc</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 ml-1 uppercase">Ghi chú yêu cầu đặc biệt</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium italic resize-none"
                                    placeholder="Khách cần thêm gối, check-in sớm, v.v..."
                                    rows={2}
                                    value={bookingForm.specialRequests}
                                    onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-3 justify-end items-center">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full md:w-auto px-8 py-2.5 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="w-full md:w-auto px-10 py-3 bg-[#2c2f31] dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Xác nhận khởi tạo đơn
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBooking;
