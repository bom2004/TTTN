import * as XLSX from 'xlsx';

/**
 * Xuất thông tin đặt phòng ra file Excel (.xlsx).
 * 
 * @param booking - Object booking chứa đầy đủ thông tin đơn đặt phòng
 */
export const exportBookingToExcel = (booking: any): void => {
    if (!booking) return;

    const fileName = `Booking_${booking._id.slice(-8).toUpperCase()}.xlsx`;

    // Chuẩn bị dữ liệu cho bảng tính
    const roomTypeName = booking.roomTypeId?.name || booking.roomTypeInfo?.name || 'N/A';
    const roomNumbers = booking.details?.map((d: any) => d.roomId?.roomNumber || 'N/A').join(', ') || 'Chưa gán';
    const checkIn = new Date(booking.checkInDate).toLocaleDateString('vi-VN');
    const checkOut = new Date(booking.checkOutDate).toLocaleDateString('vi-VN');
    
    const numDays = Math.ceil(
        (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const data = [
        ["THÔNG TIN ĐƠN ĐẶT PHÒNG"],
        ["Mã đơn hàng", booking._id.toUpperCase()],
        ["Ngày tạo", new Date(booking.createdAt).toLocaleString('vi-VN')],
        [],
        ["THÔNG TIN KHÁCH HÀNG"],
        ["Họ và tên", booking.customerInfo?.name || 'N/A'],
        ["Email", booking.customerInfo?.email || 'N/A'],
        ["Số điện thoại", booking.customerInfo?.phone || 'N/A'],
        [],
        ["CHI TIẾT ĐẶT PHÒNG"],
        ["Loại phòng", roomTypeName],
        ["Số phòng", roomNumbers],
        ["Số lượng", `${booking.roomQuantity || 1} phòng`],
        ["Ngày nhận phòng", `${checkIn} (${booking.checkInTime || '14:00'})`],
        ["Ngày trả phòng", `${checkOut} (12:00)`],
        ["Số ngày lưu trú", `${numDays} ngày`],
        [],
        ["CHI TIẾT THANH TOÁN"],
        ["Giá phòng cơ bản (VNĐ)", booking.roomTypeId?.basePrice || booking.roomTypeInfo?.basePrice || 0],
        ["Tổng tiền gốc (VNĐ)", booking.totalAmount],
        ["Mã giảm giá", booking.promotionCode || 'Không áp dụng'],
        ["Số tiền giảm (VNĐ)", booking.discountAmount || 0],
        ["TỔNG CỘNG (Thực thu) (VNĐ)", booking.finalAmount],
        ["Phương thức thanh toán", booking.paymentMethod || 'N/A'],
        ["Số tiền đã trả (VNĐ)", booking.paidAmount || 0],
        ["Yêu cầu đặc biệt", booking.specialRequests || 'Không có'],
        ["Trạng thái đơn", booking.status.toUpperCase()]
    ];

    // Tạo worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Định dạng cột (độ rộng)
    const wscols = [
        { wch: 25 }, // Cột A
        { wch: 40 }, // Cột B
    ];
    ws['!cols'] = wscols;

    // Tạo workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chi tiết đặt phòng");

    // Xuất file
    XLSX.writeFile(wb, fileName);
};

/**
 * Xuất danh sách nhiều đơn đặt phòng ra file Excel (.xlsx).
 * 
 * @param bookings - Mảng chứa các object booking
 * @param title - Tên file (mặc định là Danh_sach_dat_phong)
 */
export const exportBookingsToExcel = (bookings: any[], title: string = 'Danh_sach_dat_phong'): void => {
    if (!bookings || bookings.length === 0) return;

    const fileName = `${title}_${new Date().getTime()}.xlsx`;

    // Chuẩn bị header
    const headers = [
        "Mã đơn", 
        "Khách hàng", 
        "Số điện thoại", 
        "Email", 
        "Loại phòng", 
        "Số phòng",
        "Số lượng",
        "Ngày nhận", 
        "Ngày trả", 
        "Số đêm",
        "Tổng tiền (VNĐ)",
        "Giảm giá (VNĐ)",
        "Thực thu (VNĐ)",
        "Đã trả (VNĐ)",
        "Phương thức",
        "Trạng thái",
        "Ngày tạo"
    ];

    // Chuẩn bị dữ liệu rows
    const rows = bookings.map(b => {
        const roomTypeName = b.roomTypeId?.name || b.roomTypeInfo?.name || 'N/A';
        const roomNumbers = b.details?.map((d: any) => d.roomId?.roomNumber || 'N/A').join(', ') || 'Chưa gán';
        const checkIn = new Date(b.checkInDate).toLocaleDateString('vi-VN');
        const checkOut = new Date(b.checkOutDate).toLocaleDateString('vi-VN');
        const createdAt = new Date(b.createdAt).toLocaleString('vi-VN');

        const nights = Math.ceil(
            (new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        return [
            b._id.toUpperCase(),
            b.customerInfo?.name || 'N/A',
            b.customerInfo?.phone || 'N/A',
            b.customerInfo?.email || 'N/A',
            roomTypeName,
            roomNumbers,
            b.roomQuantity || 1,
            checkIn,
            checkOut,
            nights,
            b.totalAmount || 0,
            b.discountAmount || 0,
            b.finalAmount || 0,
            b.paidAmount || 0,
            b.paymentMethod || 'N/A',
            b.status.toUpperCase(),
            createdAt
        ];
    });

    const data = [headers, ...rows];

    // Tạo worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Định dạng cột (độ rộng)
    const wscols = headers.map(() => ({ wch: 20 }));
    ws['!cols'] = wscols;

    // Tạo workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách đặt phòng");

    // Xuất file
    XLSX.writeFile(wb, fileName);
};
