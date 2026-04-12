import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ServiceOrder } from '../../../lib/redux/reducers/service';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  delivering: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: 'Chưa thanh toán',
  paid_now: 'Trả khi nhận đồ',
  charged_to_room: 'Gộp hóa đơn phòng',
};

export const exportServiceOrdersToExcel = (orders: ServiceOrder[], startDate?: string, endDate?: string) => {
  try {
    if (orders.length === 0) {
      toast.warn("Không có dữ liệu để xuất");
      return;
    }

    const data = orders.map(order => ({
      "Mã Đơn": order._id.slice(-6).toUpperCase(),
      "Phòng": order.roomId?.roomNumber || "N/A",
      "Ngày Tạo": new Date(order.createdAt).toLocaleString('vi-VN'),
      "Số Món": order.items.length,
      "Chi Tiết": order.items.map(i => `${i.serviceId?.name || 'Dịch vụ'} (x${i.quantity})`).join(', '),
      "Tổng Tiền": order.totalAmount,
      "Thanh Toán": PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus,
      "Trạng Thái": STATUS_LABELS[order.status] || order.status,
      "Ghi Chú": order.note || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Service Orders");

    // Định dạng độ rộng cột
    const max_width = data.reduce((w, r) => Math.max(w, r["Chi Tiết"].length), 10);
    worksheet["!cols"] = [
      { wch: 12 }, // Mã Đơn
      { wch: 10 }, // Phòng
      { wch: 20 }, // Ngày Tạo
      { wch: 10 }, // Số Món
      { wch: Math.min(max_width, 60) }, // Chi Tiết
      { wch: 15 }, // Tổng Tiền
      { wch: 20 }, // Thanh Toán
      { wch: 15 }, // Trạng Thái
      { wch: 25 }  // Ghi Chú
    ];

    const fileName = `Bao_cao_dich_vu_${startDate || 'all'}_den_${endDate || 'now'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success("Xuất báo cáo thành công!");
  } catch (error) {
    toast.error("Lỗi xuất file Excel");
    console.error("Export Error:", error);
  }
};
