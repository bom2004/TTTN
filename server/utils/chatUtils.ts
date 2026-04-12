import { IRoomType } from '../models/roomTypeModel';

/**
 * Trình trợ giúp: Trích xuất ngày bắt đầu và kết thúc từ văn bản người dùng
 */
export const extractDatesFromPrompt = (prompt: string) => {
    const dateRegex = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/g;
    const foundDates = [...prompt.matchAll(dateRegex)];
    
    let targetStart = new Date();
    let targetEnd = new Date();
    targetEnd.setDate(targetEnd.getDate() + 1);

    if (foundDates.length >= 1) {
        const d1 = foundDates[0];
        const d2 = foundDates[1] || d1;
        
        const day1 = parseInt(d1[1]);
        const month1 = parseInt(d1[2]) - 1;
        const year1 = d1[3] ? parseInt(d1[3]) : new Date().getFullYear();
        
        const day2 = parseInt(d2[1]);
        const month2 = parseInt(d2[2]) - 1;
        const year2 = d2[3] ? parseInt(d2[3]) : new Date().getFullYear();

        targetStart = new Date(year1, month1, day1);
        targetEnd = foundDates.length === 1 
            ? new Date(year1, month1, day1 + 1) 
            : new Date(year2, month2, day2);
    }
    
    targetStart.setHours(0,0,0,0);
    targetEnd.setHours(0,0,0,0);
    if (targetEnd <= targetStart) targetEnd.setDate(targetStart.getDate() + 1);

    return { targetStart, targetEnd };
};

/**
 * Trình trợ giúp: Xây dựng ngữ cảnh chuyên sâu cho AI
 */
export const buildAIContext = (
    roomTypes: IRoomType[], 
    rooms: any[], 
    activeBookings: any[], 
    targetStart: Date, 
    targetEnd: Date,
    promotions: any[] = [],
    services: any[] = []
) => {
    let context = "Bạn là trợ lý ảo lễ tân thông minh của khách sạn 'TuanBom Hotel'.\n";
    context += `Dữ liệu khả dụng phòng giai đoạn: ${targetStart.toLocaleDateString('vi-VN')} - ${targetEnd.toLocaleDateString('vi-VN')}\n\n`;
    
    context += "=== THÔNG TIN PHÒNG ===\n";
    roomTypes.forEach(rt => {
        const allPhysicalRooms = rooms.filter(r => r.roomTypeId.toString() === rt._id.toString());
        const maintenanceCount = allPhysicalRooms.filter(r => r.status === 'maintenance').length;
        const totalInventory = rt.totalInventory || allPhysicalRooms.length;
        const effectiveTotal = Math.max(0, totalInventory - maintenanceCount);
        
        const bookedCount = activeBookings
            .filter(b => b.roomTypeId.toString() === rt._id.toString())
            .reduce((sum, b) => sum + (b.roomQuantity || 1), 0);

        const availableCount = Math.max(0, effectiveTotal - bookedCount);

        context += `- ${rt.name}: ${new Intl.NumberFormat('vi-VN').format(rt.basePrice)}đ/ngày. Sức chứa ${rt.capacity} người. Còn ${availableCount}/${totalInventory} phòng.\n`;
    });

    if (promotions.length > 0) {
        context += "\n=== CHƯƠNG TRÌNH KHUYẾN MÃI ===\n";
        promotions.forEach(p => {
            context += `- Mã [${p.code}]: Giảm ${p.discountPercent}% (tối đa ${new Intl.NumberFormat('vi-VN').format(p.maxDiscountAmount)}đ). Chi tiết: ${p.description}. Hạn: ${new Date(p.endDate).toLocaleDateString('vi-VN')}.\n`;
        });
    }

    if (services.length > 0) {
        context += "\n=== DỊCH VỤ KHÁCH SẠN ===\n";
        services.forEach(s => {
            const catName = s.categoryId?.name ? `(${s.categoryId.name})` : '';
            context += `- ${s.name} ${catName}: ${new Intl.NumberFormat('vi-VN').format(s.price)}đ / 1 ${s.unit}\n`;
        });
    }

    context += "\nLƯU Ý: Nếu khách ĐÃ cung cấp ngày, hãy sử dụng ngay, KHÔNG hỏi lại. Nếu khách hỏi ngày tương lai, hãy dùng dữ liệu trên để tư vấn.\n";
    
    return context;
};

