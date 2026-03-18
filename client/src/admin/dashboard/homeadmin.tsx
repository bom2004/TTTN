import React, { useState, useEffect } from "react";
import axios from "axios";
import { assets } from "../../assets/assets";
import { ApiResponse } from "../../types";

interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  totalRooms: number;
}

const HomeAdmin: React.FC = () => {
  const backendUrl = "http://localhost:3000";
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalBookings: 0,
    totalUsers: 0,
    totalRooms: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        // Placeholder for real statistics API
        // For now, we'll fetch actual counts from existing APIs if available
        const [usersRes, roomsRes] = await Promise.all([
          axios.get<ApiResponse<any[]>>(`${backendUrl}/api/user/all-users`),
          axios.get<ApiResponse<any[]>>(`${backendUrl}/api/rooms`)
        ]);

        setStats({
          totalRevenue: 25480000, // Dummy
          totalBookings: 142, // Dummy
          totalUsers: usersRes.data.success ? (usersRes.data.users?.length || 0) : 0,
          totalRooms: roomsRes.data.success ? (roomsRes.data.data?.length || 0) : 0,
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
      title: "Tổng doanh thu", 
      value: `${new Intl.NumberFormat('vi-VN').format(stats.totalRevenue)}đ`, 
      icon: assets.totalRevenueIcon, 
      color: "bg-emerald-50 text-emerald-600",
      trend: "+12.5% so với tháng trước"
    },
    { 
      title: "Tổng lượt đặt", 
      value: stats.totalBookings.toString(), 
      icon: assets.totalBookingIcon, 
      color: "bg-blue-50 text-blue-600",
      trend: "+8.2% so với tháng trước"
    },
    { 
      title: "Khách hàng", 
      value: stats.totalUsers.toString(), 
      icon: assets.userIcon, 
      color: "bg-indigo-50 text-indigo-600",
      trend: "+5.1% so với tháng trước"
    },
    { 
      title: "Tổng số phòng", 
      value: stats.totalRooms.toString(), 
      icon: assets.homeIcon, 
      color: "bg-amber-50 text-amber-600",
      trend: "Ổn định"
    },
  ];

  return (
    <div className="p-8 bg-[#f5f5f5] min-h-screen font-sans">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-[900] text-[#003580] tracking-tight">Bảng điều khiển</h1>
          <p className="text-sm font-medium text-gray-500">Chào mừng trở lại! Dưới đây là tóm tắt hoạt động kinh doanh của bạn.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-start group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#003580]/[0.02] rounded-full -mr-8 -mt-8 group-hover:bg-[#003580]/[0.05] transition-colors"></div>
              <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                 <span className="material-symbols-outlined text-3xl">
                    {index === 0 ? 'payments' : index === 1 ? 'calendar_month' : index === 2 ? 'group' : 'bed'}
                 </span>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{card.title}</p>
              <h2 className="text-3xl font-black text-[#003580] mb-4 tracking-tight">{loading ? "..." : card.value}</h2>
              <div className="mt-auto flex items-center gap-2">
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${card.trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                    {card.trend.split(' ')[0]}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">so với tháng trước</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts & Table Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Placeholder */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-xl font-black text-[#003580] tracking-tight">Xu hướng doanh thu</h3>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Dữ liệu 7 ngày gần nhất</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-50 text-[#003580] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all">Tuần</button>
                    <button className="px-4 py-2 bg-[#003580] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md">Tháng</button>
                </div>
             </div>
             
             {/* Simple SVG Chart Representation */}
             <div className="h-64 w-full relative flex items-end justify-between px-4 pb-8 border-b border-gray-50">
                {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                    <div key={i} className="w-12 bg-[#003580]/10 rounded-t-xl relative group cursor-pointer" style={{ height: `${h}%` }}>
                        <div className="absolute inset-0 bg-[#003580] scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom rounded-t-xl duration-500 shadow-lg shadow-blue-500/20"></div>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-400">T{i+2}</div>
                    </div>
                ))}
             </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
             <h3 className="text-xl font-black text-[#003580] tracking-tight mb-8">Yêu cầu đặt phòng mới</h3>
             <div className="space-y-6">
                {[
                    { name: "Trần Anh Tuấn", room: "101", time: "5 phút trước", avatar: "T" },
                    { name: "Lê Thị Hồng", room: "305", time: "2 giờ trước", avatar: "H" },
                    { name: "Nguyễn Minh", room: "202", time: "5 giờ trước", avatar: "M" },
                    { name: "Hoàng Long", room: "108", time: "1 ngày trước", avatar: "L" },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-[#003580]/5 text-[#003580] font-black flex items-center justify-center group-hover:bg-[#003580] group-hover:text-white transition-all duration-300">
                            {item.avatar}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-gray-900 line-clamp-1">{item.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phòng {item.room} · {item.time}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-[#006ce4] mb-4"></div>
                    </div>
                ))}
             </div>
             <button className="w-full mt-10 py-4 bg-gray-50 text-[#003580] rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#003580] hover:text-white transition-all shadow-sm">
                Xem tất cả đơn đặt
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAdmin;
