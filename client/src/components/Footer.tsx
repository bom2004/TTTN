import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-[#003580] pt-20 pb-10 px-6 md:px-20 text-white relative overflow-hidden border-t border-white/10">
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none"></div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
                {/* Brand Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="bg-white/10 p-2 rounded-xl border border-white/20 group-hover:bg-white/20 transition-all duration-500">
                            <span className="material-symbols-outlined text-3xl font-light">apartment</span>
                        </div>
                        <h2 className="text-2xl font-[900] tracking-tighter">
                            QuickStay.com
                        </h2>
                    </div>
                    <p className="text-blue-100/60 text-sm leading-relaxed max-w-xs font-medium italic">
                        "Your journey, our priority. Experience the world's best stays with QuickStay."
                    </p>
                    <div className="flex gap-5">
                        {['facebook', 'instagram', 'twitter', 'youtube'].map(icon => (
                            <a key={icon} href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-[#006ce4] hover:text-white hover:border-transparent hover:-translate-y-1 transition-all duration-300 shadow-lg">
                                <i className={`fab fa-${icon} text-lg`}></i>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h3 className="text-white text-xs font-black uppercase tracking-[0.3em] mb-8 opacity-40">Khám phá thế giới</h3>
                    <ul className="space-y-4">
                        {['Quốc gia', 'Khu vực', 'Thành phố', 'Quận', 'Sân bay', 'Khách sạn', 'Địa danh'].map(link => (
                            <li key={link}>
                                <a href="#" className="text-blue-50/80 text-sm font-bold hover:text-white hover:underline transition-all flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400/30 group-hover:bg-[#febb02] transition-colors"></span>
                                    {link}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Support Links */}
                <div>
                    <h3 className="text-white text-xs font-black uppercase tracking-[0.3em] mb-8 opacity-40">Dành cho khách hàng</h3>
                    <ul className="space-y-4">
                        {['Trung tâm hỗ trợ', 'Quy tắc cộng đồng', 'Dịch vụ khách hàng', 'Quản lý đặt phòng', 'Thông tin pháp lý', 'Trung tâm bảo mật'].map(link => (
                            <li key={link}>
                                <a href="#" className="text-blue-50/80 text-sm font-bold hover:text-white hover:underline transition-all flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400/30 group-hover:bg-[#006ce4] transition-colors"></span>
                                    {link}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contact Section */}
                <div>
                    <h3 className="text-white text-xs font-black uppercase tracking-[0.3em] mb-8 opacity-40">Kết nối với chúng tôi</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4 group">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 shrink-0 group-hover:border-blue-400/50 transition-colors">
                                <span className="material-symbols-outlined text-blue-300">location_on</span>
                            </div>
                            <p className="text-blue-50/70 text-sm font-medium leading-relaxed">Bitexco Financial Tower, District 1, Ho Chi Minh City, Vietnam</p>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 shrink-0 group-hover:border-blue-400/50 transition-colors">
                                <span className="material-symbols-outlined text-blue-300">support_agent</span>
                            </div>
                            <p className="text-blue-50/70 text-sm font-black">+84 1900 6789</p>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 shrink-0 group-hover:border-blue-400/50 transition-colors">
                                <span className="material-symbols-outlined text-blue-300">mail</span>
                            </div>
                            <p className="text-blue-50/70 text-sm font-bold truncate">support@quickstay.com</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                    <p className="text-blue-100/30 text-[10px] font-black uppercase tracking-[0.2em] mb-2">© 2025 QuickStay International B.V.</p>
                    <p className="text-blue-100/20 text-[9px] font-medium max-w-md">QuickStay.com là một phần của QuickStay Group, công ty hàng đầu thế giới về du lịch trực tuyến và các dịch vụ liên quan.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-8 items-center bg-white/5 px-8 py-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="Paypal" className="h-4 opacity-40 hover:opacity-100 transition-all cursor-pointer grayscale hover:grayscale-0" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 opacity-40 hover:opacity-100 transition-all cursor-pointer grayscale hover:grayscale-0" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg" alt="Visa New" className="h-4 opacity-40 hover:opacity-100 transition-all cursor-pointer grayscale hover:grayscale-0" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 opacity-40 hover:opacity-100 transition-all cursor-pointer grayscale hover:grayscale-0" />
                </div>
            </div>
        </footer>
    );
};

export default Footer;