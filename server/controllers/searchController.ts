import { Request, Response } from "express";
import { performGlobalSearch } from "../services/searchService.ts";

/**
 * Controller: Tìm kiếm toàn cầu trên toàn bộ Phòng, Loại phòng và Khuyến mãi
 * @route   GET /api/search
 */
export const globalSearch = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = req.query;

        // Nếu không có query, trả về mảng rỗng ngay lập tức
        if (!query || typeof query !== 'string') {
            res.json({ 
                success: true, 
                data: { rooms: [], roomTypes: [], promotions: [] } 
            });
            return;
        }

        // Gọi Service thực hiện tìm kiếm toàn cục
        const searchResults = await performGlobalSearch(query);

        res.json({
            success: true,
            data: searchResults
        });

    } catch (error) {
        console.error("Global Search Error:", error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};
