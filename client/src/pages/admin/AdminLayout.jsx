import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import NotificationBell from '../../components/NotificationBell.jsx';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Trophy,
  MessageSquare,
  Video,
  LogOut,
  Sparkles,
  Layers,
  ClipboardList,
  ListChecks,
  Banknote,
  CreditCard,
  ImageIcon,
  Library,
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
  Menu,
  Flag,
  Shield,
} from 'lucide-react';

const groups = [
  {
    title: 'Learning',
    icon: BookOpen,
    items: [
      { to: '/admin/categories', label: 'Categories', icon: Layers },
      { to: '/admin/courses', label: 'Courses', icon: BookOpen },
      { to: '/admin/live-classes', label: 'Live Classes', icon: Video },
      { to: '/admin/ebooks', label: 'Library', icon: Library },
      { to: '/admin/doubts', label: 'Doubts', icon: HelpCircle },
      { to: '/admin/support/chat', label: 'Chat Support', icon: MessageSquare },
    ],
  },
  {
    title: 'Ace Track',
    icon: Sparkles,
    items: [
      { to: '/admin/syllabus-tracker', label: 'Syllabus Tracker', icon: ClipboardList },
      { to: '/admin/exam-counter', label: 'Exam Counter', icon: Clock },
      { to: '/admin/mentorship', label: '1:1 Mentorship', icon: Users },
    ],
  },
  {
    title: 'Practice',
    icon: ListChecks,
    items: [
      { to: '/admin/test-series', label: 'Test Series', icon: ListChecks },
      { to: '/admin/tests', label: 'Test Bank', icon: ClipboardList },
      { to: '/admin/reported-questions', label: 'Reported Questions', icon: Flag },
    ],
  },
  {
    title: 'Finance',
    icon: CreditCard,
    items: [
      { to: '/admin/payments', label: 'Payments', icon: CreditCard },
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
  {
    title: 'Security',
    icon: Shield,
    items: [
      { to: '/admin/security', label: 'Device & Sessions', icon: Shield },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const n = useNavigate();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});

  const [sidebarOpen, setSidebarOpen] = useState(false);



  useEffect(() => {
    const initialOpen = {};
    groups.forEach((group) => {
      const hasActiveChild = group.items.some(
        (item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/')
      );
      if (hasActiveChild) initialOpen[group.title] = true;
    });
    setOpenGroups(initialOpen);
  }, [location.pathname]);

  const toggleGroup = (title) => setOpenGroups((prev) => {
    const wasOpen = !!prev[title];
    return {
      [title]: !wasOpen
    };
  });

  const currentPageLabel = (() => {
    for (const g of groups) {
      for (const item of g.items) {
        if (location.pathname === item.to || location.pathname.startsWith(item.to + '/')) return item.label;
      }
    }
    return 'Dashboard';
  })();

  const sidebarNav = (
    <>
      <Link
        to="/admin"
        onClick={() => setSidebarOpen(false)}
        className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0"
      >
        <img src="/Ace2exam_white (1).png" alt="Ace2Examz" className="h-8 w-auto object-contain" />
        <div className="leading-tight">
          <div className="text-white font-extrabold text-sm tracking-wide">Ace2Examz</div>
          <div className="text-[10px] text-slate-400 font-medium">Admin Panel</div>
        </div>
      </Link>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <NavLink
          to="/admin"
          end
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${isActive
              ? 'bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/8'
            }`
          }
        >
          <LayoutDashboard size={17} /> Dashboard
        </NavLink>

        {groups.map((group) => {
          const isOpen = !!openGroups[group.title];
          const hasActiveChild = group.items.some(
            (item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/')
          );
          return (
            <div key={group.title}>
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all ${hasActiveChild ? 'text-white bg-white/8' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <group.icon size={16} />
                  <span>{group.title}</span>
                </div>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 text-slate-500 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="mt-0.5 mb-1 space-y-0.5 pl-2">
                  {group.items.map((item) => {
                    const isItemActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2.5 pl-6 pr-3 py-2 rounded-xl text-xs font-medium transition-all ${isItemActive
                          ? 'bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow font-semibold'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                          }`}
                      >
                        <item.icon size={13} /> {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1 shrink-0">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition"
        >
          ← View Site
        </Link>
        <button
          onClick={() => { logout(); n('/'); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-slate-900 text-slate-200 flex flex-col z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        style={window.innerWidth >= 1024 ? { zoom: '1.1' } : {}}
      >
        {sidebarNav}
      </aside>

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* ── Top Navbar ── */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14 gap-4">

            {/* Left: hamburger + breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
              >
                <Menu size={20} />
              </button>
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <span className="text-slate-400 font-medium">Admin</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-700 font-bold truncate">{currentPageLabel}</span>
              </div>
            </div>

            {/* Right: time + user */}
            <div className="flex items-center gap-3 shrink-0">





              <NotificationBell />

              <div className="h-6 w-px bg-slate-200" />

              {/* User badge */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 grid place-items-center text-white text-xs font-black shadow">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="hidden sm:block leading-tight max-w-[130px]">
                  <div className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Admin'}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                </div>
              </div>

            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
