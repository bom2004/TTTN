import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAppSelector } from '../../lib/redux/store';
import { selectAuthUser } from '../../lib/redux/reducers/auth/selectors';

const SidebarAdmin: React.FC = () => {
    const user = useAppSelector(selectAuthUser);
    const role = user?.role;

    // Phân quyền hiển thị
    const canManageStaff = role === 'admin' || role === 'hotelOwner' || role === 'staff';
    const canManagePromotions = role === 'admin' || role === 'hotelOwner' || role === 'staff';
    const canManageUsers = role === 'admin' || role === 'hotelOwner';
    const canManageRooms = role !== 'accountant';
    const canManageBookings = role !== 'accountant';

    const menuItems = [
        {
            section: 'Hệ thống',
            items: [
                { path: '/owner', label: 'Tổng quan', icon: 'dashboard', show: true }
            ]
        },
        {
            section: 'Quản lý người dùng',
            items: [
                { path: '/owner/user', label: 'Quản lý người dùng', icon: 'group', show: canManageUsers },
                { path: '/owner/staff', label: 'Quản lý nhân viên', icon: 'badge', show: canManageStaff }
            ]
        },
        {
            section: 'Quản lý đặt phòng',
            items: [
                { path: '/owner/bookings', label: 'Quản lý đặt phòng', icon: 'calendar_month', show: canManageBookings }
            ]
        },
        {
            section: 'Phản hồi khách hàng',
            items: [
                { path: '/owner/comments', label: 'Quản lý đánh giá', icon: 'rate_review', show: true }
            ]
        },
        {
            section: 'Cơ sở vật chất',
            items: [
                { path: '/owner/rooms', label: 'Quản lý phòng', icon: 'bed', show: canManageRooms },
                { path: '/owner/room-types', label: 'Quản lý loại phòng', icon: 'category', show: canManageRooms },
                { path: '/owner/promotions', label: 'Quản lý khuyến mãi', icon: 'sell', show: canManagePromotions }
            ]
        }
    ];

    return (
        <aside className="w-64 bg-gray-900 flex flex-col h-screen fixed left-0 top-0 z-50">
            {/* Brand Logo Section */}
            <div className="px-5 py-5 border-b border-gray-800">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold text-sm">QS</span>
                    </div>
                    <span className="text-base font-semibold text-white">QuickStay</span>
                </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                {menuItems.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        {section.items.some(item => item.show) && (
                            <div className="px-3 mb-2">
                                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                    {section.section}
                                </p>
                            </div>
                        )}
                        {section.items.map((item, itemIdx) => (
                            item.show && (
                                <NavLink
                                    key={itemIdx}
                                    to={item.path}
                                    end={item.path === '/owner'}
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${isActive
                                            ? 'bg-gray-800 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                        }`
                                    }
                                >
                                    <span className="material-symbols-outlined mr-3 text-[18px]">{item.icon}</span>
                                    <span>{item.label}</span>
                                </NavLink>
                            )
                        ))}
                    </div>
                ))}
            </nav>

            {/* Back to Home */}
            <div className="p-3 border-t border-gray-800">
                <Link
                    to="/"
                    className="flex items-center px-3 py-2 text-gray-400 text-sm rounded-md hover:text-white hover:bg-gray-800 transition-colors"
                >
                    <span className="material-symbols-outlined mr-3 text-[18px]">logout</span>
                    <span>Thoát quản trị</span>
                </Link>
            </div>
        </aside>
    );
};

export default SidebarAdmin;