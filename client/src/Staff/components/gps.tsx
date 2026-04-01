import React, { useEffect } from "react";
import { toast } from 'react-toastify';

interface GpsProps {
    onLocationFetched: (location: { latitude: number; longitude: number } | null) => void;
}

const Gps: React.FC<GpsProps> = ({ onLocationFetched }) => {
    useEffect(() => {
        // Kiểm tra trình duyệt
        if (!navigator.geolocation) {
            toast.error("❌ Thiết bị của bạn không có tính năng định vị GPS.");
            return;
        }

        // Tùy chọn cấu hình GPS độ chính xác cao
        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        };

        // Bắt đầu theo dõi tọa độ liên tục
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                onLocationFetched({ latitude, longitude });
            },
            (error) => {
                let errorMsg = "❌ Lỗi định vị GPS.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = "⚠️ Vui lòng cấp quyền GPS để có thể chấm công.";
                        break;
                    case error.TIMEOUT:
                        errorMsg = "📡 Tín hiệu GPS yếu. Hãy thử di chuyển ra khu vực thoáng hơn.";
                        break;
                }
                toast.warning(errorMsg);
                onLocationFetched(null);
            },
            options
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [onLocationFetched]);

    return null; // Linh kiện chạy ngầm, không render giao diện
};

export default Gps;
