import { Request, Response } from 'express';
import deepseek from '../config/deepseek';
import roomTypeModel, { IRoomType } from '../models/roomTypeModel';
import roomModel from '../models/roomModel';
import bookingModel from '../models/bookingModel';
import promotionModel from '../models/promotionModel';
import serviceModel from '../models/servicebooking/serviceModel';
import { extractDatesFromPrompt, buildAIContext } from '../utils/chatUtils';

/**
 * Controller chính xử lý hội thoại AI
 */
export const askAI = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "No prompt provided" });

        // 1. Chuẩn bị dữ liệu nền
        const roomTypes = await roomTypeModel.find({ isActive: true }) as IRoomType[];
        const rooms = await roomModel.find();
        const { targetStart, targetEnd } = extractDatesFromPrompt(prompt);

        const activeBookings = await bookingModel.find({
            status: { $in: ['pending', 'confirmed', 'checked_in'] },
            checkInDate: { $lt: targetEnd },
            checkOutDate: { $gt: targetStart }
        });

        // Lấy thêm dữ liệu khuyến mãi và dịch vụ hiện có
        const promotions = await promotionModel.find({ status: 'active' });
        const services = await serviceModel.find({ isAvailable: true }).populate('categoryId', 'name');

        // 2. Gọi AI
        const context = buildAIContext(roomTypes, rooms, activeBookings, targetStart, targetEnd, promotions, services);
        let result = await deepseek(prompt, context);

        res.status(200).json({ success: true, message: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
