import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  DoorOpen, 
  User, 
  ArrowLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Package,
  Utensils,
  Coffee,
  WashingMachine,
  Sparkles
} from 'lucide-react';
import axiosInstance, { BASE_URL } from '../../../lib/redux/api/axiosInstance';

interface Category {
  _id: string;
  name: string;
}

interface Service {
  _id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;
  categoryId: string;
}

interface OccupiedRoom {
  room: {
    _id: string;
    roomNumber: string;
    roomTypeId: {
      name: string;
    };
  };
  booking: {
    _id: string;
    customerInfo: {
      name: string;
      phone: string;
    };
  } | null;
}

interface CartItem extends Service {
  quantity: number;
}

const CreateService: React.FC = () => {
  // Navigation & View State
  const [step, setStep] = useState<1 | 2>(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Data State
  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoom[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Selection State
  const [selectedRoom, setSelectedRoom] = useState<OccupiedRoom | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [roomsRes, catsRes, servicesRes] = await Promise.all([
        axiosInstance.get('/api/service-bookings/occupied-rooms'),
        axiosInstance.get('/api/service-bookings/categories'),
        axiosInstance.get('/api/service-bookings/services')
      ]);

      if (roomsRes.data.success) setOccupiedRooms(roomsRes.data.data);
      if (catsRes.data.success) setCategories(catsRes.data.data);
      if (servicesRes.data.success) setServices(servicesRes.data.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = (room: OccupiedRoom) => {
    setSelectedRoom(room);
    setStep(2);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (service: Service) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === service._id);
      if (existing) {
        return prev.map(item => 
          item._id === service._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...service, quantity: 1 }];
    });
    toast.success(`Đã thêm ${service.name}`, { autoClose: 1000, position: 'bottom-right' });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.warn('Vui lòng chọn ít nhất một dịch vụ.');
      return;
    }

    // Trích xuất ID chắc chắn, chuyển sang string để tránh lỗi ObjectId so sánh
    const bookingId = selectedRoom?.booking?._id?.toString()
      || (selectedRoom?.booking as any)?.id?.toString();
    const roomId = selectedRoom?.room?._id?.toString()
      || (selectedRoom?.room as any)?.id?.toString();

    if (!bookingId || !roomId) {
      toast.error('Không tìm thấy thông tin phòng. Vui lòng chọn lại phòng.');
      setSubmitting(false);
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        bookingId,
        roomId,
        items: cart.map(item => ({
          serviceId: item._id,
          quantity: item.quantity,
          priceAtOrder: item.price
        })),
        note,
        paymentStatus: 'charged_to_room'
      };

      const res = await axiosInstance.post('/api/service-bookings/orders', payload);
      if (res.data.success) {
        toast.success('Đã thêm đơn dịch vụ thành công!');
        setCart([]);
        setNote('');
        setStep(1);
        setSelectedRoom(null);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn.';
      toast.error(msg);
      console.error('[CreateService] Lỗi tạo đơn:', error.response?.data || error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = services.filter(s => {
    const matchCat = activeCategory === 'all' || s.categoryId === activeCategory;
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu khách phòng...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] dark:bg-slate-950 min-h-screen font-['Inter',sans-serif]">
      {/* Header Container */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {step === 1 ? 'Chọn phòng gọi món' : 'Xây dựng đơn hàng'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              {step === 1 ? (
                <> <DoorOpen size={16} /> Chọn phòng hiện đang có khách lưu trú</>
              ) : (
                <> <Sparkles size={16} className="text-amber-500" /> Thêm các món yêu cầu cho phòng {selectedRoom?.room.roomNumber}</>
              )}
            </p>
          </div>
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <ArrowLeft size={18} /> Quay lại
            </button>
          ) }
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {step === 1 ? (
          /* PHÁP 1: DANH SÁCH PHÒNG ĐANG Ở */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {occupiedRooms.length > 0 ? (
              occupiedRooms.map((item) => (
                <div 
                  key={item.room._id}
                  onClick={() => handleSelectRoom(item)}
                  className="group relative bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-slate-100 dark:border-slate-700 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping group-hover:scale-125 transition-transform"></div>
                    <div className="absolute top-6 right-6 w-3 h-3 bg-emerald-500 rounded-full"></div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                      <DoorOpen size={28} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">
                    Phòng {item.room.roomNumber}
                  </h3>
                  <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4">
                    {item.room.roomTypeId.name}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-700">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <User size={16} className="text-slate-400" />
                      <span className="text-sm font-bold truncate">{item.booking?.customerInfo.name || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Đang lưu trú</span>
                    <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Package className="text-slate-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Hiện tại không có phòng nào có khách</h3>
                <p className="text-slate-400">Chức năng này chỉ áp dụng cho phòng đã check-in.</p>
              </div>
            )}
          </div>
        ) : (
          /* PHA 2: CHỌN DỊCH VỤ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Cột 1: Danh sách dịch vụ */}
            <div className="lg:col-span-8 space-y-6">
              {/* Filter & Search Category */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Tìm món ăn, đồ uống, vật dụng..."
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setActiveCategory('all')}
                    className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeCategory === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 hover:bg-slate-100'}`}
                  >
                    Tất cả
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat._id}
                      onClick={() => setActiveCategory(cat._id)}
                      className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeCategory === cat._id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 hover:bg-slate-100'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Services */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredServices.map(service => (
                  <div 
                    key={service._id}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all group flex flex-col"
                  >
                    <div className="relative aspect-square mb-4 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-700">
                      {service.image ? (
                        <img 
                          src={service.image.startsWith('http') ? service.image : `${BASE_URL}${service.image}`} 
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => { (e.target as any).src = "https://placehold.co/400x400/f1f5f9/94a3b8?text=Service"; }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                           <Utensils size={40} />
                        </div>
                      )}
                      <button 
                         onClick={() => addToCart(service)}
                         className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex items-center justify-center"
                      >
                         <Plus size={20} />
                      </button>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2 mb-1">{service.name}</h4>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-blue-600 dark:text-blue-400 font-black text-sm">
                          {service.price.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{service.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột 2: Giỏ hàng & Thanh toán */}
            <div className="lg:col-span-4 sticky top-6">
              <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className="p-6 bg-slate-900 dark:bg-slate-900 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <ShoppingBag size={24} />
                    <h3 className="text-xl font-black">Yêu cầu của khách</h3>
                  </div>
                  <div className="flex items-center gap-2 opacity-70">
                    <DoorOpen size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Phòng {selectedRoom?.room.roomNumber}</span>
                  </div>
                </div>

                <div className="p-6 max-h-[400px] overflow-y-auto">
                  {cart.length > 0 ? (
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={item._id} className="flex gap-4 items-center animate-in slide-in-from-right-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 overflow-hidden shrink-0">
                            {item.image ? (
                              <img 
                                src={item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image}`} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full"><Package size={20} className="text-slate-300" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.name}</h5>
                            <p className="text-xs text-slate-400">{item.price.toLocaleString('vi-VN')}đ / {item.unit}</p>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 p-1 rounded-xl">
                            <button 
                              onClick={() => updateQuantity(item._id, -1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-4 text-center text-xs font-black">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item._id, 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item._id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 opacity-30">
                      <ShoppingBag size={48} className="mx-auto mb-2" />
                      <p className="font-bold">Chưa có món nào</p>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                  <div className="mb-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ghi chú đặc biệt</label>
                    <textarea 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="VD: Không cay, ít đường..."
                      className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <span className="text-slate-500 font-bold">Tổng thanh toán:</span>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {totalAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <button 
                    onClick={handleSubmit}
                    disabled={submitting || cart.length === 0}
                    className="w-full py-4 bg-blue-600 text-white font-black rounded-[20px] shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <><CheckCircle2 size={20} /> Xác nhận đặt đơn</>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-4 font-medium italic">
                    * Đơn hàng sẽ được tự động cộng vào tiền phòng khi hoàn tất
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateService;
