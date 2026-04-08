import cron from 'node-cron';
import bookingModel from '../models/bookingModel.ts';
import { emitToAll } from '../socket.ts';

/**
 * Task: Tự động dọn dẹp các đơn đặt phòng "Ảo" (Ghost Bookings)
 * Chạy 10 phút một lần
 */
export const initBookingCleanupTask = () => {
    // Chạy mỗi 10 phút: '*/10 * * * *'
    cron.schedule('*/10 * * * *', async () => {
        console.log('--- Đang chạy dọn dẹp đơn đặt phòng ảo (Pending & Unpaid) ---');
        
        try {
            // Định nghĩa thời gian hết hạn: 15-30 phút (tùy cấu hình, ở đây dùng 30p cho an toàn)
            const expirationLimit = new Date();
            expirationLimit.setMinutes(expirationLimit.getMinutes() - 15);

            // Tìm các đơn: 
            // 1. Trạng thái 'pending'
            // 2. Chưa thanh toán 'unpaid'
            // 3. Phương thức online (VNPay, Wallet...)
            // 4. Quá thời gian quy định
            const ghostBookings = await bookingModel.find({
                status: 'pending',
                paymentStatus: 'unpaid',
                paymentMethod: 'vnpay',
                createdAt: { $lt: expirationLimit }
            });

            if (ghostBookings.length > 0) {
                console.log(`Tìm thấy ${ghostBookings.length} đơn đặt phòng ảo hết hạn. Đang thực hiện hủy...`);

                for (const booking of ghostBookings) {
                    booking.status = 'cancelled';
                    // Ghi chú lý do hủy tự động (nếu có trường để ghi)
                    // Ở đây ta có thể truyền thêm thông tin vào socket
                    await booking.save();
                    
                    // Thông báo real-time để cập nhật số lượng phòng trống trên giao diện người dùng khác
                    emitToAll('booking_cancelled', { 
                        _id: booking._id, 
                        message: "Đơn đặt phòng tự động hủy do hết hạn thanh toán",
                        isAutoCancel: true 
                    });

                    console.log(`Hủy thành công đơn: ${booking._id}`);
                }
            } else {
                console.log('Không tìm thấy đơn hết hạn nào.');
            }

        } catch (error) {
            console.error('Lỗi khi thực hiện dọn dẹp đơn đặt phòng:', error);
        }
    });

    console.log('Cron Job: Hệ thống dọn dẹp đơn hàng ảo đã được kích hoạt (Chạy 10p/lần)');
};
