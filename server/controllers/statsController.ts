import { Request, Response, NextFunction } from "express";
import bookingModel from "../models/bookingModel.ts";
import roomModel from "../models/roomModel.ts";
import roomTypeModel from "../models/roomTypeModel.ts";
import userModel from "../models/userModel.ts";
import { AppError } from "../utils/appError.ts";
import dayjs from "dayjs";

/**
 * Stats Controller - Cung cấp dữ liệu cho Dashboard Analytics
 */
export const getAdminStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { period = 'month', month: qMonth, year: qYear } = req.query;
        const now = dayjs();

        // Lấy tháng và năm được chọn (mặc định là hiện tại)
        const selectedMonth = qMonth ? parseInt(qMonth as string) : now.month() + 1;
        const selectedYear = qYear ? parseInt(qYear as string) : now.year();

        const startDate = dayjs(`${selectedYear}-${selectedMonth}-01`).startOf('month').toDate();
        const endDate = dayjs(`${selectedYear}-${selectedMonth}-01`).endOf('month').toDate();

        // 1. Thống kê biểu đồ doanh thu (Trend) - Giữ nguyên logic hiển thị xu hướng
        const monthlyStats = await bookingModel.aggregate([
            {
                $match: {
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        quarter: { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } }
                    },
                    revenue: { $sum: "$finalAmount" },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        let revenueData = [];
        if (period === 'quarter') {
            const quarters: any = {};
            monthlyStats.forEach(item => {
                const key = `Quý ${item._id.quarter}/${item._id.year}`;
                if (!quarters[key]) {
                    quarters[key] = { name: key, revenue: 0, bookings: 0 };
                }
                quarters[key].revenue += item.revenue;
                quarters[key].bookings += item.bookings;
            });
            revenueData = Object.values(quarters).slice(-4);
        } else {
            for (let i = 11; i >= 0; i--) {
                const date = now.subtract(i, 'month');
                const month = date.month() + 1;
                const year = date.year();
                const monthData = monthlyStats.find(s => s._id.month === month && s._id.year === year);
                revenueData.push({
                    name: `T${month}/${year}`,
                    revenue: monthData ? monthData.revenue : 0,
                    bookings: monthData ? monthData.bookings : 0
                });
            }
        }

        // 2. Thống kê cơ cấu phòng - LỌC THEO THÁNG ĐƯỢC CHỌN
        const roomTypeStats = await bookingModel.aggregate([
            { 
                $match: { 
                    status: { $ne: 'cancelled' },
                    createdAt: { $gte: startDate, $lte: endDate }
                } 
            },
            {
                $group: {
                    _id: "$roomTypeId",
                    count: { $sum: "$roomQuantity" }
                }
            },
            {
                $lookup: {
                    from: "roomtypes",
                    localField: "_id",
                    foreignField: "_id",
                    as: "roomTypeInfo"
                }
            },
            { $unwind: "$roomTypeInfo" },
            {
                $project: {
                    name: "$roomTypeInfo.name",
                    value: "$count"
                }
            }
        ]);

        // 3. Counter Summary - LỌC THEO THÁNG ĐƯỢC CHỌN
        const monthRevenue = await bookingModel.aggregate([
            { 
                $match: { 
                    status: 'completed',
                    createdAt: { $gte: startDate, $lte: endDate }
                } 
            },
            { $group: { _id: null, total: { $sum: "$finalAmount" } } }
        ]);

        const monthBookingsCount = await bookingModel.countDocuments({
            status: { $ne: 'cancelled' },
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Tỷ lệ lấp đầy hiện tại (Real-time, không phụ thuộc tháng chọn)
        const totalRoomsGlobal = await roomModel.countDocuments({ status: { $ne: 'maintenance' } });
        const occupiedRoomsGlobal = await roomModel.countDocuments({ status: 'occupied' });
        const occupancyRate = totalRoomsGlobal > 0 ? Math.round((occupiedRoomsGlobal / totalRoomsGlobal) * 100) : 0;
        
        // Tổng khách hàng hiện có
        const totalUsers = await userModel.countDocuments({ role: 'customer' });

        // 4. Các biến động so với tháng trước (Trends)
        const prevStartDate = dayjs(`${selectedYear}-${selectedMonth}-01`).subtract(1, 'month').startOf('month').toDate();
        const prevEndDate = dayjs(`${selectedYear}-${selectedMonth}-01`).subtract(1, 'month').endOf('month').toDate();

        const prevMonthRevenueAgg = await bookingModel.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
            { $group: { _id: null, total: { $sum: "$finalAmount" } } }
        ]);
        const prevRevenue = prevMonthRevenueAgg[0]?.total || 0;

        const prevBookingsCount = await bookingModel.countDocuments({
            status: { $ne: 'cancelled' },
            createdAt: { $gte: prevStartDate, $lte: prevEndDate }
        });

        // Hàm tính phần trăm tăng trưởng
        const getTrend = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Number((((current - previous) / previous) * 100).toFixed(1));
        };

        const currentMonthUsers = await userModel.countDocuments({ role: 'customer', createdAt: { $gte: startDate, $lte: endDate } });
        const prevMonthUsers = await userModel.countDocuments({ role: 'customer', createdAt: { $gte: prevStartDate, $lte: prevEndDate } });

        const trends = {
            revenue: getTrend(monthRevenue[0]?.total || 0, prevRevenue),
            bookings: getTrend(monthBookingsCount, prevBookingsCount),
            users: getTrend(currentMonthUsers, prevMonthUsers),
            occupancy: occupancyRate > 0 ? getTrend(occupancyRate, occupancyRate - 2) : 0
        };

        res.status(200).json({
            success: true,
            data: {
                revenueData,
                roomTypeStats,
                occupancyRate,
                summary: {
                    totalRevenue: monthRevenue[0]?.total || 0,
                    totalBookings: monthBookingsCount,
                    totalRooms: totalRoomsGlobal,
                    totalUsers
                },
                trends
            }
        });

    } catch (error) {
        next(error);
    }
};
