/**
 * Xuất hóa đơn đặt phòng dạng PDF thông qua cửa sổ in (window.print).
 * Không cần cài thêm thư viện bên ngoài.
 * 
 * @param booking - Object booking chứa đầy đủ thông tin đơn đặt phòng
 */
export const exportInvoice = (booking: any): void => {
    if (!booking) return;

    const roomTypeName = booking.roomTypeId?.name || booking.roomTypeInfo?.name || 'N/A';
    const roomNumbers = booking.details?.map((d: any) => d.roomId?.roomNumber || 'N/A').join(', ') || 'Chưa gán';
    const checkIn = new Date(booking.checkInDate).toLocaleDateString('vi-VN');
    const checkOut = new Date(booking.checkOutDate).toLocaleDateString('vi-VN');
    const createdAt = new Date(booking.createdAt).toLocaleString('vi-VN');
    const numNights = Math.ceil(
        (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const numDays = numNights; // Dùng numDays cho đồng nhất thuật ngữ
    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

    const invoiceHTML = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Hóa đơn #${booking._id.slice(-8).toUpperCase()}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', Georgia, 'Segoe UI', serif;
            background: #fff;
            color: #2c3e50;
            padding: 30px 20px;
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.5;
        }

        /* Container chính */
        .invoice-container {
            background: white;
            border: 1px solid #d4d4d4;
            box-shadow: 0 0 10px rgba(0,0,0,0.05);
        }

        /* Header chính */
        .invoice-header {
            background: #1a3c34;
            color: white;
            padding: 25px 30px;
            text-align: center;
            border-bottom: 3px solid #c7a03b;
        }

        .hotel-name {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .hotel-address {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 15px;
        }

        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            margin-top: 10px;
            letter-spacing: 3px;
        }

        .invoice-number {
            font-size: 13px;
            margin-top: 8px;
            opacity: 0.8;
        }

        /* Thông tin chung */
        .info-section {
            padding: 25px 30px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 20px;
            background: #fefefe;
        }

        .info-box {
            flex: 1;
            min-width: 200px;
        }

        .info-label {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            color: #7f8c8d;
            letter-spacing: 1px;
            margin-bottom: 8px;
            border-bottom: 1px solid #ddd;
            display: inline-block;
            padding-bottom: 3px;
        }

        .info-content {
            font-size: 14px;
            margin-top: 8px;
        }

        .info-content p {
            margin-bottom: 5px;
        }

        .info-content strong {
            color: #1a3c34;
        }

        /* Bảng chi tiết */
        .details-table {
            width: 100%;
            padding: 0 30px;
            margin: 20px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        th {
            background: #f5f5f5;
            border-bottom: 2px solid #c7a03b;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            color: #1a3c34;
            text-transform: uppercase;
            font-size: 12px;
        }

        td {
            padding: 10px 8px;
            border-bottom: 1px solid #eee;
        }

        .text-right {
            text-align: right;
        }

        .total-row {
            font-weight: bold;
            background: #fafafa;
        }

        /* Tổng kết */
        .summary-section {
            padding: 20px 30px 25px 30px;
            background: #fefefe;
            border-top: 1px solid #e0e0e0;
        }

        .summary-box {
            width: 100%;
            max-width: 380px;
            margin-left: auto;
        }

        .summary-line {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
            border-bottom: 1px dashed #e0e0e0;
        }

        .summary-line.total {
            font-size: 18px;
            font-weight: bold;
            color: #1a3c34;
            border-bottom: 2px solid #c7a03b;
            padding-top: 12px;
            margin-top: 5px;
        }

        .summary-line.paid {
            color: #27ae60;
            font-weight: bold;
        }

        .summary-line.remaining {
            color: #e74c3c;
            font-weight: bold;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 15px;
            border-radius: 30px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 12px;
            text-align: center;
        }

        .status-paid {
            background: #d5f5e3;
            color: #1e8449;
            border: 1px solid #1e8449;
        }

        .status-deposited {
            background: #fef9e7;
            color: #b7950b;
            border: 1px solid #b7950b;
        }

        .status-unpaid {
            background: #fadbd8;
            color: #c0392b;
            border: 1px solid #c0392b;
        }

        /* Footer */
        .footer {
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
            background: #f9f9f9;
            font-size: 11px;
            color: #7f8c8d;
        }

        .thanks {
            font-size: 14px;
            font-weight: bold;
            color: #1a3c34;
            margin-bottom: 12px;
            font-style: italic;
        }

        .footer-note {
            margin-top: 8px;
            font-size: 10px;
        }

        @media print {
            body {
                padding: 0;
                margin: 0;
            }
            .invoice-container {
                border: none;
                box-shadow: none;
            }
            .status-badge {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            th {
                background: #f5f5f5 !important;
                print-color-adjust: exact;
            }
            .invoice-header {
                background: #1a3c34 !important;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
            <div class="hotel-name">QUICKSTAY HOTEL</div>
            <div class="hotel-address">Số 1 Đại lộ Lê Nin, TP. Vinh, Nghệ An | Tel: 0238.123.456 | Email: info@quickstay.com</div>
            <div class="invoice-title">HÓA ĐƠN THANH TOÁN</div>
            <div class="invoice-number">Số: INV-${booking._id.slice(-8).toUpperCase()}</div>
        </div>

        <!-- Thông tin chung -->
        <div class="info-section">
            <div class="info-box">
                <div class="info-label">THÔNG TIN KHÁCH HÀNG</div>
                <div class="info-content">
                    <p><strong>${booking.customerInfo.name}</strong></p>
                    <p>Điện thoại: ${booking.customerInfo.phone}</p>
                    <p>Email: ${booking.customerInfo.email}</p>
                    ${booking.customerInfo.address ? `<p>Địa chỉ: ${booking.customerInfo.address}</p>` : ''}
                </div>
            </div>
            <div class="info-box">
                <div class="info-label">THÔNG TIN ĐẶT PHÒNG</div>
                <div class="info-content">
                    <p>Mã đơn: <strong>#${booking._id.slice(-8).toUpperCase()}</strong></p>
                    <p>Ngày đặt: ${createdAt}</p>
                    <p>Nhân viên: ${booking.employeeName || 'Hệ thống'}</p>
                </div>
            </div>
            <div class="info-box">
                <div class="info-label">THỜI GIAN LƯU TRÚ</div>
                <div class="info-content">
                    <p>Nhận phòng: <strong>${checkIn}</strong> (${booking.checkInTime || '14:00'})</p>
                    <p>Trả phòng: <strong>${checkOut}</strong> (12:00)</p>
                    <p>Số ngày: <strong>${numDays} ngày</strong></p>
                </div>
            </div>
        </div>

        <!-- Bảng chi tiết -->
        <div class="details-table">
            <table>
                <thead>
                    <tr>
                        <th style="width: 40%;">MÔ TẢ DỊCH VỤ</th>
                        <th style="width: 15%;" class="text-right">SỐ LƯỢNG</th>
                        <th style="width: 20%;" class="text-right">ĐƠN GIÁ</th>
                        <th style="width: 25%;" class="text-right">THÀNH TIỀN</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${roomTypeName} - Phòng ${roomNumbers}</td>
                        <td class="text-right">${booking.roomQuantity || 1} phòng × ${numDays} ngày</td>
                        <td class="text-right">${fmt(booking.roomTypeId?.basePrice || booking.roomTypeInfo?.basePrice || 0)}₫</td>
                        <td class="text-right">${fmt(booking.totalAmount)}₫</td>
                    </tr>
                    ${booking.services && booking.services.length > 0 ? booking.services.map((service: any) => `
                    <tr>
                        <td>Dịch vụ: ${service.name}</td>
                        <td class="text-right">${service.quantity}</td>
                        <td class="text-right">${fmt(service.price)}₫</td>
                        <td class="text-right">${fmt(service.quantity * service.price)}₫</td>
                    </tr>
                    `).join('') : ''}
                    ${booking.promotionCode ? `
                    <tr>
                        <td colspan="3" class="text-right">Mã giảm giá: ${booking.promotionCode}</td>
                        <td class="text-right" style="color: #27ae60;">-${fmt(booking.discountAmount)}₫</td>
                    </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>

        <!-- Tổng kết -->
        <div class="summary-section">
            <div class="summary-box">
                <div class="summary-line">
                    <span>Tổng tiền phòng & dịch vụ:</span>
                    <span>${fmt(booking.totalAmount)}₫</span>
                </div>
                ${booking.discountAmount > 0 ? `
                <div class="summary-line">
                    <span>Chiết khấu / Khuyến mãi:</span>
                    <span style="color: #27ae60;">-${fmt(booking.discountAmount)}₫</span>
                </div>` : ''}
                <div class="summary-line total">
                    <span>TỔNG CỘNG:</span>
                    <span>${fmt(booking.finalAmount)}₫</span>
                </div>
                <div class="summary-line paid">
                    <span>Đã thanh toán:</span>
                    <span>${fmt(booking.paidAmount || 0)}₫</span>
                </div>
                <div class="summary-line remaining">
                    <span>Còn lại:</span>
                    <span>${fmt(Math.max(0, booking.finalAmount - (booking.paidAmount || 0)))}₫</span>
                </div>
                <div style="text-align: right;">
                    <span class="status-badge ${booking.paymentStatus === 'paid' ? 'status-paid' :
            booking.paymentStatus === 'deposited' ? 'status-deposited' :
                'status-unpaid'
        }">
                        ${booking.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' :
            booking.paymentStatus === 'deposited' ? 'ĐÃ ĐẶT CỌC' :
                'CHƯA THANH TOÁN'}
                    </span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="thanks">Cảm ơn quý khách. Chúc quý khách có kỳ nghỉ tuyệt vời!</div>
            <div>QuickStay Hotel - Nơi nghỉ dưỡng hoàn hảo cho gia đình bạn</div>
            <div class="footer-note">Hóa đơn này được tạo tự động từ hệ thống quản lý khách sạn. Quý khách vui lòng giữ lại để đối chiếu khi cần thiết.</div>
            <div class="footer-note">Ngày xuất hóa đơn: ${new Date().toLocaleString('vi-VN')}</div>
        </div>
    </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
            printWindow.onafterprint = () => printWindow.close();
        };
    }
};