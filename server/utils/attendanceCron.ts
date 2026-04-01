import cron from 'node-cron';
import ShiftSchedule from '../models/shiftModel.ts';
import attendanceModel from '../models/attendanceModel.ts';

/**
 * Automate the "Absent" status recording
 * Quét toàn bộ lịch phân ca vào cuối ngày (23:55).
 * Nếu có lịch mà không có chấm công -> Tự động đánh vắng.
 */
export const initAttendanceCron = () => {
    // Chạy vào 23:55 mỗi đêm
    cron.schedule('55 23 * * *', async () => {
        console.log('--- [CRON] Bắt đầu quét vắng mặt ngày hôm nay ---');
        
        try {
            const now = new Date();
            // Thiết lập dải thời gian của ngày hôm nay (0h00 - 23h59)
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));
            
            const todayStr = now.toISOString().split('T')[0];

            // 1. Tìm tất cả lịch trực (Shifts) của ngày hôm nay
            const shiftsToday = await ShiftSchedule.find({
                date: { $gte: startOfDay, $lte: endOfDay }
            });

            console.log(`[CRON] Tìm thấy ${shiftsToday.length} ca trực cần kiểm tra.`);

            let absentCount = 0;

            for (const shift of shiftsToday) {
                const userId = shift.user_id;

                // 2. Kiểm tra xem nhân viên này đã có bản ghi chấm công cho ngày hôm nay chưa
                const attendance = await attendanceModel.findOne({
                    user_id: userId,
                    date: todayStr
                });

                // 3. Nếu không có bản ghi nào (Cả Check-in cũng không có)
                if (!attendance) {
                    await attendanceModel.create({
                        user_id: userId,
                        date: todayStr,
                        status: 'absent',
                        note: `Hệ thống tự động chốt vắng mặt (Nhân viên không điểm danh ca ${shift.shift_type})`,
                        total_hours: 0
                    });
                    absentCount++;
                } 
                // 4. Nếu có bản ghi nhưng status vẫn là 'incomplete' (Quên check-out)
                else if (attendance.status === 'incomplete' && !attendance.check_out_time) {
                    attendance.status = 'absent';
                    attendance.note = 'Quên Check-out: Hệ thống tự động đánh vắng để đảm bảo kỷ luật.';
                    attendance.total_hours = 0;
                    await attendance.save();
                    absentCount++;
                }
            }

            console.log(`--- [CRON] Hoàn tất. Đã chốt vắng cho ${absentCount} trường hợp. ---`);
            
        } catch (error) {
            console.error('[CRON ERROR] Lỗi khi quét vắng mặt:', error);
        }
    });

    console.log('✅ Hệ thống Cron Job Chấm công đã được kích hoạt (23:55 hàng ngày)');
};
