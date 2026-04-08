import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../lib/redux/store';
import { selectAuthToken, selectAuthUser, logout } from '../lib/redux/reducers/auth';
import { getProfileThunk } from '../lib/redux/reducers/auth/thunks';

const Navbar: React.FC = () => {
    const navLinks = [
        { name: 'Trang chủ', path: '/' },
        { name: 'Phòng', path: '/rooms' },
        { name: 'Dịch vụ', path: '/services' },
        { name: 'Khuyến mãi', path: '/promotions' },
        { name: 'Liên hệ', path: '/contact' },
    ];

    const dispatch = useAppDispatch();
    const token = useAppSelector(selectAuthToken);
    const userData = useAppSelector(selectAuthUser);

    const [isScrolled, setIsScrolled] = useState<boolean>(false);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = (): void => {
        dispatch(logout());
        navigate('/login');
    }

    // xử lý hạng thành viên
    const getMembershipInfo = (totalSpent: number) => {
        if (!totalSpent || totalSpent < 2000000) return { label: 'Silver', color: 'text-gray-400', bg: 'bg-gray-100', icon: 'stars' };
        if (totalSpent < 7000000) return { label: 'Gold', color: 'text-yellow-500', bg: 'bg-yellow-50', icon: 'workspace_premium' };
        if (totalSpent < 12000000) return { label: 'Diamond', color: 'text-blue-500', bg: 'bg-blue-50', icon: 'diamond' };
        return { label: 'Platinum', color: 'text-purple-500', bg: 'bg-purple-50', icon: 'crown' };
    };

    const membership = userData ? getMembershipInfo(userData.totalSpent || 0) : { label: 'Member', color: 'text-gray-300', bg: 'bg-transparent', icon: 'person' };

    useEffect(() => {
        const handleScroll = (): void => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);

        if (token && userData) {
            const uid = userData.id || userData._id;
            if (uid) {
                dispatch(getProfileThunk(uid)).unwrap().catch(err => {
                    console.error("Error syncing user:", err);
                });
            }
        }

        if (!document.getElementById('material-symbols')) {
            const link = document.createElement('link');
            link.id = 'material-symbols';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
            document.head.appendChild(link);
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [location.pathname, dispatch]);

    return (
        <header className="bg-[#003580] text-white pt-5 pb-3 px-4 md:px-10 sticky top-0 z-[100] shadow-xl">
            {/* Top Row: Logo & Actions */}
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link to='/' className="flex items-center gap-3 group">
                    <div className="bg-white/10 p-1 rounded-lg group-hover:bg-white/20 transition-colors">
                        <span className="material-symbols-outlined text-white text-3xl">bed</span>
                    </div>
                    <span className="text-2xl font-[900] tracking-tighter text-white group-hover:text-gray-100 transition-colors">QuickStay.com</span>
                </Link>

                {/* Right Actions */}
                <div className="flex items-center gap-4 lg:gap-6">
                    {/* Search Bar */}
                    <div className="hidden lg:flex items-center bg-white/10 rounded-xl px-4 py-2 border border-transparent focus-within:border-white/40 focus-within:bg-white/20 transition-all duration-300">
                        <span className="material-symbols-outlined text-white/70 text-xl mr-2">search</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            className="bg-transparent border-none focus:ring-0 text-sm w-40 xl:w-56 outline-none text-white placeholder-white/50 font-medium"
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter' && searchQuery.trim()) {
                                    navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
                                }
                            }}
                        />
                    </div>

                    {/* Auth & Profile */}
                    {token && userData ? (
                        <div className="relative group">
                            <div className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-xl transition-all cursor-pointer border border-transparent active:scale-95">
                                <div className="w-10 h-10 rounded-xl border-2 border-white/20 overflow-hidden flex items-center justify-center bg-[#006ce4] shadow-lg shadow-black/20 group-hover:border-white/40">
                                    {userData.avatar ? (
                                        <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white text-lg font-black">{userData.full_name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="hidden sm:block">
                                    <div className="text-xs font-black text-white leading-tight uppercase tracking-wide">{userData.full_name.split(' ').pop()}</div>
                                    <div className={`flex items-center gap-1 mt-0.5 ${membership.bg} w-fit px-1.5 py-0.5 rounded`}>
                                        <span className={`text-[10px] font-black ${membership.color} uppercase tracking-widest`}>{membership.label}</span>
                                        {membership.label !== 'Member' && <span className={`material-symbols-outlined text-[12px] ${membership.color}`}>{membership.icon}</span>}
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-white/50 group-hover:rotate-180 transition-transform duration-300">expand_more</span>
                            </div>

                            {/* Profile Dropdown */}
                            <div className='absolute right-0 top-[calc(100%+8px)] hidden group-hover:block z-[110] animate-in fade-in slide-in-from-top-2 duration-200'>
                                <div className='bg-white shadow-2xl rounded-2xl py-3 min-w-[260px] border border-gray-100 overflow-hidden'>
                                    <div className="px-5 py-4 bg-gray-50/50 mb-2 border-b border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tài khoản</p>
                                        <p className="text-sm font-bold text-[#1a1a1a] truncate">{userData.email}</p>
                                    </div>

                                    <button onClick={() => navigate('/profile')} className='w-full text-left px-5 py-3 text-sm font-bold text-gray-700 hover:bg-[#006ce4]/5 hover:text-[#006ce4] flex items-center justify-between group/item transition-colors'>
                                        <div className="flex items-center gap-4">
                                            <span className="material-symbols-outlined text-gray-400 group-hover/item:text-[#006ce4]">person</span>
                                            Thông tin cá nhân
                                        </div>
                                    </button>

                                    <button onClick={() => navigate('/my-bookings')} className='w-full text-left px-5 py-3 text-sm font-bold text-gray-700 hover:bg-[#006ce4]/5 hover:text-[#006ce4] flex items-center justify-between group/item transition-colors'>
                                        <div className="flex items-center gap-4">
                                            <span className="material-symbols-outlined text-gray-400 group-hover/item:text-[#006ce4]">luggage</span>
                                            Đặt chỗ của tôi
                                        </div>
                                    </button>

                                    {['hotelOwner', 'admin', 'staff', 'receptionist', 'accountant'].includes(userData.role) && (
                                        <div className="px-5 py-2 mt-2">
                                            <button
                                                onClick={() => navigate((userData.role === 'admin' || userData.role === 'hotelOwner') ? '/owner' : '/staff')}
                                                className='w-full bg-[#003580] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#002a6b] transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20'
                                            >
                                                <span className="material-symbols-outlined text-lg">dashboard</span>
                                                Quản lý
                                            </button>
                                        </div>
                                    )}

                                    <div className="h-px bg-gray-100 my-2"></div>

                                    <button onClick={handleLogout} className='w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-4 transition-colors'>
                                        <span className="material-symbols-outlined text-lg">logout</span>
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/register')} className="text-white text-sm font-bold hover:bg-white/10 px-4 py-2.5 rounded-xl transition-all border border-white/20">
                                Đăng ký
                            </button>
                            <button onClick={() => navigate('/login')} className="bg-white text-[#003580] px-5 py-2.5 rounded-xl text-sm font-black hover:bg-gray-50 transition-all shadow-lg active:scale-95">
                                Đăng nhập
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row (Nav Links) */}
            <div className="max-w-7xl mx-auto mt-6">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {navLinks.map((link, i) => (
                        <NavLink
                            key={i}
                            to={link.path}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border-2 
                                ${isActive
                                    ? 'bg-white/10 border-white text-white shadow-lg'
                                    : 'border-transparent text-white/80 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined text-xl">
                                {link.path === '/' ? 'bed' : link.path === '/rooms' ? 'key' : link.path === '/services' ? 'local_dining' : link.path === '/promotions' ? 'loyalty' : 'contact_support'}
                            </span>
                            <span>{link.name}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
