import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

/**
 * Utility to export JSON data to a professional Excel file
 * 
 * @param data Array of objects to export
 * @param fileName Name of the resulting file (without extension)
 * @param sheetName Name of the sheet inside the Excel file
 */
export const exportToExcel = (data: any[], fileName: string = 'report', sheetName: string = 'Data') => {
  try {
    // 1. Create a dynamic worksheet from the JSON data
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 2. Add some basic styling or column headers if needed (SheetJS is limited in direct styling without 'xlsx-js-style')
    // But we can at least ensure headers are readable
    
    // 3. Create a workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 4. Generate the current date suffix
    const dateSuffix = dayjs().format('YYYYMMDD_HHmmss');
    const finalFileName = `${fileName}_${dateSuffix}.xlsx`;

    // 5. Download the file
    XLSX.writeFile(workbook, finalFileName);
    
    return true;
  } catch (error) {
    console.error("Lỗi khi xuất file Excel:", error);
    return false;
  }
};

/**
 * Specifically format and export revenue stats for Admin
 */
export const exportRevenueReport = (revenueData: any[]) => {
    const formattedData = revenueData.map(item => ({
        'Tháng': item.name,
        'Doanh thu (VNĐ)': item.revenue,
        'Số lượng đơn đặt': item.bookings,
        'Trạng thái': 'Hoành thành báo cáo'
    }));
    
    return exportToExcel(formattedData, 'Bao_cao_doanh_thu', 'Doanh thu');
};
