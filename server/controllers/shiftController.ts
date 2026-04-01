import { Request, Response } from 'express';
import { getShiftsByMonthService, saveDailyShiftsService } from '../services/shiftService';

/**
 * Controller xử lý lấy danh sách ca làm việc theo tháng
 */
export const getShiftsByMonth = async (req: Request, res: Response) => {
    try {
        const { year, month } = req.query;
        
        if (!year || !month) {
            return res.status(400).json({ message: "Thiếu thông tin năm và tháng" });
        }

        const shifts = await getShiftsByMonthService(Number(year), Number(month));
        res.status(200).json(shifts);
    } catch (error) {
        console.error("Lỗi lấy danh sách ca:", error);
        res.status(500).json({ message: "Lỗi Server nội bộ" });
    }
};

/**
 * Controller xử lý lưu/cập nhật phân ca cho một ngày
 */
export const saveDailyShifts = async (req: Request, res: Response) => {
    try {
        const { date, day_shift_user_ids, night_shift_user_ids, full_day_shift_user_ids } = req.body;

        if (!date) {
            return res.status(400).json({ message: "Thiếu thông tin ngày" });
        }

        await saveDailyShiftsService(date, day_shift_user_ids, night_shift_user_ids, full_day_shift_user_ids);

        res.status(200).json({ message: "Lưu phân ca thành công!" });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Lỗi trùng lặp nhân sự trong một ngày!" });
        }
        console.error("Lỗi lưu phân ca:", error);
        res.status(500).json({ message: "Lỗi Server khi lưu phân ca" });
    }
};
