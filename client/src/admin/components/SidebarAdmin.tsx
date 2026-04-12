import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../lib/redux/store';
import { selectAuthUser } from '../../lib/redux/reducers/auth/selectors';
import { logout } from '../../lib/redux/reducers/auth/reducer';

const SidebarAdmin: React.FC = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectAuthUser);
    const role = user?.role;

    const handleLogout = () => {
        dispatch(logout());
    };

    // Phân quyền hiển thị
    const canManageStaff = role === 'admin' || role === 'staff';
    const canManagePromotions = role === 'admin' || role === 'staff';
    const canManageUsers = role === 'admin';
    const canManageRooms = role !== 'accountant';
    const canManageBookings = role !== 'accountant';

    const menuItems = [
        { path: '/owner', label: 'Tổng quan', icon: 'dashboard', show: true },
        { path: '/owner/user', label: 'Quản lý người dùng', icon: 'group', show: canManageUsers },
        { path: '/owner/staff', label: 'Quản lý nhân viên', icon: 'badge', show: canManageStaff },
        { path: '/owner/bookings', label: 'Quản lý đặt phòng', icon: 'calendar_month', show: canManageBookings },
        { path: '/owner/services', label: 'Quản lý dịch vụ', icon: 'room_service', show: true },
        { path: '/owner/service-orders', label: 'Đơn dịch vụ', icon: 'receipt_long', show: true },
        { path: '/owner/rooms', label: 'Quản lý phòng', icon: 'bed', show: canManageRooms },
        { path: '/owner/room-types', label: 'Quản lý loại phòng', icon: 'category', show: canManageRooms },
        { path: '/owner/promotions', label: 'Quản lý khuyến mãi', icon: 'sell', show: canManagePromotions },
        { path: '/owner/comments', label: 'Quản lý đánh giá', icon: 'rate_review', show: true },
        { path: '/owner/chatbot', label: 'Quản lý Chatbot', icon: 'smart_toy', show: true }
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-lg">
            {/* Brand Logo Section */}
            <div className="px-5 py-6 border-b border-slate-200 bg-gradient-to-r from-white to-blue-50/30">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dim rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-xl group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105">
                        <span className="text-white font-extrabold text-sm">QS</span>
                    </div>
                    <div>
                        <span className="text-lg font-extrabold text-slate-800 tracking-tight">QuickStay</span>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Hệ thống quản trị</p>
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
                            end={item.path === '/owner'}
                            className={({ isActive }) =>
                                `flex items-center px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 my-1.5 ${isActive
                                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-primary border-l-4 border-primary shadow-md'
                                    : 'text-slate-600 hover:text-primary hover:bg-blue-50/60 hover:shadow-sm hover:scale-[1.02]'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={`material-symbols-outlined mr-3 text-[22px] transition-all duration-200 ${isActive ? 'text-primary font-bold' : 'text-slate-400 group-hover:text-primary font-normal'}`}
                                    >
                                        {item.icon}
                                    </span>
                                    <span className="tracking-wide">{item.label}</span>
                                    {isActive && (
                                        <span className="ml-auto w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    )
                ))}
            </nav>

            {/* User Info Section */}
            <Link to="/owner/profile" className="p-4 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50/80 shadow-inner block">
                <div className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-blue-50/40 transition-all duration-200 group cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-primary/30 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 overflow-hidden">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span>{user?.full_name?.charAt(0)?.toUpperCase() || 'A'}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-slate-800 truncate tracking-tight">
                            {user?.full_name || 'Quản trị viên'}
                        </p>
                        <p className="text-xs font-bold text-slate-500 truncate capitalize mt-0.5">
                            {role === 'admin' ? 'Quản trị viên cấp cao' :
                                role === 'staff' ? 'Nhân viên' : 'Người dùng'}
                        </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-lg group-hover:text-primary transition-colors">
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
                    <span>Thoát quản trị</span>
                </button>
            </div>
        </aside>
    );
};

export default SidebarAdmin;