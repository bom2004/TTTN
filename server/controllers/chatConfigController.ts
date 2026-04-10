import { Request, Response } from 'express';
import ChatConfig from '../models/chatConfigModel';
import Booking from '../models/bookingModel';

// --- CHAT CONFIG ---
export const getChatConfig = async (req: Request, res: Response) => {
    try {
        let config = await ChatConfig.findOne();
        if (!config) {
            config = await ChatConfig.create({});
        }
        res.status(200).json(config);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateChatConfig = async (req: Request, res: Response) => {
    try {
        const { botName, primaryColor, welcomeMessage, isActive } = req.body;
        let config = await ChatConfig.findOne();
        if (!config) {
            config = new ChatConfig();
        }

        config.botName = botName || config.botName;
        config.primaryColor = primaryColor || config.primaryColor;
        config.welcomeMessage = welcomeMessage || config.welcomeMessage;
        if (isActive !== undefined) config.isActive = isActive;

        await config.save();
        res.status(200).json(config);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- STATS ---
export const getChatbotStats = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;

        // Thống kê All-Time
        const allTimeStats = await Booking.aggregate([
            { $match: { source: 'chatbot', status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: "$finalAmount" }
                }
            }
        ]);

        const allTime = allTimeStats.length > 0 ? allTimeStats[0] : { totalBookings: 0, totalRevenue: 0 };

        // Thống kê theo giai đoạn được chọn (mặc định tháng hiện tại)
        const selectedMonth = month ? parseInt(month as string) - 1 : new Date().getMonth();
        const selectedYear = year ? parseInt(year as string) : new Date().getFullYear();

        const startDate = new Date(selectedYear, selectedMonth, 1);
        const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

        const periodStats = await Booking.aggregate([
            {
                $match: {
                    source: 'chatbot',
                    status: 'completed',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: "$finalAmount" }
                }
            }
        ]);

        res.status(200).json({
            allTime,
            period: periodStats.length > 0 ? periodStats[0] : { totalBookings: 0, totalRevenue: 0 },
            selectedPeriod: { month: selectedMonth + 1, year: selectedYear }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
