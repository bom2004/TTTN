import { Request, Response } from "express";
import roomTypeModel from "../models/roomTypeModel.ts";
import imagekit from "../config/imagekit.ts";

// @desc    Add a new room type
// @route   POST /api/room-types
// @access  Admin / hotelOwner
export const addRoomType = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, basePrice } = req.body;

        if (!name || !basePrice) {
            res.status(400).json({ success: false, message: "Missing required fields: name, basePrice" });
            return;
        }

        const exists = await roomTypeModel.findOne({ name: name.trim() });
        if (exists) {
            res.status(400).json({ success: false, message: "Room type already exists" });
            return;
        }

        let imageUrl = "";
        if (req.file) {
            const uploadResponse = await imagekit.upload({
                file: req.file.buffer.toString("base64"),
                fileName: `roomtype_${Date.now()}`,
                folder: "/room_types",
            });
            imageUrl = uploadResponse.url;
        }

        const newRoomType = new roomTypeModel({
            name: name.trim(),
            description,
            basePrice,
            image: imageUrl
        });

        await newRoomType.save();
        res.status(201).json({ success: true, message: "Room type added successfully", data: newRoomType });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Get all room types
// @route   GET /api/room-types
// @access  Public
export const getAllRoomTypes = async (req: Request, res: Response): Promise<void> => {
    try {
        const isAdmin = req.query.admin === 'true';
        const filter = isAdmin ? {} : { isActive: true };
        const roomTypes = await roomTypeModel.find(filter);
        res.json({ success: true, data: roomTypes });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Update room type
// @route   PUT /api/room-types/:id
// @access  Admin / hotelOwner
export const updateRoomType = async (req: Request, res: Response): Promise<void> => {
    try {
        const updateData: Record<string, any> = { ...req.body };

        if (req.file) {
            const uploadResponse = await imagekit.upload({
                file: req.file.buffer.toString("base64"),
                fileName: `roomtype_update_${Date.now()}`,
                folder: "/room_types",
            });
            updateData.image = uploadResponse.url;
        }

        const updated = await roomTypeModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updated) {
            res.status(404).json({ success: false, message: "Room type not found" });
            return;
        }

        res.json({ success: true, message: "Room type updated successfully", data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Delete room type (Soft delete recommended, here is permanent)
// @route   DELETE /api/room-types/:id
// @access  Admin
export const deleteRoomType = async (req: Request, res: Response): Promise<void> => {
    try {
        const deleted = await roomTypeModel.findByIdAndDelete(req.params.id);
        if (!deleted) {
            res.status(404).json({ success: false, message: "Room type not found" });
            return;
        }
        res.json({ success: true, message: "Room type deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};
