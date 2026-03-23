/**
 * Hàm hỗ trợ: Chuẩn hóa dữ liệu tiện ích (amenities) từ Client (JSON hoặc Object)
 */
export const parseAmenitiesObject = (amenities: any) => {
    let parsed = amenities;
    if (typeof amenities === 'string') {
        try {
            parsed = JSON.parse(amenities);
        } catch (e) {
            parsed = {};
        }
    }
    
    return {
        wifi: String(parsed?.wifi) === 'true',
        airConditioner: String(parsed?.airConditioner) === 'true',
        breakfast: String(parsed?.breakfast) === 'true',
        minibar: String(parsed?.minibar) === 'true',
        tv: String(parsed?.tv) === 'true',
        balcony: String(parsed?.balcony) === 'true',
    };
};

/**
 * Hàm hỗ trợ: Chuẩn hóa ngày tháng về chuẩn 00:00:00 UTC
 */
export const normalizeDateUTC = (dateStr: string | Date): Date => {
    const d = new Date(dateStr);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};
