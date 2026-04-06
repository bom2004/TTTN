import { Request, Response, NextFunction } from "express";
import bookingModel from "../models/bookingModel.ts";
import roomModel from "../models/roomModel.ts";
import roomTypeModel from "../models/roomTypeModel.ts";
import { AppError } from "../utils/appError.ts";
import dayjs from "dayjs";

/**
 * Stats Controller - Cung cấp dữ liệu cho Dashboard Analytics
 */
export const getAdminStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { period = 'month' } = req.query;
        const now = dayjs();

        // 1. Thống kê doanh thu và số lượng đơn đặt
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

        // Chuẩn hóa dữ liệu dựa trên period
        let revenueData = [];
        if (period === 'quarter') {
            // Nhóm lại theo quý
            const quarters: any = {};
            monthlyStats.forEach(item => {
                const key = `Quý ${item._id.quarter}/${item._id.year}`;
                if (!quarters[key]) {
                    quarters[key] = { name: key, revenue: 0, bookings: 0 };
                }
                quarters[key].revenue += item.revenue;
                quarters[key].bookings += item.bookings;
            });
            revenueData = Object.values(quarters).slice(-4); // Lấy 4 quý gần nhất
        } else {
            // Mặc định hiển thị 12 tháng gần nhất (Rolling 12 months)
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

        // 2. Thống kê mức độ phổ biến của loại phòng
        const roomTypeStats = await bookingModel.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: "$roomTypeId",
                    count: { $sum: "$roomQuantity" }
                }
            },
            {
                $lookup: {
                    from: "roomtypes", // Tên collection trong DB (thường là số nhiều)
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

        // 3. Tính tỷ lệ lấp đầy phòng hiện tại (Occupancy Rate)
        const totalRooms = await roomModel.countDocuments({ status: { $ne: 'maintenance' } });
        const occupiedRooms = await roomModel.countDocuments({ status: 'occupied' });
        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

        // 4. Tổng quan (Counters)
        const totalRevenue = await bookingModel.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$finalAmount" } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                revenueData,
                roomTypeStats,
                occupancyRate,
                summary: {
                    totalRevenue: totalRevenue[0]?.total || 0,
                    totalBookings: await bookingModel.countDocuments({ status: { $ne: 'cancelled' } }),
                    activePromotions: 0, // Placeholder
                    totalRooms
                }
            }
        });

    } catch (error) {
        next(error);
    }
};
