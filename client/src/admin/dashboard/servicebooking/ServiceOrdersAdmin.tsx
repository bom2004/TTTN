import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { exportServiceOrdersToExcel } from './ExeclService';
import { useAppDispatch, useAppSelector } from '../../../lib/redux/store';
import {
  fetchServiceOrdersThunk,
  updateOrderStatusThunk,
  selectAllServiceOrders,
  selectServiceLoading,
  ServiceOrder,
} from '../../../lib/redux/reducers/service';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: string }> = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: 'hourglass_empty' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: 'check_circle' },
  preparing: { label: 'Đang chuẩn bị', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', icon: 'restaurant' },
  delivering: { label: 'Đang giao', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', icon: 'delivery_dining' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700', dot: 'bg-green-500', icon: 'task_alt' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-600', dot: 'bg-red-500', icon: 'cancel' },
};

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  unpaid: { label: 'Chưa thanh toán', color: 'text-red-500' },
  paid_now: { label: 'Trả khi nhận đồ', color: 'text-amber-600' },
  charged_to_room: { label: 'Gộp hóa đơn phòng', color: 'text-blue-600' },
};

const NEXT_STATUS: Record<string, { status: string; label: string; color: string }> = {
  pending: { status: 'confirmed', label: 'Xác nhận đơn', color: 'bg-blue-500 hover:bg-blue-600' },
  confirmed: { status: 'preparing', label: 'Bắt đầu chuẩn bị', color: 'bg-purple-500 hover:bg-purple-600' },
  preparing: { status: 'delivering', label: 'Đang giao đồ', color: 'bg-orange-500 hover:bg-orange-600' },
  delivering: { status: 'completed', label: 'Hoàn tất', color: 'bg-green-500 hover:bg-green-600' },
};

const ServiceOrdersAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectAllServiceOrders);
  const loading = useAppSelector(selectServiceLoading);

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const location = useLocation();
  const basePath = location.pathname.startsWith('/owner') ? '/owner' : '/staff';

  const fetchOrders = () => dispatch(fetchServiceOrdersThunk());

  useEffect(() => {
    fetchOrders();
  }, [dispatch]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const updateStatus = async (id: string, status: string, paymentStatus?: string) => {
    setUpdating(id);
    try {
      await dispatch(updateOrderStatusThunk({ id, status, paymentStatus })).unwrap();
      toast.success('Cập nhật trạng thái thành công');
    } catch (err: any) { toast.error(err || 'Lỗi cập nhật'); }
    finally { setUpdating(null); }
  };

  const cancelOrder = (id: string) => updateStatus(id, 'cancelled');

  const filteredOrders = orders.filter((o: ServiceOrder) => {
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;

    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      (o.roomId?.roomNumber?.toString().toLowerCase().includes(searchLow)) ||
      (o.items.some(i => i.serviceId?.name?.toLowerCase().includes(searchLow)));

    let matchesDate = true;
    if (startDate) {
      const orderDate = new Date(o.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && orderDate >= start;
    }
    if (endDate) {
      const orderDate = new Date(o.createdAt);
      orderDate.setHours(23, 59, 59, 999);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && orderDate <= end;
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  const exportToExcel = () => {
    exportServiceOrdersToExcel(filteredOrders, startDate, endDate);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [filterStatus]);

  // Stats
  const stats = {
    pending: filteredOrders.filter((o: ServiceOrder) => o.status === 'pending').length,
    active: filteredOrders.filter((o: ServiceOrder) => ['confirmed', 'preparing', 'delivering'].includes(o.status)).length,
    completed: filteredOrders.filter((o: ServiceOrder) => o.status === 'completed').length,
    revenue: filteredOrders.filter((o: ServiceOrder) => o.status === 'completed').reduce((s: number, o: ServiceOrder) => s + o.totalAmount, 0),
    totalOrders: filteredOrders.length
  };

  return (
    <div className="p-6 bg-[#f5f7f9] dark:bg-slate-900 min-h-screen">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#2c2f31] dark:text-slate-100">Quản lý đơn dịch vụ</h2>
            <p className="text-[#595c5e] dark:text-slate-400 mt-1 text-sm">Tiếp nhận và xử lý yêu cầu dịch vụ từ khách hàng</p>
          </div>
          <div className="flex gap-3">
            <Link
              to={`${basePath}/service-orders/create`}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0050d4] hover:bg-[#0041ac] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-[#0050d4]/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Thêm đơn
            </Link>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">file_download</span>
              Xuất báo cáo
            </button>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-[#d9dde0] dark:border-slate-600 text-[#595c5e] dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-[#f5f7f9] transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Làm mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Chờ xác nhận', value: stats.pending, icon: 'hourglass_top', color: 'text-amber-600 bg-amber-50' },
            { label: 'Đang xử lý', value: stats.active, icon: 'pending_actions', color: 'text-blue-600 bg-blue-50' },
            { label: 'Hoàn thành', value: stats.completed, icon: 'task_alt', color: 'text-green-600 bg-green-50' },
            { label: 'Doanh thu DV', value: new Intl.NumberFormat('vi-VN').format(stats.revenue) + '₫', icon: 'payments', color: 'text-purple-600 bg-purple-50' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${s.color}`}>
                <span className="material-symbols-outlined text-xl">{s.icon}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-black text-[#2c2f31] dark:text-slate-100">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100/50 flex flex-wrap items-end gap-4">
          <div className="flex-[2] min-w-[280px]">
            <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Tìm kiếm đơn hàng</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Số phòng hoặc tên món..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0050d4]/20 transition-all outline-none"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#abadaf] text-xl">search</span>
            </div>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Từ ngày</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0050d4]/20 transition-all"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-xl">calendar_today</span>
            </div>
          </div>
          <div className="flex-1 min-w-[180px]">
            {/* ... same as before but adjusted min-width */}
            <label className="block text-[10px] font-black text-[#abadaf] uppercase tracking-widest mb-2 ml-1">Đến ngày</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0050d4]/20 transition-all"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-xl">event</span>
            </div>
          </div>
          {(startDate || endDate || searchTerm) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="Xóa tất cả lọc"
            >
              <span className="material-symbols-outlined">filter_alt_off</span>
            </button>
          )}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-1 px-4 py-3 border-b border-[#e5e9eb] dark:border-slate-700 overflow-x-auto">
            {[
              { val: 'all', label: 'Tất cả' },
              { val: 'pending', label: `Chờ (${stats.pending})` },
              { val: 'confirmed', label: 'Xác nhận' },
              { val: 'preparing', label: 'Chuẩn bị' },
              { val: 'delivering', label: 'Đang giao' },
              { val: 'completed', label: 'Hoàn thành' },
              { val: 'cancelled', label: 'Đã hủy' },
            ].map(tab => (
              <button
                key={tab.val}
                onClick={() => setFilterStatus(tab.val)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${filterStatus === tab.val
                  ? 'bg-[#0050d4] text-white shadow-sm'
                  : 'text-[#595c5e] dark:text-slate-400 hover:bg-[#eef1f3] dark:hover:bg-slate-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Order List */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[#abadaf] gap-3">
              <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
              <span className="font-semibold">Đang tải...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#abadaf] dark:text-slate-500 gap-3">
              <span className="material-symbols-outlined text-5xl">inbox</span>
              <p className="font-semibold">Không có đơn nào</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e5e9eb] dark:divide-slate-700">
              {currentOrders.map((order: ServiceOrder) => {
                const sc = STATUS_CONFIG[order.status];
                const pc = PAYMENT_LABELS[order.paymentStatus];
                const next = NEXT_STATUS[order.status];
                const isExpanded = expandedId === order._id;
                const isUpdating = updating === order._id;

                return (
                  <div key={order._id} className="hover:bg-[#f5f7f9] dark:hover:bg-slate-900/30 transition-colors">
                    {/* Order Row */}
                    <div
                      className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-5 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : order._id)}
                    >
                      {/* Left: Room + status */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0050d4]/10 to-[#0050d4]/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[#0050d4] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{sc.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-[#2c2f31] dark:text-slate-100 text-sm">
                              Phòng {order.roomId?.roomNumber || 'N/A'}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${sc.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </div>
                          <p className="text-xs text-[#747779] dark:text-slate-400 mt-0.5 font-medium">
                            {order.items.length} món · {new Date(order.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                          </p>
                          {order.note && <p className="text-xs text-[#595c5e] dark:text-slate-400 italic mt-0.5 truncate">📝 {order.note}</p>}
                        </div>
                      </div>

                      {/* Middle: Amount + payment */}
                      <div className="flex flex-col items-end md:items-start gap-1 shrink-0">
                        <span className="font-black text-[#2c2f31] dark:text-slate-100">
                          {new Intl.NumberFormat('vi-VN').format(order.totalAmount)}₫
                        </span>
                        <span className={`text-xs font-bold ${pc.color}`}>{pc.label}</span>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        {next && (
                          <button
                            onClick={() => updateStatus(order._id, next.status)}
                            disabled={isUpdating}
                            className={`flex items-center gap-2 px-4 py-2 ${next.color} text-white text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-sm`}
                          >
                            {isUpdating
                              ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                              : <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            }
                            {next.label}
                          </button>
                        )}
                        {order.status === 'delivering' && order.paymentStatus === 'paid_now' && (
                          <button
                            onClick={() => updateStatus(order._id, 'completed', 'paid_now')}
                            disabled={isUpdating}
                            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all"
                          >
                            Đã thu tiền
                          </button>
                        )}
                        {['pending', 'confirmed'].includes(order.status) && (
                          <button
                            onClick={() => cancelOrder(order._id)}
                            disabled={isUpdating}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[#747779] hover:text-red-600 transition-all"
                            title="Hủy đơn"
                          >
                            <span className="material-symbols-outlined text-xl">cancel</span>
                          </button>
                        )}
                        <span className={`material-symbols-outlined text-[#abadaf] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                      </div>
                    </div>

                    {/* Expanded: Item detail */}
                    {isExpanded && (
                      <div className="px-6 pb-5 ml-16">
                        <div className="bg-[#f5f7f9] dark:bg-slate-900 rounded-2xl p-4 space-y-3">
                          <p className="text-xs font-black text-[#abadaf] uppercase tracking-widest">Chi tiết đơn hàng</p>
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 border border-[#e5e9eb] dark:border-slate-600 flex items-center justify-center text-[#abadaf] overflow-hidden">
                                  {item.serviceId?.image
                                    ? <img src={item.serviceId.image} alt="" className="w-full h-full object-cover" />
                                    : <span className="material-symbols-outlined text-base">restaurant</span>
                                  }
                                </div>
                                <span className="text-sm font-bold text-[#2c2f31] dark:text-slate-100">
                                  {item.serviceId?.name || 'Dịch vụ'} <span className="text-[#747779]">x{item.quantity}</span>
                                </span>
                              </div>
                              <span className="text-sm font-black text-[#0050d4] dark:text-blue-400">
                                {new Intl.NumberFormat('vi-VN').format(item.priceAtOrder * item.quantity)}₫
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-[#e5e9eb] dark:border-slate-700 pt-3 flex justify-between">
                            <span className="font-black text-sm text-[#2c2f31] dark:text-slate-100">Tổng cộng</span>
                            <span className="font-black text-[#0050d4] dark:text-blue-400">
                              {new Intl.NumberFormat('vi-VN').format(order.totalAmount)}₫
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-5 flex items-center justify-center gap-2 border-t border-[#e5e9eb] dark:border-slate-700 bg-gray-50/50">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-[#d9dde0] dark:border-slate-700 text-[#747779] disabled:opacity-30 hover:bg-[#f5f7f9] transition-all"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_left</span>
                  </button>
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${currentPage === i + 1
                          ? 'bg-[#0050d4] text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 border border-[#d9dde0] dark:border-slate-700 text-[#747779] hover:bg-[#f5f7f9]'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-[#d9dde0] dark:border-slate-700 text-[#747779] disabled:opacity-30 hover:bg-[#f5f7f9] transition-all"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceOrdersAdmin;
