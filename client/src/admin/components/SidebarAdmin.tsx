import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const SidebarAdmin: React.FC = () => {
    return (
        <aside className="w-64 bg-[#003580] flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl">
            {/* Brand Logo Section */}
            <div className="px-6 py-8 flex items-center mb-4">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="bg-[#febb02] w-10 h-10 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-yellow-500/20">
                        <span className="text-[#003580] font-black text-lg tracking-tighter">QS</span>
                    </div>
                    <span className="text-xl font-black text-white tracking-tight group-hover:text-[#febb02] transition-colors">QuickStay</span>
                </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                <div className="pb-2 px-4 pt-2">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Hệ thống</span>
                </div>

                <NavLink
                    to="/owner"
                    end
                    className={({ isActive }) =>
                        `flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                            ? 'bg-[#febb02] text-[#003580] font-black shadow-lg shadow-yellow-500/10'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`
                    }
                >
                    <span className="material-symbols-outlined mr-3 text-[22px]">dashboard</span>
                    <span className="text-sm">Tổng quan</span>
                </NavLink>

                <NavLink
                    to="/owner/user"
                    className={({ isActive }) =>
                        `flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                            ? 'bg-[#febb02] text-[#003580] font-black shadow-lg shadow-yellow-500/10'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`
                    }
                >
                    <span className="material-symbols-outlined mr-3 text-[22px]">group</span>
                    <span className="text-sm">Quản lý người dùng</span>
                </NavLink>

                <NavLink
                    to="/owner/bookings"
                    className={({ isActive }) =>
                        `flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                            ? 'bg-[#febb02] text-[#003580] font-black shadow-lg shadow-yellow-500/10'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`
                    }
                >
                    <span className="material-symbols-outlined mr-3 text-[22px]">calendar_month</span>
                    <span className="text-sm">Quản lý đặt phòng</span>
                </NavLink>

                <div className="pt-8 pb-2 px-4">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Cơ sở và vật chất</span>
                </div>

                <NavLink
                    to="/owner/rooms"
                    className={({ isActive }) =>
                        `flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                            ? 'bg-[#febb02] text-[#003580] font-black shadow-lg shadow-yellow-500/10'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`
                    }
                >
                    <span className="material-symbols-outlined mr-3 text-[22px]">bed</span>
                    <span className="text-sm">Quản lý phòng</span>
                </NavLink>

                <NavLink
                    to="/owner/room-types"
                    className={({ isActive }) =>
                        `flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                            ? 'bg-[#febb02] text-[#003580] font-black shadow-lg shadow-yellow-500/10'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`
                    }
                >
                    <span className="material-symbols-outlined mr-3 text-[22px]">category</span>
                    <span className="text-sm">Quản lý loại phòng</span>
                </NavLink>

                <NavLink
                    to="/owner/promotions"
                    className={({ isActive }) =>
                        `flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                            ? 'bg-[#febb02] text-[#003580] font-black shadow-lg shadow-yellow-500/10'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`
                    }
                >
                    <span className="material-symbols-outlined mr-3 text-[22px]">sell</span>
                    <span className="text-sm">Quản lý khuyến mãi</span>
                </NavLink>
            </nav>

            {/* Back to Home */}
            <div className="p-4 mt-auto border-t border-white/5">
                <Link
                    to="/"
                    className="flex items-center px-4 py-4 text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-300 group"
                >
                    <span className="material-symbols-outlined mr-3 group-hover:-translate-x-1 transition-transform">logout</span>
                    <span className="text-sm font-bold uppercase tracking-wider">Thoát quản trị</span>
                </Link>
            </div>
        </aside>
    );
};

export default SidebarAdmin;
