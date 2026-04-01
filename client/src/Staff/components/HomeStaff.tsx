import React from "react";
import { Link } from "react-router-dom";
import { useHomeStaff } from "../hooks/useHomeStaff";

// Import các thành phần nghiệp vụ (Smart Sensors)
import CameraModal from "./camera";
import Gps from "./gps";

const HomeStaff: React.FC = () => {
  // Lấy dữ liệu đã được tính toán sẵn từ Hook
  const {
    authUser,
    loading,
    isAttendanceLoading,
    viewData,
    showCameraModal, setShowCameraModal,
    setGpsLocation,
    handleStartCheckIn,
    handleCheckInAction,
    handleCheckOutAction
  } = useHomeStaff();

  const { stats, recentBookings, attendance } = viewData;

  // Cấu hình các thẻ thống kê nhanh (UI Mapping)
  const statCards = [
    { title: "Lượt đặt hôm nay", value: stats.todayBookings.toString(), icon: "calendar_month", color: "bg-emerald-50 text-emerald-600", trend: "Hoạt động cao" },
    { title: "Phòng trống", value: stats.availableRooms.toString(), icon: "bed", color: "bg-blue-50 text-blue-600", trend: "Có sẵn" },
    { title: "Tổng khách hàng", value: stats.customers.toString(), icon: "group", color: "bg-indigo-50 text-indigo-600", trend: "Dữ liệu thực tế" },
    { title: "Chờ xác nhận", value: stats.pending.toString(), icon: "assignment_ind", color: "bg-amber-50 text-amber-600", trend: "Cần xử lý" },
  ];

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen font-sans">
      {/* Sensor định vị chạy ngầm */}
      <Gps onLocationFetched={(loc) => setGpsLocation(loc)} />

      <div className="max-w-[1600px] mx-auto">
        <header className="mb-10 flex justify-between items-start text-left">
          <div className="text-left flex-1">
            <h1 className="text-3xl font-black text-[#003580] tracking-tight">Bảng điều khiển nhân sự</h1>
            
            {/* Vấn đề 2: Hiển thị Ca làm việc hôm nay (Shifts) - Ẩn cho Quản lý */}
            {!['admin', 'hotelOwner', 'staff'].includes(authUser?.role || '') && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">Lịch trình hôm nay</span>
                    {viewData.myShiftToday ? (
                        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border shadow-sm transition-all animate-fade-in ${
                            viewData.myShiftToday.shift_type === 'day' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            viewData.myShiftToday.shift_type === 'night' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                            'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                            <span className="material-symbols-outlined text-sm">
                                {viewData.myShiftToday.shift_type === 'day' ? 'wb_sunny' : 
                                viewData.myShiftToday.shift_type === 'night' ? 'nightlight' : 'calendar_today'}
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
                                Hôm nay: {
                                    viewData.myShiftToday.shift_type === 'day' ? 'Ca Sáng' : 
                                    viewData.myShiftToday.shift_type === 'night' ? 'Ca Tối' : 'Làm Cả Ngày'
                                }
                            </span>
                        </div>
                    ) : (
                        <div className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl flex items-center gap-2 italic">
                            <span className="material-symbols-outlined text-sm">event_busy</span>
                            <span className="text-xs font-bold">Chưa phân ca hôm nay</span>
                        </div>
                    )}
                </div>
            )}
          </div>
          
          <div className="flex gap-4">
            {/* Tắt nút Chấm công cho các vai trò Quản lý */}
            {['admin', 'hotelOwner', 'staff'].includes(authUser?.role || '') ? (
                <div className="px-6 py-4 bg-[#003580] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 border border-white/10 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] animate-pulse">verified_user</span> Management Mode
                </div>
            ) : !attendance.hasCheckedIn ? (
                <button 
                  onClick={handleStartCheckIn} 
                  disabled={loading}
                  className="px-8 py-5 bg-emerald-500 text-white font-black text-sm uppercase tracking-widest rounded-3xl shadow-xl hover:bg-emerald-600 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined font-black">how_to_reg</span> Điểm danh vào ca
                </button>
            ) : !attendance.hasCheckedOut ? (
                <button 
                  onClick={handleCheckOutAction} 
                  disabled={isAttendanceLoading} 
                  className="px-8 py-5 bg-rose-500 text-white font-black text-sm uppercase tracking-widest rounded-3xl shadow-xl hover:bg-rose-600 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined font-black">logout</span> {isAttendanceLoading ? "Đang xử lý..." : "Tan ca (Xả ca)"}
                </button>
            ) : (
                <div className="px-8 py-5 bg-slate-100 text-slate-400 font-black text-sm uppercase tracking-widest rounded-3xl flex items-center gap-2 select-none border border-slate-200 shadow-inner">
                    <span className="material-symbols-outlined font-black">task_alt</span> Hoàn thành công nhật
                </div>
            )}
          </div>
        </header>

        {/* Thiết bị Camera (Tách biệt logic) */}
        <CameraModal 
          isOpen={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onCaptured={handleCheckInAction}
          isLoading={isAttendanceLoading}
        />

        {/* Lưới thống kê */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col items-start group hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 overflow-hidden relative text-left">
              <div className={`w-16 h-16 rounded-3xl ${card.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                 <span className="material-symbols-outlined text-4xl">{card.icon}</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{card.title}</p>
              <h2 className="text-4xl font-black text-[#003580] mb-6 tracking-tighter">{loading ? "..." : card.value}</h2>
              <div className="mt-auto flex items-center gap-3">
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${index === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{card.trend}</span>
                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Data</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bảng hoạt động kinh doanh */}
        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-50">
             <div className="flex justify-between items-center mb-10 text-left">
                <div className="text-left">
                   <h3 className="text-2xl font-black text-[#003580] tracking-tighter uppercase italic">Đơn đặt phòng mới</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Giám sát các yêu cầu từ khách trên toàn hệ thống</p>
                </div>
                <Link to="/staff/bookings" className="px-8 py-3.5 bg-slate-100 text-[#003580] text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all shadow-sm">Xem tất cả đơn</Link>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="border-b-[1px] border-slate-100">
                      <tr>
                         <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Khách hàng / Tên</th>
                         <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Phòng đích</th>
                         <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Trạng thái vận hành</th>
                         <th className="py-6 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Hành động</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {recentBookings.length > 0 ? recentBookings.map((item: any, i: number) => {
                         const statusColor = item?.status === 'pending' ? "text-amber-500 bg-amber-50" : "text-blue-500 bg-blue-50";
                         const statusLabel = item?.status === 'pending' ? "Đang treo" : "Đã kích hoạt";
                         return (
                         <tr key={i} className="group hover:bg-slate-50/50 transition-all duration-500 text-left cursor-default">
                            <td className="py-6 px-4 font-black text-lg text-[#1e293b]">{item?.customerInfo?.name || "Khách Vãng Lai"}</td>
                            <td className="py-6 px-4 text-sm font-bold text-slate-500 uppercase italic tracking-tighter">{item?.details?.[0]?.roomId?.name || "Unassigned"}</td>
                            <td className="py-6 px-4"><span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${statusColor} border border-current/10 shadow-sm`}>{statusLabel}</span></td>
                            <td className="py-6 px-4 text-center">
                               <Link to="/staff/bookings" className="w-12 h-12 inline-flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-[#003580] hover:text-white rounded-2xl transition-all shadow-sm group-hover:scale-110">
                                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </Link>
                            </td>
                         </tr>
                      )}) : (
                          <tr><td colSpan={4} className="py-20 text-center text-sm font-black text-slate-300 uppercase tracking-widest">Không có dữ liệu đơn phòng mới trong ngày.</td></tr>
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
