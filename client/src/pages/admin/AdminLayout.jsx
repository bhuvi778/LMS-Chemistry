import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Trophy,
  MessageSquare,
  Video,
  LogOut,
  Atom,
  Sparkles,
  Layers,
  ClipboardList,
  ListChecks,
  Banknote,
  CreditCard,
  ImageIcon,
  Mail,
  HelpCircle,
  BookMarked,
  Tag,
  ChevronDown,
  Bell,
  Rss,
  Star,
  Flame,
  Coins,
  Share2,
  BarChart2,
  Clock,
} from 'lucide-react';

const groups = [
  {
    title: 'Learning',
    icon: BookOpen,
    items: [
      { to: '/admin/categories', label: 'Categories', icon: Layers },
      { to: '/admin/courses', label: 'Courses', icon: BookOpen },
      { to: '/admin/live-classes', label: 'Live Classes', icon: Video },
      { to: '/admin/ebooks', label: 'E-Books', icon: BookMarked },
      { to: '/admin/doubts', label: 'Doubts', icon: HelpCircle },
      { to: '/admin/support/chat', label: 'Chat Support', icon: MessageSquare },
    ],
  },
  {
    title: 'Practice',
    icon: ListChecks,
    items: [
      { to: '/admin/test-series', label: 'Test Series', icon: ListChecks },
      { to: '/admin/tests', label: 'Test Bank', icon: ClipboardList },
    ],
  },
  {
    title: 'Finance',
    icon: CreditCard,
    items: [
      { to: '/admin/payments', label: 'Payments', icon: CreditCard },
      { to: '/admin/bank-transfers', label: 'Bank Transfer', icon: Banknote },
    ],
  },
  {
    title: 'Sales',
    icon: Users,
    items: [
      { to: '/admin/students', label: 'Students', icon: Users },
      { to: '/admin/enrollments', label: 'Enrollments', icon: FileText },
      { to: '/admin/coupons', label: 'Coupons', icon: Tag },
      { to: '/admin/subscribers', label: 'Subscribers', icon: Mail },
      { to: '/admin/sales/push-notification', label: 'Push Notification', icon: Bell },
      { to: '/admin/sales/popup', label: 'Pop up', icon: Sparkles },
    ],
  },
  {
    title: 'Marketing',
    icon: Sparkles,
    items: [
      { to: '/admin/content/banner', label: 'Hero Banners', icon: ImageIcon },
      { to: '/admin/content/highlight', label: 'Highlights', icon: Sparkles },
      { to: '/admin/content/topper', label: 'Toppers', icon: Trophy },
      { to: '/admin/content/review', label: 'Reviews', icon: MessageSquare },
      { to: '/admin/content/video', label: 'Videos', icon: Video },
      { to: '/admin/marketing/enquiries', label: 'Enquiry', icon: Mail },
      { to: '/admin/marketing/feed', label: 'Feed', icon: Rss },
      { to: '/admin/ratings', label: 'Ratings', icon: Star },
    ],
  },
  {
    title: 'Stats',
    icon: BarChart2,
    items: [
      { to: '/admin/stats/streak', label: 'Streak Data', icon: Flame },
      { to: '/admin/stats/wallet', label: 'Ace Coin Wallet', icon: Coins },
      { to: '/admin/stats/refer', label: 'Refer & Earn', icon: Share2 },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const n = useNavigate();
  const location = useLocation();
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

  useEffect(() => {
    const initialOpen = {};
    groups.forEach((group) => {
      const hasActiveChild = group.items.some(
        (item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/')
      );
      if (hasActiveChild) {
        initialOpen[group.title] = true;
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col sticky top-0 h-screen">
        <Link to="/admin" className="flex items-center justify-center px-5 py-5 border-b border-white/10">
          <img src="/logo-light.png" alt="Ace2Examz Logo" className="h-9 w-auto object-contain" />
        </Link>
        <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
          {/* Dashboard (standalone at top) */}
          <div>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-gradient-brand text-white shadow-soft'
                    : 'text-slate-300 hover:bg-white/5'
                }`
              }
            >
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
          </div>

          {/* Groups */}
          {groups.map((group) => {
            const isOpen = !!openGroups[group.title];
            const hasActiveChild = group.items.some(
              (item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            );
            return (
              <div key={group.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    hasActiveChild
                      ? 'text-white bg-white/5 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <group.icon size={18} />
                    <span>{group.title}</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`transform transition-transform duration-200 text-slate-400 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="space-y-1 pt-0.5">
                    {group.items.map((item) => {
                      const isItemActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={
                            `flex items-center gap-3 pl-8 pr-3 py-2 rounded-lg text-xs font-medium transition ${
                              isItemActive
                                ? 'bg-gradient-brand text-white shadow-soft font-semibold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`
                          }
                        >
                          <item.icon size={14} className="opacity-80" /> {item.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-2.5">
          <div className="px-2 py-1.5 bg-slate-800/40 rounded-lg border border-white/5 text-center">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">UAE Local Time</span>
            <span className="text-[10px] font-mono font-bold text-slate-300 flex items-center justify-center gap-1">
              <Clock size={11} className="text-slate-450 shrink-0" />
              {uaeTime}
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-400 px-2 mb-1">Signed in as</div>
            <div className="px-2 text-sm font-semibold text-white truncate">{user?.email}</div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 mt-2 rounded-lg text-sm text-slate-300 hover:bg-white/5"
          >
            ← View Site
          </Link>
          <button
            onClick={() => {
              logout();
              n('/');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-300 hover:bg-rose-500/10"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 sm:p-8 main-content-area">
        <Outlet />
      </main>
    </div>
  );
}
