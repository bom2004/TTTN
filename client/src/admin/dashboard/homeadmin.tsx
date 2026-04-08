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
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReportPDF from "../../utils/ReportPDF";

// Redux
import { useAppDispatch, useAppSelector } from "../../lib/redux/store";
import { fetchAdminStatsThunk, selectStatsData, selectStatsLoading } from "../../lib/redux/reducers/stats";

// Colors for Pie Chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

  useEffect(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    dispatch(fetchAdminStatsThunk({ period: viewMode, month, year }));
  }, [dispatch, viewMode, selectedMonth]);

  if (loading && !data) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-[1600px] mx-auto space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Tổng doanh thu",
      value: `${new Intl.NumberFormat('vi-VN').format(data?.summary.totalRevenue || 0)}₫`,
      icon: <DollarSign className="w-5 h-5 text-blue-600" />,
      trend: "Tháng này",
      bgColor: "bg-blue-50"
    },
    {
      title: "Tổng lượt đặt",
      value: data?.summary.totalBookings.toString() || "0",
      icon: <Calendar className="w-5 h-5 text-emerald-600" />,
      trend: "Tháng này",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Tỷ lệ lấp đầy",
      value: `${data?.occupancyRate || 0}%`,
      icon: <Activity className="w-5 h-5 text-amber-600" />,
      trend: "Hiện tại",
      bgColor: "bg-amber-50"
    },
    {
      title: "Tổng số phòng",
      value: data?.summary.totalRooms.toString() || "0",
      icon: <Bed className="w-5 h-5 text-purple-600" />,
      trend: "Hoạt động",
      bgColor: "bg-purple-50"
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Quản trị</h1>
            <p className="text-gray-500 mt-1 font-medium">Theo dõi hiệu quả kinh doanh của khách sạn theo từng tháng.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <Filter className="w-4 h-4 text-gray-400" />
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-sm font-semibold text-gray-700 focus:outline-none bg-transparent cursor-pointer"
              />
            </div>
            {data && (
              <PDFDownloadLink 
                document={<ReportPDF data={data.revenueData} title="Báo cáo Doanh thu Khách sạn" summary={data.summary} />} 
                fileName={`Bao_cao_doanh_thu_${selectedMonth}.pdf`}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 rounded-lg text-sm font-semibold text-white hover:bg-rose-700 transition-all shadow-sm shadow-rose-200"
              >
                {({ loading }) => (loading ? 'Đang tạo PDF...' : <><Download className="w-4 h-4" /> Xuất PDF</>)}
              </PDFDownloadLink>
            )}
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {card.trend}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-400 mb-1">{card.title}</p>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {card.value}
              </h2>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Biểu đồ doanh thu</h3>
                <p className="text-sm text-gray-500 font-medium">{viewMode === 'month' ? 'Thống kê theo 12 tháng gần nhất' : 'Thống kê theo các quý gần nhất'}</p>
              </div>
              <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-lg border border-gray-100">
                <button 
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Tháng
                </button>
                <button 
                  onClick={() => setViewMode('quarter')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'quarter' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Quý
                </button>
              </div>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 500}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 500}}
                    tickFormatter={(value) => `${value/1000000}M`}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: any) => [`${new Intl.NumberFormat('vi-VN').format(value)}₫`, 'Doanh thu']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Room Type Distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900">Cơ cấu loại phòng</h3>
              <p className="text-sm text-gray-500 font-medium">Tỷ lệ đặt phòng theo hạng phòng</p>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.roomTypeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data?.roomTypeStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Hoạt động nhanh</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/owner/rooms')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group text-left"
                >
                  <span className="text-sm font-semibold text-gray-700">Xem tất cả phòng</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/owner/promotions')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group text-left"
                >
                  <span className="text-sm font-semibold text-gray-700">Cấu hình khuyến mãi</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
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