import { formatDateVN } from "./bookingUtils.ts";

/**
 * Template: Email xác nhận đặt phòng và số phòng cụ thể
 */
export const getBookingConfirmationTemplate = (booking: any, roomNumbers: string) => {
    const checkInStr = formatDateVN(booking.checkInDate);
    const checkOutStr = formatDateVN(booking.checkOutDate);
    const finalAmountStr = booking.finalAmount.toLocaleString('vi-VN');
    const paidAmountStr = booking.paidAmount?.toLocaleString('vi-VN') || "0";

    return `Kính gửi anh/chị ${booking.customerInfo.name},

Yêu cầu Đặt phòng của quý khách tại Khách sạn chúng tôi đã được XÁC NHẬN.
Sau đây là thông tin chi tiết:

- Mã đơn đặt phòng: ${booking._id} 
- Loại phòng đã đặt: ${(booking.roomTypeId as any).name || 'Hợp lệ'}
- Số phòng quý khách được bố trí: ${roomNumbers}
- Lịch Check-in dự kiến: ${booking.checkInTime !== 'Tôi chưa biết' ? booking.checkInTime : '14:00'}, ngày ${checkInStr}
- Lịch Check-out: Trước 00:00 ngày ${checkOutStr}
- Thanh toán: ${finalAmountStr} VND (Đã thanh toán: ${paidAmountStr} VND)

Cảm ơn quý khách đã gửi gắm kỳ nghỉ của mình cho dịch vụ của chúng tôi.
Trân trọng!`;
};
