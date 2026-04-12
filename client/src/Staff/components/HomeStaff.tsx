import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../lib/redux/store";
import { Room, selectRoomLoading, selectAllRooms, fetchAllRoomsThunk } from "../../lib/redux/reducers/room";
import { fetchAllUsersThunk, selectAllUsers, selectUserLoading, User } from "../../lib/redux/reducers/user";
import { fetchAllBookingsThunk, selectAllBookings, selectBookingLoading } from "../../lib/redux/reducers/booking";
import { selectAuthUser } from "../../lib/redux/reducers/auth/selectors";

// Mở rộng kiểu Room để hỗ trợ cả string và object (populated) cho roomType
interface PopulatedRoom extends Omit<Room, 'roomType'> {
  roomType: string | { _id: string; name: string };
}

const HomeStaff: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authUser = useAppSelector(selectAuthUser);
  
  const rooms = useAppSelector(selectAllRooms) as unknown as PopulatedRoom[];
  const loadingRooms = useAppSelector(selectRoomLoading);
  
  const users = useAppSelector(selectAllUsers);
  const loadingUsers = useAppSelector(selectUserLoading);

  const bookings = useAppSelector(selectAllBookings);
  const loadingBookings = useAppSelector(selectBookingLoading);

  const loading = loadingRooms || loadingUsers || loadingBookings;

  useEffect(() => {
    dispatch(fetchAllRoomsThunk()).unwrap().catch(() => {});
    dispatch(fetchAllUsersThunk()).unwrap().catch(() => {});
    dispatch(fetchAllBookingsThunk()).unwrap().catch(() => {});
  }, [dispatch, authUser]);

  // Các biến tính toán thống kê
  const todayBookingsCount = bookings.filter(b => {
    const today = new Date().toISOString().split('T')[0];
    return b.createdAt.startsWith(today);
  }).length;

  const availableRoomsCount = rooms.filter(r => r.status === 'available').length;
  const customersCount = users.filter((u: User) => u.role === 'customer').length;
  const pendingCheckinsCount = bookings.filter(b => b.status === 'pending').length;

  const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  const statCards = [
    { 
      title: "Lượt đặt hôm nay", 
      value: todayBookingsCount.toString(), 
      icon: "calendar_month", 
      color: "text-emerald-600 bg-emerald-50",
      iconBg: "bg-emerald-100",
      trend: "Hoạt động cao"
    },
    { 
      title: "Phòng trống", 
      value: availableRoomsCount.toString(), 
      icon: "bed", 
      color: "text-blue-600 bg-blue-50",
      iconBg: "bg-blue-100",
      trend: "Có sẵn"
    },
    { 
      title: "Tổng khách hàng", 
      value: customersCount.toString(), 
      icon: "group", 
      color: "text-purple-600 bg-purple-50",
      iconBg: "bg-purple-100",
      trend: "Dữ liệu thực tế"
    },
    { 
      title: "Chờ xác nhận", 
      value: pendingCheckinsCount.toString(), 
      icon: "assignment_ind", 
      color: "text-amber-600 bg-amber-50",
      iconBg: "bg-amber-100",
      trend: "Cần xử lý"
    },
  ];

  return (
    <div className="p-8 bg-[#f5f7f9] min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#2c2f31] tracking-tight font-['Manrope',sans-serif]">Bảng điều khiển nhân viên</h1>
            <p className="text-[#595c5e] mt-1 font-medium font-['Inter',sans-serif]">Chào mừng bạn trở lại! Quản lý yêu cầu từ khách hàng và vận hành khách sạn ổn định.</p>
          </div>
          
          <div className="flex gap-3">
             <button 
                onClick={() => {
                    dispatch(fetchAllRoomsThunk());
                    dispatch(fetchAllUsersThunk());
                    dispatch(fetchAllBookingsThunk());
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#d9dde0] rounded-xl text-sm font-bold text-[#4e5c71] hover:bg-[#eef1f3] transition-all shadow-sm"
             >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
                Làm mới dữ liệu
             </button>
             <Link 
                to="/staff/bookings"
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0050d4] to-[#0046bb] rounded-xl text-sm font-bold text-white hover:shadow-lg active:scale-95 transition-all shadow-md"
             >
                Quản lý đặt phòng
             </Link>
          </div>
        </header>

        {/* Stats Grid - Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border-0 relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#0050d4]/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-6">
                <div className={`${card.iconBg} p-3 rounded-xl ${card.color}`}>
                   <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {card.icon}
                   </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${card.color}`}>
                    {card.trend}
                </span>
              </div>
              <p className="text-sm font-medium text-[#747779] font-['Inter',sans-serif] uppercase tracking-wider">{card.title}</p>
              <h3 className="text-3xl font-extrabold mt-1 text-[#2c2f31] font-['Manrope',sans-serif] tracking-tight">
                {loading ? <span className="animate-pulse">...</span> : card.value}
              </h3>
            </div>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
             <div className="p-8 border-b border-[#e5e9eb] flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-bold text-[#2c2f31] font-['Manrope',sans-serif]">Hoạt động đặt phòng mới nhất</h3>
                   <p className="text-sm text-[#595c5e] font-medium font-['Inter',sans-serif]">Danh sách các đơn đặt phòng mới cần xử lý kịp thời.</p>
                </div>
                <Link to="/staff/bookings" className="text-sm font-bold text-[#0050d4] hover:underline flex items-center gap-1">
                    Xem tất cả <span className="material-symbols-outlined text-sm">open_in_new</span>
                </Link>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-[#f5f7f9]/50">
                         <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Khách hàng</th>
                         <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Loại phòng</th>
                         <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Thời điểm đặt</th>
                         <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest font-['Manrope',sans-serif]">Trạng thái</th>
                         <th className="px-8 py-5 text-xs font-bold text-[#595c5e] uppercase tracking-widest text-right font-['Manrope',sans-serif]">Thao tác</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[#e5e9eb]">
                      {recentBookings.length > 0 ? recentBookings.map((item: any, i: number) => {
                         const timeStr = `${new Date(item.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - ${new Date(item.createdAt).toLocaleDateString('vi-VN')}`;
                         
                         const getStatusStyle = (status: string) => {
                            switch(status) {
                                case 'pending': return "text-amber-700 bg-amber-50 border-amber-100";
                                case 'confirmed': return "text-blue-700 bg-blue-50 border-blue-100";
                                case 'checked_in': return "text-emerald-700 bg-emerald-50 border-emerald-100";
                                case 'checked_out': return "text-indigo-700 bg-indigo-50 border-indigo-100";
                                case 'cancelled': return "text-rose-700 bg-rose-50 border-rose-100";
                                default: return "text-slate-600 bg-slate-50 border-slate-100";
                            }
                         };

                         const getStatusLabel = (status: string) => {
                            switch(status) {
                                case 'pending': return "Chờ xác nhận";
                                case 'confirmed': return "Đã xác nhận";
                                case 'checked_in': return "Đã nhận phòng";
                                case 'checked_out': return "Đã trả phòng";
                                case 'cancelled': return "Đã hủy";
                                default: return status;
                            }
                         };
                         
                         const roomTypeName = item.roomTypeId?.name || "Đang cập nhật";

                         return (
                         <tr key={i} className="hover:bg-[#f5f7f9] transition-all duration-300">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0050d4] to-[#0046bb] text-white font-bold flex items-center justify-center shadow-md shadow-blue-500/10">
                                     {item.customerInfo.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-[#2c2f31]">{item.customerInfo.name}</p>
                                    <p className="text-[11px] text-[#747779] font-medium">{item.customerInfo.email}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <span className="text-sm font-semibold text-[#4e5c71]">{roomTypeName}</span>
                            </td>
                            <td className="px-8 py-6">
                               <span className="text-xs font-bold text-[#747779] uppercase tracking-tight">{timeStr}</span>
                            </td>
                            <td className="px-8 py-6">
                               <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(item.status)}`}>
                                  {getStatusLabel(item.status)}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <Link 
                                 to="/staff/bookings" 
                                 className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#d9dde0] text-[#747779] hover:text-[#0050d4] hover:border-[#0050d4] hover:bg-blue-50 transition-all"
                               >
                                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                                </Link>
                            </td>
                         </tr>
                      )}) : (
                          <tr>
                              <td colSpan={5} className="py-20 text-center">
                                 <span className="material-symbols-outlined text-5xl text-[#abadaf] mb-3">inbox</span>
                                 <p className="text-sm font-bold text-[#747779]">Hiện chưa có hoạt động đặt phòng nào.</p>
                              </td>
                          </tr>
                      )}
                   </tbody>
                </table>
             </div>
        </div>
      </div>
    </div>
  );
};

export default HomeStaff;
