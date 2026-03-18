import { Request, Response } from "express";
import roomModel from "../models/roomModel.ts";
import roomTypeModel from "../models/roomTypeModel.ts";
import promotionModel from "../models/promotionModel.ts";

// @desc    Global search across rooms, room types, and promotions
// @route   GET /api/search
export const globalSearch = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = req.query;

        if (!query || typeof query !== 'string') {
            res.json({ 
                success: true, 
                data: {
                    rooms: [],
                    roomTypes: [],
                    promotions: []
                } 
            });
            return;
        }

        const searchQuery = String(query);

        // 1. Search Rooms (by name, description, roomType)
        const rooms = await roomModel.find({
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { roomType: { $regex: searchQuery, $options: 'i' } }
            ]
        });


        // 2. Search Room Types (by name, description)
        const roomTypes = await roomTypeModel.find({
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ]
        });

        // 3. Search Promotions (by code, title, description)
        const promotions = await promotionModel.find({
            $or: [
                { code: { $regex: searchQuery, $options: 'i' } },
                { title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ],
            status: 'active'
        });

        res.json({
            success: true,
            data: {
                rooms,
                roomTypes,
                promotions
            }
        });

    } catch (error) {
        console.error("Global Search Error:", error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};
