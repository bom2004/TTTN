import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../lib/redux/store';
import { selectAuthUser } from '../../lib/redux/reducers/auth/selectors';
import { logout } from '../../lib/redux/reducers/auth/reducer';

const SidebarStaff: React.FC = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectAuthUser);
    const role = user?.role;

    const handleLogout = () => {
        dispatch(logout());
    };

    // Phân quyền hiển thị
    const canManagePromotions = role === 'staff' || role === 'admin';
    const canManageUsers = role === 'staff' || role === 'admin';
    const canManageRooms = role === 'staff' || role === 'admin';
    const canManageBookings = role === 'staff' || role === 'admin';

    const menuItems = [
        { path: '/staff', label: 'Tổng quan', icon: 'dashboard', show: true },
        { path: '/staff/bookings', label: 'Quản lý đặt phòng', icon: 'calendar_month', show: canManageBookings },
        { path: '/staff/service-orders', label: 'Đơn dịch vụ', icon: 'receipt_long', show: true },
        { path: '/staff/rooms', label: 'Tình trạng phòng', icon: 'bed', show: canManageRooms },
        { path: '/staff/room-types', label: 'Thông tin loại phòng', icon: 'category', show: canManageRooms },
        { path: '/staff/users', label: 'Quản lý khách hàng', icon: 'group', show: canManageUsers },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-lg font-['Inter',sans-serif]">
            {/* Brand Logo Section */}
            <div className="px-5 py-6 border-b border-slate-200 bg-gradient-to-r from-white to-blue-50/30">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:shadow-xl group-hover:shadow-blue-600/40 transition-all duration-300 group-hover:scale-105">
                        <span className="text-white font-extrabold text-sm">QS</span>
                    </div>
                    <div>
                        <span className="text-lg font-extrabold text-slate-800 tracking-tight">QuickStay</span>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Cổng nhân viên</p>
                    </div>
                </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-6 overflow-y-auto">
                {menuItems.map((item, itemIdx) => (
                    item.show && (
                        <NavLink
                            key={itemIdx}
                            to={item.path}
                            end={item.path === '/staff'}
                            className={({ isActive }) =>
                                `flex items-center px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 my-1.5 ${isActive
                                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-600 border-l-4 border-blue-600 shadow-md'
                                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 hover:shadow-sm hover:scale-[1.02]'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={`material-symbols-outlined mr-3 text-[22px] transition-all duration-200 ${isActive ? 'text-blue-600 font-bold' : 'text-slate-400 group-hover:text-blue-600 font-normal'}`}
                                    >
                                        {item.icon}
                                    </span>
                                    <span className="tracking-wide">{item.label}</span>
                                    {isActive && (
                                        <span className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    )
                ))}
            </nav>

            {/* User Info Section */}
            <Link to="/staff/profile" className="p-4 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50/80 shadow-inner block">
                <div className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-blue-50/40 transition-all duration-200 group cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-blue-600/30 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 overflow-hidden">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span>{user?.full_name?.charAt(0)?.toUpperCase() || 'S'}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-slate-800 truncate tracking-tight">
                            {user?.full_name || 'Nhân viên'}
                        </p>
                        <p className="text-xs font-bold text-slate-500 truncate capitalize mt-0.5">
                            {role === 'staff' ? 'Nhân viên chính thức' : 'Nhân sự'}
                        </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-lg group-hover:text-blue-600 transition-colors">
                        chevron_right
                    </span>
                </div>
            </Link>

            <div className="px-4 pb-4">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-3 py-2.5 text-slate-500 text-sm font-bold rounded-xl hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30 group"
                >
                    <span className="material-symbols-outlined mr-2 text-[20px] group-hover:rotate-180 transition-transform duration-500">logout</span>
                    <span>Thoát phiên làm việc</span>
                </button>
            </div>
        </aside>
    );
};

export default SidebarStaff;