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
  Lock,
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
  SquareStack,
} from 'lucide-react';

const WhatsAppIcon = ({ size = 16, className = 'text-slate-400' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    width={size}
    height={size}
    className={className}
    fill="currentColor"
  >
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg>
);

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
    title: 'PREP ARENA',
    icon: Layers,
    items: [
      { to: '/student/flashcards', label: 'Flash Card', icon: SquareStack }
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

  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const isProfileIncomplete = user && user.role === 'student' && (
    !user.grade || !user.stream || !user.board || !user.exams || !user.language || !user.state || !user.city || !user.category
  );

  const [profileForm, setProfileForm] = useState({
    grade: '',
    stream: '',
    board: '',
    exams: '',
    language: '',
    state: '',
    city: '',
    category: '',
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        setCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error('Failed to load categories', err);
      });
  }, []);

  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        grade: user.grade || '',
        stream: user.stream || '',
        board: user.board || '',
        exams: user.exams || '',
        language: user.language || '',
        state: user.state || '',
        city: user.city || '',
        category: user.category || '',
      });
      if (user.phone) {
        setVerifyPhone(user.phone);
      }
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.grade || !profileForm.stream || !profileForm.board || !profileForm.exams || !profileForm.language || !profileForm.state || !profileForm.city || !profileForm.category) {
      toast.error('All profile fields are mandatory');
      return;
    }
    setProfileSaving(true);
    try {
      const { data } = await api.put('/auth/me', profileForm);
      toast.success('Profile details updated successfully! Welcome to Ace2Examz.');
      if (setUser) {
        setUser(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    api.get('/enroll/me')
      .then(res => {
        const enrolls = res.data || [];
        if (enrolls.length === 0) {
          setHighestPlan('Free');
          return;
        }
        
        let highestType = 'free';
        let customPlanName = '';

        enrolls.forEach(e => {
          const type = e.planType || 'batch';
          const coursePlans = e.course?.plans || {};
          const customName = coursePlans[type]?.name;
          
          if (type === 'infinity') {
            highestType = 'infinity';
            customPlanName = customName || 'Infinity Plan';
          } else if (type === 'pro' && highestType !== 'infinity') {
            highestType = 'pro';
            customPlanName = customName || 'Pro Plan';
          } else if (type === 'batch' && highestType === 'free') {
            highestType = 'batch';
            customPlanName = customName || 'Starter Plan';
          }
        });

        if (highestType === 'free') {
          setHighestPlan('Free');
        } else {
          setHighestPlan(customPlanName);
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

  // If student role and phone is empty or not verified
  if (user && user.role === 'student' && (!user.phone || !user.isWhatsappVerified)) {
    const handleSendOtp = async (e) => {
      e.preventDefault();
      const trimmedPhone = verifyPhone.trim();
      if (!trimmedPhone) {
        toast.error('Please enter your mobile number');
        return;
      }
      if (!/^\+91\d{10}$/.test(trimmedPhone)) {
        toast.error('Please enter a valid 10-digit mobile number');
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
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">+91</span>
                    <input
                      type="tel"
                      required
                      className="w-full text-sm border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white disabled:opacity-60 transition"
                      value={verifyPhone ? String(verifyPhone).replace(/^\+?91\s?/, '') : ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^\+?91\s?/, '').replace(/\D/g, '').slice(0, 10);
                        setVerifyPhone(val ? '+91' + val : '');
                      }}
                      placeholder="98765 43210"
                      disabled={verifyBusy}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-normal">
                    Required to verify your account and receive class communications via WhatsApp.
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
          const filteredItems = section.items;
          if (filteredItems.length === 0) return null;

          const isOpen = !!openGroups[section.title];
          const hasActiveChild = filteredItems.some(
            (item) => !item.to.startsWith('http') && (location.pathname === item.to || location.pathname.startsWith(item.to + '/'))
          );

          // Render direct links if isDirect is true or if it only contains 1 item
          if (filteredItems.length === 1 || section.isDirect) {
            return (
              <div key={section.title} className="space-y-1">
                {filteredItems.map((item) => {
                  const isExternal = item.to.startsWith('http');
                  if (isExternal) {
                    const isWhatsapp = item.to.includes('whatsapp.com');
                    return (
                      <a
                        key={item.to}
                        href={item.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          {isWhatsapp ? (
                            <WhatsAppIcon size={16} className="text-emerald-500 animate-pulse" />
                          ) : (
                            <item.icon size={16} className="text-slate-400" />
                          )}
                          <span>{item.label}</span>
                        </div>
                      </a>
                    );
                  }
                  const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                  const isLocked = item.to === '/student/exam-counter' && (!highestPlan || highestPlan === 'Free');
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
                      {isLocked && <Lock size={12} className="text-slate-500 shrink-0" />}
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
                    const isExternal = item.to.startsWith('http');
                    if (isExternal) {
                      const isWhatsapp = item.to.includes('whatsapp.com');
                      return (
                        <a
                          key={item.to}
                          href={item.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                        >
                          {isWhatsapp ? (
                            <WhatsAppIcon size={14} className="text-emerald-500" />
                          ) : (
                            <item.icon size={14} className="text-slate-500" />
                          )}
                          <span>{item.label}</span>
                        </a>
                      );
                    }
                     const isItemActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                     const isLocked = item.to === '/student/exam-counter' && (!highestPlan || highestPlan === 'Free');
                     return (
                       <NavLink
                         key={item.to}
                         to={item.to}
                         onClick={() => setMobileOpen(false)}
                         className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${isItemActive
                           ? 'text-white font-bold bg-gradient-brand shadow-sm scale-[1.02]'
                           : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                           }`}
                       >
                         <div className="flex items-center gap-3">
                           <item.icon size={14} className={isItemActive ? 'text-white' : 'text-slate-500'} />
                           <span>{item.label}</span>
                         </div>
                         {isLocked && <Lock size={11} className="text-slate-500 shrink-0" />}
                       </NavLink>
                     );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* WhatsApp Channel pinned at bottom of upper nav section */}
      <div className="p-4 border-t border-slate-800/40 bg-slate-900/50">
        <a
          href="https://www.whatsapp.com/channel/0029Vb6vGgl7oQhVzPOMuL05"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-455 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-355 border border-emerald-950/30 transition duration-200"
        >
          <WhatsAppIcon size={14} className="text-emerald-500 animate-pulse" />
          <span>WhatsApp Channel</span>
        </a>
      </div>

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
    <div className="min-h-screen md:h-screen bg-slate-50/60 flex flex-col md:flex-row font-sans overflow-y-auto md:overflow-hidden">
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
      <aside className="hidden md:block w-64 sticky top-0 shrink-0 shadow-sm z-20 h-screen">
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
                ✨ {highestPlan.toLowerCase().includes('plan') ? highestPlan : `${highestPlan} Plan`}
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

            <a
              href="https://www.whatsapp.com/channel/0029Vb6vGgl7oQhVzPOMuL05"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-100/50 px-3.5 py-1.5 rounded-xl text-xs font-bold transition"
              title="Join WhatsApp Channel"
            >
              <WhatsAppIcon size={14} className="text-emerald-500 animate-pulse" />
              <span>WhatsApp Channel</span>
            </a>

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

        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 md:overflow-y-auto flex flex-col justify-between">
          <div className="max-w-5xl mx-auto w-full flex-1">
            <Outlet />
          </div>
          <footer className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 max-w-5xl mx-auto w-full">
            © {new Date().getFullYear()} Ace2Examz. All rights reserved.
          </footer>
        </main>
      </div>
      {isProfileIncomplete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden my-8">
            <div className="h-2 w-full bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500" />
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center">
                <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Complete Your Profile
                </span>
                <h2 className="font-display text-2xl font-black text-slate-800 mt-2">Almost there!</h2>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                  Please provide your academic and location details to personalize your experience. All fields are mandatory.
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide mb-1">Class/Grade</label>
                    <select
                      required
                      value={profileForm.grade}
                      onChange={(e) => setProfileForm({ ...profileForm, grade: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    >
                      <option value="">Select Class</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                      <option value="Class 12+">Class 12+ (Dropper)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide mb-1">Stream</label>
                    <select
                      required
                      value={profileForm.stream}
                      onChange={(e) => setProfileForm({ ...profileForm, stream: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    >
                      <option value="">Select Stream</option>
                      <option value="Medical">Medical</option>
                      <option value="Non-Medical">Non-Medical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide mb-1">School Board</label>
                    <select
                      required
                      value={profileForm.board}
                      onChange={(e) => setProfileForm({ ...profileForm, board: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    >
                      <option value="">Select Board</option>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="IB">IB</option>
                      <option value="IGCSE">IGCSE</option>
                      <option value="State Board">State Board</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide mb-1">Target Exam</label>
                    <select
                      required
                      value={profileForm.exams}
                      onChange={(e) => setProfileForm({ ...profileForm, exams: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    >
                      <option value="">Select Target</option>
                      <option value="JEE">JEE</option>
                      <option value="NEET">NEET</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide mb-1">Preferred Language</label>
                    <select
                      required
                      value={profileForm.language}
                      onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    >
                      <option value="">Select Language</option>
                      <option value="English">English</option>
                      <option value="Hinglish">Hinglish</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide mb-1">State</label>
                    <select
                      required
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      placeholder="e.g. Ludhiana, Jaipur"
                      className="w-full text-xs border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wide mb-1">Exam Category</label>
                    <select
                      required
                      value={profileForm.category}
                      onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    >
                      <option value="">Select Exam Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id || cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={13} /> Logout
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="flex-[2] py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {profileSaving ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    Submit Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <SupportChatWidget />
    </div>
  );
}
