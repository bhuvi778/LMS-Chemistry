import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import toast from 'react-hot-toast';
import SupportChatWidget from './SupportChatWidget.jsx';
import NotificationBell from './NotificationBell.jsx';
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
  BookOpen,
  Bookmark,
  Flag,
  Calendar,
  Sparkles,
  ClipboardList,
  DownloadCloud,
  XCircle,
  Repeat,
  Layers,
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
      { to: '/student/courses', label: 'Courses', icon: BookOpen },
      { to: '/student/test-series', label: 'My Test Series', icon: Layers },
      { to: '/student/live-classes', label: 'Live Classes', icon: Video },
      { to: '/student/library', label: 'Library', icon: Library },
      { to: '/student/downloads', label: 'My Downloads', icon: DownloadCloud },
      { to: '/student/doubts', label: 'Ask Doubts', icon: HelpCircle },
    ]
  },
  {
    title: 'PRACTICE HUB',
    icon: ListChecks,
    items: [
      { to: '/student/practice', label: 'Practice', icon: ListChecks },
      { to: '/student/my-mistakes', label: 'My Mistakes', icon: XCircle },
      { to: '/student/revision-queue', label: 'Revision Queue', icon: Repeat },
      { to: '/student/saved-questions', label: 'Saved Questions', icon: Bookmark },
      { to: '/student/reported-questions', label: 'Reported Questions', icon: Flag },
    ]
  },
  {
    title: 'ACE TRACK',
    icon: Sparkles,
    items: [
      { to: '/student/syllabus-tracker', label: 'Syllabus Tracker', icon: ClipboardList },
      { to: '/student/planner', label: 'My Planner', icon: Calendar },
      { to: '/student/exam-counter', label: 'Exam Counter', icon: Clock },
      { to: '/student/mentorship', label: '1:1 Mentorship', icon: Users },
    ]
  },
  {
    title: 'STATS',
    icon: Flame,
    items: [
      { to: '/student/streak', label: 'Streak', icon: Flame },
      { to: '/student/wallet', label: 'Coins Wallet', icon: Coins },
      { to: '/student/refer', label: 'Refer & Earn', icon: Users },
      { to: '/student/watch-history', label: 'Watch History', icon: Clock },
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
      { to: '/student/support', label: 'Chat Support', icon: MessageSquare },
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
  const [highestPlan, setHighestPlan] = useState('');
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyStep, setVerifyStep] = useState(1);
  const [verifyBusy, setVerifyBusy] = useState(false);

  useEffect(() => {
    api.get('/enroll/me')
      .then(res => {
        const enrolls = res.data || [];
        if (enrolls.length === 0) {
          setHighestPlan('Free');
          return;
        }
        const plans = enrolls.map(e => e.planType || 'batch');
        if (plans.includes('infinity')) {
          setHighestPlan('Infinity');
        } else if (plans.includes('pro')) {
          setHighestPlan('Pro');
        } else if (plans.includes('batch')) {
          setHighestPlan('Batch');
        }
      })
      .catch(() => {
        setHighestPlan('Free');
      });
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
  }, []);

  // Inactivity timeout auto-logout
  useEffect(() => {
    if (!user || user.role !== 'student') return;

    // Get timeout duration in minutes, default to 10
    const timeoutMins = user.studentSessionTimeout || 10;
    const timeoutMs = timeoutMins * 60 * 1000;

    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        navigate('/');
        toast.error(`You have been logged out due to inactivity for ${timeoutMins} minutes.`, {
          duration: 6000,
          id: 'inactivity-logout-toast'
        });
      }, timeoutMs);
    };

    // Events to monitor for activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Initialize timer
    resetTimer();

    // Bind events
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, navigate, logout]);

  // If student role and phone is empty or not verified
  if (user && user.role === 'student' && (!user.phone || !user.isWhatsappVerified)) {
    const handleSendOtp = async (e) => {
      e.preventDefault();
      const trimmedPhone = verifyPhone.trim();
      if (!trimmedPhone) {
        toast.error('Please enter your mobile number');
        return;
      }
      if (!/^\+?\d{9,15}$/.test(trimmedPhone)) {
        toast.error('Please enter a valid phone number (including country code, e.g. +919999999999)');
        return;
      }
      setVerifyBusy(true);
      try {
        await api.post('/auth/request-phone-verification', { phone: trimmedPhone });
        toast.success('Verification OTP sent to WhatsApp!');
        setVerifyStep(2);
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Failed to send OTP');
      } finally {
        setVerifyBusy(false);
      }
    };

    const handleVerifyOtp = async (e) => {
      e.preventDefault();
      const trimmedCode = verifyCode.trim();
      if (!trimmedCode || trimmedCode.length !== 6) {
        toast.error('Please enter the 6-digit verification code');
        return;
      }
      setVerifyBusy(true);
      try {
        const { data } = await api.post('/auth/verify-phone-verification', { code: trimmedCode, phone: verifyPhone.trim() });
        toast.success('Mobile number verified successfully!');
        if (setUser) {
          setUser(data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Verification failed');
      } finally {
        setVerifyBusy(false);
      }
    };

    const handleLogout = () => {
      logout();
      navigate('/');
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden">
          {/* Header Accent */}
          <div className="h-2 w-full bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500" />
          
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 text-brand-650 flex items-center justify-center mx-auto shadow-sm">
              <Phone size={28} className="text-brand-600" />
            </div>

            <div>
              <h2 className="font-display text-2xl font-black text-slate-800">Verify Mobile Number</h2>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                A verified WhatsApp mobile number is required to proceed. This helps secure your account and link your learning progress.
              </p>
            </div>

            {verifyStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5 uppercase tracking-wider">WhatsApp Number</label>
                  <input
                    type="tel"
                    required
                    value={verifyPhone}
                    onChange={(e) => setVerifyPhone(e.target.value)}
                    placeholder="e.g. +919876543210"
                    disabled={verifyBusy}
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white disabled:opacity-60 transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-normal">
                    Important: Include your country code (e.g. +91 for India) without spaces or hyphens.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifyBusy}
                  className="btn-primary w-full py-3 justify-center text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition disabled:opacity-60 flex items-center gap-2"
                >
                  {verifyBusy ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  Send Verification OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-655 mb-1.5 uppercase tracking-wider">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter OTP code"
                    disabled={verifyBusy}
                    className="w-full text-center text-lg font-bold letter-spacing-wide border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white disabled:opacity-60 transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-normal text-center">
                    We sent a 6-digit OTP code to <strong className="text-slate-600">{verifyPhone}</strong> via WhatsApp.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifyBusy}
                  className="btn-primary w-full py-3 justify-center text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition disabled:opacity-60 flex items-center gap-2"
                >
                  {verifyBusy ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  Verify OTP & Enter
                </button>

                <div className="flex justify-between items-center text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setVerifyStep(1)}
                    disabled={verifyBusy}
                    className="text-slate-500 hover:text-slate-700 font-bold hover:underline"
                  >
                    Change Number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={verifyBusy}
                    className="text-brand-600 hover:text-brand-750 font-bold hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            <div className="border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-800 text-xs font-bold transition"
              >
                <LogOut size={14} /> Log Out of Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
    setOpenGroups(initialOpen);
  }, [location.pathname]);

  const toggleGroup = (title) => {
    setOpenGroups((prev) => {
      const wasOpen = !!prev[title];
      return {
        [title]: !wasOpen
      };
    });
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
          const filteredItems = section.items.filter((item) => {
            if (item.to === '/student/exam-counter') {
              return highestPlan && highestPlan !== 'Free';
            }
            return true;
          });
          if (filteredItems.length === 0) return null;

          const isOpen = !!openGroups[section.title];
          const hasActiveChild = filteredItems.some(
            (item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/')
          );

          // Render direct links if isDirect is true or if it only contains 1 item
          if (filteredItems.length === 1 || section.isDirect) {
            return (
              <div key={section.title} className="space-y-1">
                {filteredItems.map((item) => {
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
                  {filteredItems.map((item) => {
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
    <div className="h-screen bg-slate-50/60 flex flex-col md:flex-row font-sans overflow-hidden">
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
          <NotificationBell />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 transition"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:block w-64 sticky top-0 h-screen shrink-0 shadow-sm z-20" style={{ zoom: '1.1' }}>
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
        <header className="hidden md:flex h-16 bg-white border-b border-slate-100 px-8 items-center justify-between sticky top-0 z-30">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace</span>
            <h2 className="text-xs font-bold text-slate-700 mt-0.5 capitalize">
              {(() => {
                 const pageNameMap = {
                  dashboard: 'Dashboard', courses: 'My Courses', practice: 'Practice Tests',
                  library: 'Library', doubts: 'Ask Doubts', streak: 'Streak', wallet: 'Coins Wallet',
                  refer: 'Refer & Earn', profile: 'My Profile', orders: 'My Orders',
                  feed: 'Feed', contact: 'Contact Us', 'privacy-policy': 'Privacy Policy',
                  'ask-prepiify': 'Ask Prepiify', learn: 'Course Player', 'live-classes': 'Live Classes',
                  'my-mistakes': 'My Mistakes', 'revision-queue': 'Revision Queue',
                  'saved-questions': 'Saved Questions', 'reported-questions': 'Reported Questions'
                };
                const segments = location.pathname.split('/').filter(Boolean);
                // Find last non-ObjectId segment
                const lastSeg = [...segments].reverse().find(s => !/^[a-f0-9]{24}$/.test(s));
                return pageNameMap[lastSeg] || lastSeg?.replace(/-/g, ' ') || 'Dashboard';
              })()}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {highestPlan && (
              <span className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm">
                ✨ {highestPlan} Plan
              </span>
            )}


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

            <NotificationBell />

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
