import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAppSelector } from '../../lib/redux/store';
import { selectAuthUser } from '../../lib/redux/reducers/auth/selectors';

const SidebarStaff: React.FC = () => {
    const user = useAppSelector(selectAuthUser);
    const role = user?.role;

    // Phân quyền hiển thị TRONG KHU VỰC STAFF
    const canManagePromotions = role === 'staff' || role === 'admin';
    const canManageUsers = role === 'staff' || role === 'receptionist' || role === 'admin';
    const canManageRooms = role === 'staff' || role === 'receptionist' || role === 'admin';
    const canManageBookings = role === 'staff' || role === 'receptionist' || role === 'admin';
    const canManageAttendance = role === 'staff' || role === 'admin';

    const menuItems = [
        {
            section: 'Nghiệp vụ',
            items: [
                { path: '/staff', label: 'Tổng quan', icon: 'dashboard', show: true },
                { path: '/staff/bookings', label: 'Quản lý đặt phòng', icon: 'calendar_month', show: canManageBookings }
            ]
        },
        {
            section: 'Cơ sở vật chất',
            items: [
                { path: '/staff/rooms', label: 'Tình trạng phòng', icon: 'bed', show: canManageRooms },
                { path: '/staff/room-types', label: 'Thông tin loại phòng', icon: 'category', show: canManageRooms }
            ]
        },
        {
            section: 'Nhân sự',
            items: [
                { path: '/staff/manage-staff', label: 'Danh sách nhân viên', icon: 'badge', show: canManageAttendance }
            ]
        },
        {
            section: 'Hỗ trợ',
            items: [
                { path: '/staff/users', label: 'Khách hàng', icon: 'group', show: canManageUsers }
            ]
        }
    ];

    return (
        <aside className="w-64 bg-gray-800 flex flex-col h-screen fixed left-0 top-0 z-50">
            {/* Brand Logo Section */}
            <div className="px-4 py-4 border-b border-gray-700">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-600 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-xs">QS</span>
                    </div>
                    <span className="text-sm font-medium text-gray-200">QuickStay Staff</span>
                </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                {menuItems.map((section, idx) => (
                    <div key={idx} className="mb-5">
                        {section.items.some(item => item.show) && (
                            <div className="px-3 mb-1.5">
                                <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                                    {section.section}
                                </p>
                            </div>
                        )}
                        {section.items.map((item, itemIdx) => (
                            item.show && (
                                <NavLink
                                    key={itemIdx}
                                    to={item.path}
                                    end={item.path === '/staff'}
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-1.5 rounded text-sm transition-colors ${isActive
                                            ? 'bg-gray-700 text-white'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                                        }`
                                    }
                                >
                                    <span className="material-symbols-outlined mr-2 text-[16px]">{item.icon}</span>
                                    <span>{item.label}</span>
                                </NavLink>
                            )
                        ))}
                    </div>
                ))}
            </nav>

            {/* Back to Home */}
            <div className="p-3 border-t border-gray-700">
                <Link
                    to="/"
                    className="flex items-center px-3 py-1.5 text-gray-400 text-sm rounded hover:text-gray-200 hover:bg-gray-700/50 transition-colors"
                >
                    <span className="material-symbols-outlined mr-2 text-[16px]">logout</span>
                    <span>Thoát</span>
                </Link>
            </div>
        </aside>
    );
};

export default SidebarStaff;