import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import SupportChatWidget from './SupportChatWidget.jsx';
import {
  Home,
  Video,
  ListChecks,
  Library,
  Flame,
  Coins,
  Users,
  User,
  ShoppingBag,
  Rss,
  Phone,
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  ArrowRight,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Clock,
} from 'lucide-react';

const navSections = [
  {
    title: 'MAIN',
    icon: Home,
    isDirect: true,
    items: [
      { to: '/student/dashboard', label: 'Home', icon: Home },
      { to: '/student/ask-prepiify', label: 'Ask Prepiify', icon: MessageSquare },
    ]
  },
  {
    title: 'LEARN',
    icon: Library,
    items: [
      { to: '/student/courses', label: 'Courses', icon: Video },
      { to: '/student/practice', label: 'Practice', icon: ListChecks },
      { to: '/student/library', label: 'Library', icon: Library },
      { to: '/student/doubts', label: 'Ask Doubts', icon: HelpCircle },
    ]
  },
  {
    title: 'STATS',
    icon: Flame,
    items: [
      { to: '/student/streak', label: 'Streak', icon: Flame },
      { to: '/student/wallet', label: 'Coins Wallet', icon: Coins },
      { to: '/student/refer', label: 'Refer & Earn', icon: Users },
    ]
  },
  {
    title: 'ACCOUNT',
    icon: User,
    items: [
      { to: '/student/profile', label: 'My Profile', icon: User },
      { to: '/student/orders', label: 'My Orders', icon: ShoppingBag },
    ]
  },
  {
    title: 'MORE',
    icon: Shield,
    items: [
      { to: '/student/feed', label: 'Feed', icon: Rss },
      { to: '/student/contact', label: 'Contact Us', icon: Phone },
      { to: '/student/privacy-policy', label: 'Privacy Policy', icon: Shield },
    ]
  }
];

