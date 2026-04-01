/**
 * Cấu hình Bảo mật Chấm công cho Khách sạn
 */
export const ATTENDANCE_CONFIG = {
    // 1. IP Tin cậy (Public IP của Wifi khách sạn)
    // Để trống hoặc set null nếu không muốn check IP (Dễ test ở nhà)
    TRUSTED_IP: process.env.TRUSTED_IP || null,

    // 2. Tọa độ GPS của Khách sạn 
    HOTEL_LOCATION: {
        latitude: 18.657212799273186,
        longitude: 105.69839983820725

    },

    // 3. Bán kính cho phép (mét)
    ALLOWED_RADIUS: 200, // Nhân viên phải ở trong bán kính 200m của khách sạn

    // 4. Yêu cầu ảnh chụp minh chứng
    REQUIRE_IMAGE: true
};
