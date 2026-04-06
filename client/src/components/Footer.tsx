import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-[#003580] pt-12 pb-6 px-4 md:px-16 text-white">
            <div className="max-w-7xl mx-auto">
                {/* Main Grid - 4 columns trên desktop, 2 trên tablet, 1 trên mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Column 1: Brand */}
                    <div>
                        <h2 className="text-xl font-bold mb-4">QuickStay</h2>
                        <p className="text-sm text-white/70 leading-relaxed mb-4">
                            Khám phá những điểm đến tuyệt vời nhất với dịch vụ đặt phòng trực tuyến hàng đầu Đông Nam Á.
                        </p>
                        <div className="flex gap-3">
                            {['facebook', 'instagram', 'twitter', 'youtube'].map(icon => (
                                <a
                                    key={icon}
                                    href="#"
                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                >
                                    <i className={`fab fa-${icon} text-sm text-white/70`}></i>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Khám phá */}
                    <div>
                        <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide">Khám phá</h3>
                        <ul className="space-y-2">
                            {['Quốc gia', 'Thành phố', 'Khách sạn', 'Địa danh nổi bật', 'Sân bay'].map(link => (
                                <li key={link}>
                                    <a href="#" className="text-sm text-white/70 hover:text-white hover:underline transition-colors">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Hỗ trợ */}
                    <div>
                        <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide">Hỗ trợ</h3>
                        <ul className="space-y-2">
                            {['Trung tâm hỗ trợ', 'Câu hỏi thường gặp', 'Chính sách hủy phòng', 'Thanh toán', 'Quyền riêng tư'].map(link => (
                                <li key={link}>
                                    <a href="#" className="text-sm text-white/70 hover:text-white hover:underline transition-colors">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Liên hệ */}
                    <div>
                        <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide">Liên hệ</h3>
                        <ul className="space-y-3">
                            <li className="text-sm text-white/70">
                                <span className="block font-medium text-white/90">Hotline:</span>
                                1900 6789
                            </li>
                            <li className="text-sm text-white/70">
                                <span className="block font-medium text-white/90">Email:</span>
                                support@quickstay.com
                            </li>
                            <li className="text-sm text-white/70">
                                <span className="block font-medium text-white/90">Địa chỉ:</span>
                                Số 1 Trường Thi, phường Trường Vinh, Nghệ An
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/20 my-8"></div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
                    <p>© 2025 QuickStay. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white/80 transition-colors">Điều khoản sử dụng</a>
                        <a href="#" className="hover:text-white/80 transition-colors">Chính sách bảo mật</a>
                        <a href="#" className="hover:text-white/80 transition-colors">Cookie settings</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;