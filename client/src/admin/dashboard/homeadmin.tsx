import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
  Bed, Calendar,
  DollarSign,
  Download, Filter, ChevronRight, Activity
} from "lucide-react";
import Skeleton from "../../utils/Skeleton";
import { exportRevenueReport } from "../../utils/exportToExcel";
import { pdf } from '@react-pdf/renderer';
import ReportPDF from "../../utils/ReportPDF";

// Redux
import { useAppDispatch, useAppSelector } from "../../lib/redux/store";
import { fetchAdminStatsThunk, selectStatsData, selectStatsLoading } from "../../lib/redux/reducers/stats";

// Colors for Pie Chart
const COLORS = ['#0050d4', '#8e3a8a', '#4e5c71', '#fe9cf4', '#7b9cff', '#d5e3fc'];

const HomeAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const data = useAppSelector(selectStatsData);
  const loading = useAppSelector(selectStatsLoading);
  const [viewMode, setViewMode] = useState<'month' | 'quarter'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

  const handleExportExcel = () => {
    if (data?.revenueData) {
      exportRevenueReport(data.revenueData);
    }
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (!data) return;
    try {
      setIsExportingPDF(true);
      const doc = <ReportPDF data={data.revenueData} title="Báo cáo Doanh thu Khách sạn" summary={data.summary} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bao_cao_doanh_thu_${selectedMonth}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      console.error("Lỗi khi xuất PDF:", error);
      alert("Lỗi xuất PDF: " + (error?.message || "Không xác định"));
    } finally {
      setIsExportingPDF(false);
    }
  };

  useEffect(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    dispatch(fetchAdminStatsThunk({ period: viewMode, month, year }));
  }, [dispatch, viewMode, selectedMonth]);

  if (loading && !data) {
    return (
      <div className="p-6 bg-[#f5f7f9] min-h-screen">
        <div className="max-w-[1600px] mx-auto space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="lg:col-span-2 h-[400px] rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const renderTrendString = (val: number | undefined) => {
    if (val === undefined || val === null) return "0%";
    if (val > 0) return `+${val}%`;
    return `${val}%`;
  };

  const statCards = [
    {
      title: "Tổng doanh thu",
      value: `${new Intl.NumberFormat('vi-VN').format(data?.summary.totalRevenue || 0)}₫`,
      icon: <DollarSign className="w-5 h-5 text-[#0050d4]" />,
      trendValue: data?.trends?.revenue || 0,
      bgColor: "bg-[#7b9cff]/10",
      iconBg: "bg-[#7b9cff]/20"
    },
    {
      title: "Đặt phòng mới",
      value: data?.summary.totalBookings.toString() || "0",
      icon: <Calendar className="w-5 h-5 text-[#8e3a8a]" />,
      trendValue: data?.trends?.bookings || 0,
      bgColor: "bg-[#fe9cf4]/20",
      iconBg: "bg-[#fe9cf4]/30"
    },
    {
      title: "Tổng khách hàng",
      value: new Intl.NumberFormat('vi-VN').format(data?.summary.totalUsers || 0),
      icon: <Activity className="w-5 h-5 text-[#4e5c71]" />,
      trendValue: data?.trends?.users || 0,
      bgColor: "bg-[#4e5c71]/10",
      iconBg: "bg-[#4e5c71]/20"
    },
    {
      title: "Tỷ lệ lấp đầy",
      value: `${data?.occupancyRate || 0}%`,
      icon: <Bed className="w-5 h-5 text-[#0050d4]" />,
      trendValue: data?.trends?.occupancy || 0,
      bgColor: "bg-[#0050d4]/10",
      iconBg: "bg-[#0050d4]/20"
    },
  ];

  return (
    <div className="p-8 bg-[#f5f7f9] min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#2c2f31] tracking-tight font-['Manrope',sans-serif]">Tổng quan hệ thống</h1>
            <p className="text-[#595c5e] mt-1 font-medium font-['Inter',sans-serif]">Theo dõi hiệu suất kinh doanh của khách sạn trong thời gian thực.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm border border-[#d9dde0]">
              <Filter className="w-4 h-4 text-[#747779]" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-sm font-semibold text-[#2c2f31] focus:outline-none bg-transparent cursor-pointer font-['Inter',sans-serif]"
              />
            </div>
            {data && (
              <button
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className={`flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#0050d4] to-[#0046bb] rounded-xl text-sm font-bold text-white transition-all shadow-md ${isExportingPDF ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg active:scale-95'}`}
              >
                {isExportingPDF ? 'Đang tạo PDF...' : <><Download className="w-4 h-4" /> Xuất PDF</>}
              </button>
            )}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-6 py-2 bg-white border border-[#d9dde0] rounded-xl text-sm font-bold text-[#4e5c71] hover:bg-[#eef1f3] transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
        </div>

        {/* Stats Grid - Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border-0 relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#0050d4]/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div className={`${card.iconBg} p-3 rounded-xl`}>
                  {card.icon}
                </div>
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${card.trendValue < 0 ? "text-red-600 bg-red-50" : card.trendValue > 0 ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-50"}`}>
                  {renderTrendString(card.trendValue)}
                  {card.trendValue > 0 && (
                    <span className="material-symbols-outlined text-sm ml-0.5" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>trending_up</span>
                  )}
                  {card.trendValue < 0 && (
                    <span className="material-symbols-outlined text-sm ml-0.5" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>trending_down</span>
                  )}
                  {card.trendValue === 0 && (
                    <span className="material-symbols-outlined text-sm ml-0.5" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>remove</span>
                  )}
                </span>
              </div>
              <p className="text-sm font-medium text-[#747779] font-['Inter',sans-serif]">{card.title}</p>
              <h3 className="text-2xl font-extrabold mt-1 text-[#2c2f31] font-['Manrope',sans-serif] tracking-tight">{card.value}</h3>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border-0">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-bold text-[#2c2f31] font-['Manrope',sans-serif]">Biểu đồ doanh thu</h3>
                <p className="text-sm text-[#595c5e] font-medium font-['Inter',sans-serif]">{viewMode === 'month' ? 'Thống kê theo 12 tháng gần nhất' : 'Thống kê theo các quý gần nhất'}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#0050d4] rounded-full"></span>
                  <span className="text-xs font-semibold text-[#595c5e] font-['Inter',sans-serif]">Doanh thu</span>
                </div>
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0050d4" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0050d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9eb" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#747779', fontSize: 12, fontWeight: 500, fontFamily: 'Inter' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#747779', fontSize: 12, fontWeight: 500, fontFamily: 'Inter' }}
                    tickFormatter={(value) => `${value / 1000000}M`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'Inter' }}
                    formatter={(value: any) => [`${new Intl.NumberFormat('vi-VN').format(value)}₫`, 'Doanh thu']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0050d4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Room Type Distribution */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border-0">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#2c2f31] font-['Manrope',sans-serif]">Cơ cấu loại phòng</h3>
              <p className="text-sm text-[#595c5e] font-medium font-['Inter',sans-serif]">Tỷ lệ đặt phòng theo hạng phòng</p>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.roomTypeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data?.roomTypeStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'Inter' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs font-medium text-[#595c5e]">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 pt-6 border-t border-[#e5e9eb]">
              <h4 className="text-sm font-bold text-[#2c2f31] mb-4 font-['Manrope',sans-serif]">Gợi ý từ hệ thống</h4>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/owner/rooms')}
                  className="w-full flex items-center justify-between p-4 bg-[#eef1f3] rounded-xl hover:bg-[#e5e9eb] transition-colors group text-left"
                >
                  <div className="flex gap-3 items-start">
                    <div className="p-2 bg-[#7b9cff]/20 text-[#0050d4] rounded-lg">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}>meeting_room</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#2c2f31]">Xem tất cả phòng</p>
                      <p className="text-xs text-[#595c5e] mt-0.5">Quản lý trạng thái phòng</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#747779] group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/owner/promotions')}
                  className="w-full flex items-center justify-between p-4 bg-[#eef1f3] rounded-xl hover:bg-[#e5e9eb] transition-colors group text-left"
                >
                  <div className="flex gap-3 items-start">
                    <div className="p-2 bg-[#fe9cf4]/30 text-[#8e3a8a] rounded-lg">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}>sell</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#2c2f31]">Cấu hình khuyến mãi</p>
                      <p className="text-xs text-[#595c5e] mt-0.5">Tạo mã giảm giá hấp dẫn</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#747779] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAdmin; 