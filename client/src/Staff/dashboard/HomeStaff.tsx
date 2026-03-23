import React, { useState, useEffect } from "react";
import axios from "axios";
import { ApiResponse } from "../../types";

interface DashboardStats {
  todayBookings: number;
  availableRooms: number;
  totalCustomers: number;
  pendingCheckins: number;
}

const HomeStaff: React.FC = () => {
  const backendUrl = "http://localhost:3000";
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 12,
    availableRooms: 15,
    totalCustomers: 542,
    pendingCheckins: 5,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        // Placeholder for statistics that staff can see
        const [usersRes, roomsRes] = await Promise.all([
          axios.get<ApiResponse<any[]>>(`${backendUrl}/api/user/all-users`),
          axios.get<ApiResponse<any[]>>(`${backendUrl}/api/rooms`)
        ]);

        setStats({
          todayBookings: 12, // Dummy
          availableRooms: roomsRes.data.success ? (roomsRes.data.data?.filter((r: any) => r.status === 'available').length || 0) : 0,
          totalCustomers: usersRes.data.success ? (usersRes.data.data?.length || 0) : 0,
          pendingCheckins: 5, // Dummy
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      title: "Lượt đặt hôm nay", 
      value: stats.todayBookings.toString(), 
      icon: "calendar_month", 
      color: "bg-emerald-50 text-emerald-600",
      trend: "Hoạt động cao"
    },
    { 
      title: "Phòng trống", 
      value: stats.availableRooms.toString(), 
      icon: "bed", 
      color: "bg-blue-50 text-blue-600",
      trend: "Có sẵn"
    },
    { 
      title: "Tổng khách hàng", 
      value: stats.totalCustomers.toString(), 
      icon: "group", 
      color: "bg-indigo-50 text-indigo-600",
      trend: "Dữ liệu thực tế"
    },
    { 
      title: "Chờ Check-in", 
      value: stats.pendingCheckins.toString(), 
      icon: "assignment_ind", 
      color: "bg-amber-50 text-amber-600",
      trend: "Cần xử lý"
    },
  ];

  return (
    <div className="p-8 bg-[#f5f5f5] min-h-screen font-sans">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-[900] text-[#003580] tracking-tight text-left">Bảng điều khiển nhân viên</h1>
          <p className="text-sm font-medium text-gray-500 text-left">Chào mừng bạn quay lại làm việc! Quản lý yêu cầu từ khách hàng hiệu quả.</p>
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

        {/* Recent Activity Table (Simulated) */}
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-[#003580] tracking-tight">Hoạt động đặt phòng mới nhất</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Danh sách phòng chờ xử lý</p>
                </div>
                <button className="px-6 py-3 bg-[#003580] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#002a6b] transition-all shadow-md">
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
                      {[
                         { name: "Phùng Gia Bảo", room: "Superior City View - Room 101", time: "16:45 - 18/03/2026", status: "Chờ xác nhận", color: "text-amber-600 bg-amber-50" },
                         { name: "Nguyễn Lê Anh", room: "Deluxe Balcony - Room 302", time: "14:20 - 18/03/2026", status: "Đã cọc", color: "text-blue-600 bg-blue-50" },
                         { name: "Lê Minh Kỳ", room: "Standard Bed - Room 105", time: "11:10 - 18/03/2026", status: "Chờ xử lý", color: "text-gray-600 bg-gray-50" },
                         { name: "Huỳnh Tuyết Vy", room: "Executive Suite - Room 501", time: "09:30 - 18/03/2026", status: "Chờ xác nhận", color: "text-amber-600 bg-amber-50" },
                      ].map((item, i) => (
                         <tr key={i} className="group hover:bg-gray-50 transition-all duration-300">
                            <td className="py-5 px-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-[#003580]/5 text-[#003580] font-black flex items-center justify-center">
                                     {item.name.charAt(0)}
                                  </div>
                                  <span className="text-sm font-black text-[#1a1a1a]">{item.name}</span>
                               </div>
                            </td>
                            <td className="py-5 px-4">
                               <span className="text-sm font-medium text-gray-600">{item.room}</span>
                            </td>
                            <td className="py-5 px-4">
                               <span className="text-xs font-bold text-gray-400 uppercase">{item.time}</span>
                            </td>
                            <td className="py-5 px-4">
                               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${item.color}`}>
                                  {item.status}
                               </span>
                            </td>
                            <td className="py-5 px-4">
                               <button className="p-2 text-gray-400 hover:text-[#003580] transition-colors">
                                  <span className="material-symbols-outlined text-lg">visibility</span>
                               </button>
                            </td>
                         </tr>
                      ))}
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