export default function StudentLayout() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [uaeTime, setUaeTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: 'Asia/Dubai',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      setUaeTime(formatter.format(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync user profile data on load to ensure streak & coins are up to date
  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        if (res.data && setUser) {
          setUser(res.data);
        }
      })
      .catch(() => { });
  }, [location.pathname]);

  // Open the group containing the active item automatically
  useEffect(() => {
    const initialOpen = {};
    navSections.forEach((section) => {
      const hasActiveChild = section.items.some(
        (item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/')
      );
      if (hasActiveChild) {
        initialOpen[section.title] = true;
      }
    });
    setOpenGroups((prev) => ({ ...initialOpen, ...prev }));
  }, [location.pathname]);

  const toggleGroup = (title) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userInitials = (user?.name || '?')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex justify-center">
        <Link to="/" className="flex items-center group">
          <img
            src="/logo-light.png"
            alt="Ace2Examz Logo"
            className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            onError={(e) => { e.currentTarget.src = "/logo-dark.png"; }}
          />
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2 no-scrollbar">
        {navSections.map((section) => {
          const isOpen = !!openGroups[section.title];
          const hasActiveChild = section.items.some(
            (item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/')
          );

          // Render direct links if isDirect is true or if it only contains 1 item
          if (section.items.length === 1 || section.isDirect) {
            return (
              <div key={section.title} className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${isActive
                        ? 'bg-gradient-brand text-white shadow-soft font-black scale-[1.02]'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                        <span>{item.label}</span>
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            );
          }

          // Otherwise render dropdown toggle and list
          return (
            <div key={section.title} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(section.title)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${hasActiveChild
                  ? 'text-white bg-slate-800/60 font-black'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <section.icon size={16} className={hasActiveChild ? 'text-brand-400' : 'text-slate-400'} />
                  <span>{section.title}</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`transform transition-transform duration-200 text-slate-500 ${isOpen ? 'rotate-180 text-slate-300' : ''
                    }`}
                />
              </button>

              {isOpen && (
                <div className="pl-9 pr-1 py-1 space-y-1">
                  {section.items.map((item) => {
                    const isItemActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${isItemActive
                          ? 'text-white font-bold bg-gradient-brand shadow-sm scale-[1.02]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                          }`}
                      >
                        <item.icon size={14} className={isItemActive ? 'text-white' : 'text-slate-500'} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-slate-800/40 transition">
          <div className="relative shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-800"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center">
                {userInitials}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">{user?.name || 'Student'}</h4>
            <span className="text-[9px] text-slate-500 font-mono tracking-wider truncate block">{user?.studentId}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition duration-200 border border-slate-800"
        >
          <LogOut size={13} />
          <span>Logout Workspace</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Bar */}
      <header className="md:hidden h-16 bg-white border-b border-slate-100 px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <Link to="/" className="flex items-center">
          <img
            src="/logo-dark.png"
            alt="Ace2Examz Logo"
            className="h-8 w-auto object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </Link>
        <div className="flex items-center gap-2">
          {/* Mobile Streak & Wallet indicators */}
          <Link to="/student/streak" className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-100/50">
            🔥 {user?.streak || 0}
          </Link>
          <Link to="/student/wallet" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-yellow-100/50">
            🪙 {user?.coins || 0}
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 transition"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:block w-64 sticky top-0 h-screen shrink-0 shadow-sm z-20">
        {sidebarContent}
      </aside>

      {/* Sidebar - Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
          {/* Sidebar content */}
          <div className="relative flex flex-col w-64 max-w-xs h-full bg-slate-900 animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Content Area & Global Header */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Content Header (Desktop Only) */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-100 px-8 items-center justify-between sticky top-0 z-10">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace</span>
            <h2 className="text-xs font-bold text-slate-700 mt-0.5 capitalize">
              {(() => {
                const pageNameMap = {
                  dashboard: 'Dashboard', courses: 'My Courses', practice: 'Practice Tests',
                  library: 'Library', doubts: 'Ask Doubts', streak: 'Streak', wallet: 'Coins Wallet',
                  refer: 'Refer & Earn', profile: 'My Profile', orders: 'My Orders',
                  feed: 'Feed', contact: 'Contact Us', 'privacy-policy': 'Privacy Policy',
                  'ask-prepiify': 'Ask Prepiify', learn: 'Course Player',
                };
                const segments = location.pathname.split('/').filter(Boolean);
                // Find last non-ObjectId segment
                const lastSeg = [...segments].reverse().find(s => !/^[a-f0-9]{24}$/.test(s));
                return pageNameMap[lastSeg] || lastSeg?.replace(/-/g, ' ') || 'Dashboard';
              })()}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* UAE Time Indicator (Header) */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-650">
              <Clock size={13} className="text-slate-400" />
              <span>UAE Time: {uaeTime}</span>
            </div>

            {/* Quick stats indicators */}
            <Link
              to="/student/streak"
              className="flex items-center gap-2 bg-amber-50/70 border border-amber-100/50 hover:bg-amber-100/60 text-amber-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition"
              title="Daily Attendance Streak"
            >
              <Flame size={14} className="text-amber-500 animate-pulse" />
              <span>{user?.streak || 0} Days Streak</span>
            </Link>
            <Link
              to="/student/wallet"
              className="flex items-center gap-2 bg-yellow-50/70 border border-yellow-100/50 hover:bg-yellow-100/60 text-yellow-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition"
              title="Ace Coins Balance"
            >
              <Coins size={14} className="text-yellow-500" />
              <span>{user?.coins || 0} Ace Coins</span>
            </Link>

            <span className="h-6 w-px bg-slate-200" />

            {/* Profile trigger */}
            <Link to="/student/profile" className="flex items-center gap-2 hover:opacity-80 transition">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-100"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                  {userInitials}
                </div>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
          <div className="max-w-5xl mx-auto w-full flex-1">
            <Outlet />
          </div>
          <footer className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 max-w-5xl mx-auto w-full">
            © {new Date().getFullYear()} Ace2Examz. All rights reserved.
          </footer>
        </main>
      </div>
      <SupportChatWidget />
    </div>
  );
}
