import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../lib/redux/api/axiosInstance';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../lib/redux/store';
import { selectAuthUser } from '../../lib/redux/reducers/auth/selectors';

const API = 'http://localhost:3000/api/service-bookings';

interface Category { _id: string; name: string; description?: string; }
interface ServiceItem { _id: string; name: string; price: number; unit: string; image?: string; isAvailable: boolean; categoryId: string | { _id: string; name: string }; }
interface CartItem extends ServiceItem { quantity: number; }

const ICONS: Record<string, string> = {
  'Đồ ăn': 'restaurant', 'Thức uống': 'local_bar', 'Vật dụng': 'luggage', 'Khác': 'more_horiz'
};

const ServicesPage: React.FC = () => {
  const user = useAppSelector(selectAuthUser);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [note, setNote] = useState('');
  const [paymentMode, setPaymentMode] = useState<'charged_to_room' | 'paid_now'>('charged_to_room');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [bookings, setBookings] = useState<any[]>([]);
  const [activeBooking, setActiveBooking] = useState<any>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, svcRes] = await Promise.all([
        axiosInstance.get(`${API}/categories`),
        axiosInstance.get(`${API}/services`)
      ]);
      setCategories(catRes.data.data);
      setServices(svcRes.data.data);
      if (catRes.data.data.length > 0) setActiveTab(catRes.data.data[0]._id);
    } catch {
      toast.error('Không thể tải dữ liệu dịch vụ');
    } finally {
      setLoading(false);
    }

    // Fetch thông tin phòng đang ở — tách riêng, lỗi không ảnh hưởng giao diện chính
    if (user) {
      const userId = user.id || (user as any)._id;
      if (userId && userId !== 'undefined') {
        try {
          const bookRes = await axiosInstance.get(`http://localhost:3000/api/bookings/user/${userId}`);
          const userBookings: any[] = bookRes.data.data || [];
          const currentStay = userBookings.find((b: any) => b.status === 'checked_in');
          setActiveBooking(currentStay || null);
        } catch (err) {
          console.error('Error fetching stay info:', err);
          setActiveBooking(null);
        }
      }
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredItems = services.filter(s => {
    const catId = typeof s.categoryId === 'string' ? s.categoryId : s.categoryId?._id;
    return catId === activeTab && s.isAvailable;
  });

  // Cart helpers
  const addToCart = (item: ServiceItem) => {
    if (!activeBooking) {
      toast.warning('Bạn chỉ có thể đặt dịch vụ khi đang sử dụng phòng tại khách sạn.');
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c._id === item._id);
      if (existing) return prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`Đã thêm "${item.name}" vào giỏ`, {
      autoClose: 1200,
      icon: <span className="material-symbols-outlined text-blue-600">shopping_cart</span>
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c._id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const totalAmount = cart.reduce((acc, c) => acc + c.price * c.quantity, 0);
  const totalItems = cart.reduce((acc, c) => acc + c.quantity, 0);

  const getCartQty = (id: string) => cart.find(c => c._id === id)?.quantity || 0;

  const placeOrder = async () => {
    if (cart.length === 0) return;
    if (!user) { toast.error('Vui lòng đăng nhập để đặt dịch vụ'); return; }
    if (!activeBooking) { toast.error('Không tìm thấy thông tin phòng đang ở'); return; }

    setSubmitting(true);
    try {
      // Lấy roomId từ chi tiết booking (phòng đầu tiên)
      const firstDetail = activeBooking.details?.[0];
      const roomId = firstDetail?.roomId?._id || firstDetail?.roomId;

      if (!roomId) {
        toast.error('Không tìm thấy thông tin số phòng của bạn. Vui lòng thử lại.');
        return;
      }

      await axiosInstance.post(`${API}/orders`, {
        bookingId: activeBooking._id,
        roomId: roomId,
        items: cart.map(c => ({ serviceId: c._id, quantity: c.quantity })),
        note,
        paymentStatus: paymentMode === 'paid_now' ? 'paid_now' : 'charged_to_room'
      });
      toast.success('🎉 Đặt thành công! Chúng tôi sẽ giao đến phòng ' + (activeBooking.details?.[0]?.roomId?.roomNumber || '') + ' ngay.');
      setCart([]);
      setNote('');
      setShowOrderModal(false);
      setShowCart(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi đơn hàng');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      {/* Modern Hero Section - Compact Version */}
      <div className="relative bg-gradient-to-r from-indigo-900 via-[#003580] to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-14 md:px-10 text-left">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 mb-4 text-xs font-medium">
            <span className="material-symbols-outlined text-sm">concierge</span>
            <span>Giao tận phòng 24/7</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Dịch vụ tại phòng
          </h1>
          <p className="text-sm md:text-base text-blue-100 max-w-2xl font-light opacity-90">
            Thưởng thức ẩm thực và tiện ích cao cấp ngay tại không gian riêng của bạn
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-10">
        {/* Breadcrumb Section */}
        <nav className="flex items-center gap-2 py-6 text-sm">
          <Link to="/" className="text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">home</span>
            Trang chủ
          </Link>
          <span className="material-symbols-outlined text-gray-300 text-sm">chevron_right</span>
          <span className="text-indigo-600 font-bold">Dịch vụ</span>
        </nav>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 mb-20 text-center animate-fade-in px-4">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl text-indigo-500">lock</span>
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-3">Vui lòng đăng nhập</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
              Các dịch vụ cao cấp và thực đơn tại phòng chỉ hiển thị giới hạn cho khách hàng đã là thành viên của QuickStay.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-indigo-900 transition-all active:scale-95">
                Đăng nhập ngay
              </Link>
              <Link to="/register" className="px-8 py-3.5 bg-white text-indigo-600 font-bold rounded-xl border-2 border-indigo-100 hover:bg-indigo-50 transition-all active:scale-95">
                Đăng ký miễn phí
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-gray-400 gap-5">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600">restaurant</span>
            </div>
            <p className="font-semibold text-gray-500">Đang tải thực đơn...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-4xl text-gray-300">dining</span>
            </div>
            <p className="font-bold text-xl text-gray-500">Chưa có dịch vụ nào được thiết lập</p>
            <p className="text-sm text-gray-400 mt-2">Vui lòng liên hệ lễ tân để được hỗ trợ</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Modern Category Sidebar */}
            <aside className="md:w-72 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24 backdrop-blur-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500 text-xl">category</span>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Danh mục</p>
                  </div>
                </div>
                <div className="p-3">
                  {categories.map(cat => (
                    <button
                      key={cat._id}
                      onClick={() => setActiveTab(cat._id)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 mb-1.5 ${activeTab === cat._id
                        ? 'bg-indigo-50 text-indigo-700 shadow-inner'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${activeTab === cat._id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                        <span className="material-symbols-outlined text-xl">
                          {ICONS[cat.name] || 'room_service'}
                        </span>
                      </div>
                      <span className="flex-1 text-left">{cat.name}</span>
                      {activeTab === cat._id && (
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Mobile Category Scroll */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setActiveTab(cat._id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeTab === cat._id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : 'bg-white text-gray-500 border border-gray-200'
                    }`}
                >
                  <span className="material-symbols-outlined text-base">{ICONS[cat.name] || 'room_service'}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Services Grid */}
            <main className="flex-1">
              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-20">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl text-gray-300">search_off</span>
                  </div>
                  <p className="font-semibold text-gray-500">Danh mục này hiện chưa có món nào</p>
                  <p className="text-sm text-gray-400 mt-1">Vui lòng chọn danh mục khác</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                  {filteredItems.map(item => {
                    const qty = getCartQty(item._id);
                    return (
                      <div key={item._id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        {/* Image Area with Gradient Overlay */}
                        <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <span className="material-symbols-outlined text-5xl">restaurant_menu</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-bold text-indigo-700 shadow-sm">
                            /{item.unit}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1">{item.name}</h3>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex flex-col">
                              <span className="text-2xl font-black text-indigo-700">
                                {new Intl.NumberFormat('vi-VN').format(item.price)}₫
                              </span>
                            </div>
                            {qty === 0 ? (
                              <button
                                onClick={() => addToCart(item)}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-md hover:shadow-indigo-200"
                              >
                                <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                                Thêm
                              </button>
                            ) : (
                              <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-1">
                                <button
                                  onClick={() => updateQty(item._id, -1)}
                                  className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-indigo-600 font-bold shadow-sm hover:bg-red-50 hover:text-red-500 transition-all"
                                >
                                  −
                                </button>
                                <span className="text-sm font-black text-indigo-700 min-w-[20px] text-center">{qty}</span>
                                <button
                                  onClick={() => updateQty(item._id, 1)}
                                  className="w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-lg text-white font-bold hover:bg-indigo-700 transition-all"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* Modern Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-slow">
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center gap-4 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white px-7 py-4 rounded-2xl shadow-2xl shadow-indigo-900/40 hover:shadow-indigo-600/30 transition-all active:scale-95 group"
          >
            <div className="relative">
              <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">shopping_bag</span>
              <span className="absolute -top-2 -right-3 bg-amber-400 text-indigo-900 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md">{totalItems}</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold opacity-80">Giỏ hàng của bạn</p>
              <p className="font-black text-lg">{new Intl.NumberFormat('vi-VN').format(totalAmount)}₫</p>
            </div>
            <span className="material-symbols-outlined text-xl opacity-60 group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      )}

      {/* Modern Cart Slide Panel */}
      {showCart && (
        <div className="fixed inset-0 z-[1000] flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCart(false)} />
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-in-right relative z-[1001]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
              <div>
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">shopping_bag</span>
                  Giỏ hàng
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{totalItems} món đã chọn</p>
              </div>
              <button onClick={() => setShowCart(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all text-3xl font-light">
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.map(item => (
                <div key={item._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-200 to-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-400">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined">restaurant</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{item.name}</p>
                    <p className="text-indigo-600 font-bold mt-1">{new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}₫</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm">
                    <button onClick={() => updateQty(item._id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 font-bold hover:bg-red-50 hover:text-red-500 transition-all">−</button>
                    <span className="font-bold text-gray-700 w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item._id, 1)} className="w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-lg text-white font-bold hover:bg-indigo-700 transition-all">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100 bg-white space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-semibold">Tổng cộng</span>
                <span className="text-3xl font-black text-indigo-700">{new Intl.NumberFormat('vi-VN').format(totalAmount)}₫</span>
              </div>
              <button
                onClick={() => { setShowCart(false); setShowOrderModal(true); }}
                className="w-full py-4 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white font-bold rounded-xl text-base hover:from-indigo-800 hover:to-indigo-950 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
              >
                Tiến hành đặt hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in relative z-[1001]">
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">receipt_long</span>
                <h2 className="text-xl font-black text-gray-800">Xác nhận đơn hàng</h2>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="text-3xl font-light text-gray-400 hover:text-gray-600 transition-all">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
                {cart.map(item => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                    <span className="text-indigo-700 font-bold">{new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}₫</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between font-black text-base">
                  <span>Tổng cộng</span>
                  <span className="text-indigo-700">{new Intl.NumberFormat('vi-VN').format(totalAmount)}₫</span>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  Ghi chú (tuỳ chọn)
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ví dụ: ít đá, không hành, giao trước 8 giờ tối..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 resize-none transition-all"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">payments</span>
                  Hình thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'charged_to_room' as const, label: 'Gộp vào hóa đơn phòng', icon: 'receipt_long' },
                    { val: 'paid_now' as const, label: 'Trả tiền khi nhận đồ', icon: 'payments' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setPaymentMode(opt.val)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${paymentMode === opt.val
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                    >
                      <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Quay lại
                </button>
                <button
                  onClick={placeOrder}
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white font-bold rounded-xl hover:from-indigo-800 hover:to-indigo-950 transition-all shadow-md shadow-indigo-200 active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Đang xử lý
                    </span>
                  ) : (
                    'Xác nhận đặt hàng'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-10px) translateX(-50%); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default ServicesPage;