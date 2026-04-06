import React, { useEffect } from "react";
import { Link } from "react-router-dom";
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
      color: "bg-emerald-50 text-emerald-600",
      trend: "Hoạt động cao"
    },
    { 
      title: "Phòng trống", 
      value: availableRoomsCount.toString(), 
      icon: "bed", 
      color: "bg-blue-50 text-blue-600",
      trend: "Có sẵn"
    },
    { 
      title: "Tổng khách hàng", 
      value: customersCount.toString(), 
      icon: "group", 
      color: "bg-indigo-50 text-indigo-600",
      trend: "Dữ liệu thực tế"
    },
    { 
      title: "Chờ xác nhận", 
      value: pendingCheckinsCount.toString(), 
      icon: "assignment_ind", 
      color: "bg-amber-50 text-amber-600",
      trend: "Cần xử lý"
    },
  ];

  return (
    <div className="p-8 bg-[#f5f5f5] min-h-screen font-sans">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-[900] text-[#003580] tracking-tight text-left">Bảng điều khiển nhân viên</h1>
            <p className="text-sm font-medium text-gray-500 text-left">Chào mừng bạn quay lại làm việc! Quản lý yêu cầu từ khách hàng hiệu quả.</p>
          </div>
          
          <div className="flex gap-4">
             <div className="px-6 py-4 bg-blue-50 text-[#003580] font-black text-sm uppercase tracking-widest rounded-2xl flex items-center gap-2 shadow-sm border border-blue-100">
                <span className="material-symbols-outlined text-[20px]">info</span>
                Công được quản lý qua Excel
             </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-start group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#003580]/[0.02] rounded-full -mr-8 -mt-8 group-hover:bg-[#003580]/[0.05] transition-colors"></div>
              <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                 <span className="material-symbols-outlined text-3xl">
                    {card.icon}
                 </span>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{card.title}</p>
              <h2 className="text-3xl font-black text-[#003580] mb-4 tracking-tight">{loading ? "..." : card.value}</h2>
              <div className="mt-auto flex items-center gap-2">
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${index === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                    {card.trend}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Table */}
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="text-xl font-black text-[#003580] tracking-tight">Hoạt động đặt phòng mới nhất</h3>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Danh sách phòng chờ xử lý</p>
                </div>
                <button 
                  onClick={() => {
                      dispatch(fetchAllRoomsThunk());
                      dispatch(fetchAllUsersThunk());
                      dispatch(fetchAllBookingsThunk());
                  }} 
                  className="px-6 py-3 bg-[#003580] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#002a6b] transition-all shadow-md">
                   Làm mới dữ liệu
                </button>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="border-b-2 border-gray-50">
                      <tr>
                         <th className="py-4 px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Khách hàng</th>
                         <th className="py-4 px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Phòng</th>
                         <th className="py-4 px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
                         <th className="py-4 px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
                         <th className="py-4 px-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Hành động</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {recentBookings.length > 0 ? recentBookings.map((item: any, i: number) => {
                         const timeStr = `${new Date(item.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - ${new Date(item.createdAt).toLocaleDateString('vi-VN')}`;
                         const statusColor = item.status === 'pending' ? "text-amber-600 bg-amber-50" : 
                                            item.status === 'confirmed' ? "text-blue-600 bg-blue-50" :
                                            item.status === 'checked_in' ? "text-cyan-600 bg-cyan-50" : 
                                            item.status === 'checked_out' ? "text-indigo-600 bg-indigo-50" : 
                                            item.status === 'cancelled' ? "text-rose-600 bg-rose-50" : "text-gray-600 bg-gray-50";

                         const statusLabel = item.status === 'pending' ? "Chờ xác nhận" : 
                                            item.status === 'confirmed' ? "Đã xác nhận" :
                                            item.status === 'checked_in' ? "Đã nhận phòng" : 
                                            item.status === 'checked_out' ? "Đã trả phòng" : 
                                            item.status === 'cancelled' ? "Đã hủy" : "Hoàn thành";
                         
                         const roomName = item.details && item.details.length > 0 
                                            ? item.details[0].roomId?.name 
                                            : "Đang cập nhật";

                         return (
                         <tr key={i} className="group hover:bg-gray-50 transition-all duration-300">
                            <td className="py-5 px-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-[#003580]/5 text-[#003580] font-black flex items-center justify-center">
                                     {item.customerInfo.name.charAt(0)}
                                  </div>
                                  <span className="text-sm font-black text-[#1a1a1a]">{item.customerInfo.name}</span>
                               </div>
                            </td>
                            <td className="py-5 px-4">
                               <span className="text-sm font-medium text-gray-600">{roomName}</span>
                            </td>
                            <td className="py-5 px-4">
                               <span className="text-xs font-bold text-gray-400 uppercase">{timeStr}</span>
                            </td>
                            <td className="py-5 px-4">
                               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColor}`}>
                                  {statusLabel}
                               </span>
                            </td>
                            <td className="py-5 px-4">
                               <Link to="/staff/dashboard/bookings" className="p-2 text-gray-400 hover:text-[#003580] transition-colors">
                                  <span className="material-symbols-outlined text-lg">visibility</span>
                                </Link>
                            </td>
                         </tr>
                      )}) : (
                          <tr>
                              <td colSpan={5} className="py-8 text-center text-sm font-bold text-gray-400">Không có đơn hàng nào.</td>
                          </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeStaff;
