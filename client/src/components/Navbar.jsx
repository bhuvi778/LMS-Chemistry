import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { Atom, Menu, X, LogOut, LayoutDashboard, ShieldCheck, UserCircle, BookOpen, Trophy, Info, Home, User, Clock, ClipboardList, BookMarked, HelpCircle, ChevronDown, Rss, Mail, Crown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import NotificationBell from './NotificationBell.jsx';

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/ebooks', label: 'E-Books', icon: BookMarked },
  { to: '/tests', label: 'Test Series', icon: ClipboardList },
  { to: '/feed', label: 'Feed', icon: Rss },
];

const moreLinks = [
  { to: '/results', label: 'Results', icon: Trophy },
  { to: '/about', label: 'About', icon: Info },
  { to: '/contact', label: 'Contact Us', icon: Mail },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const [highestPlan, setHighestPlan] = useState('Free');

  useEffect(() => {
    if (!user || user.role === 'admin') return;
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
  }, [user]);

  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!menu) return;
    const onClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menu]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);



  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${isHome && !scrolled
        ? 'bg-[#050B1F]/95 backdrop-blur-xl border-b border-white/10'
        : 'bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm'
      }`}>
      <div className="container-x h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src={isHome && !scrolled ? '/logo-light.png' : '/logo-dark.png'}
            alt="Ace2Examz Logo"
            className="h-10 w-auto object-contain"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive
                  ? isHome && !scrolled
                    ? 'text-white bg-white/15'
                    : 'text-brand-700 bg-brand-50'
                  : isHome && !scrolled
                    ? 'text-white/75 hover:text-white hover:bg-white/10'
                    : 'text-slate-600 hover:text-brand-700 hover:bg-brand-50/60'
                }`
              }
              end={l.to === '/'}
            >
              {l.label}
            </NavLink>
          ))}

          {/* More dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setMoreMenuOpen(true)}
            onMouseLeave={() => setMoreMenuOpen(false)}
          >
            <button
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 focus:outline-none ${isHome && !scrolled
                  ? 'text-white/75 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-brand-700 hover:bg-brand-50/60'
                }`}
            >
              More <ChevronDown size={14} />
            </button>
            {moreMenuOpen && (
              <div className="absolute left-0 top-full pt-1 w-40 z-50">
                <div className="bg-white rounded-xl shadow-lg border border-slate-100 py-1">
                  {moreLinks.map((sub) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      onClick={() => setMoreMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all ${isActive
                          ? 'text-brand-700 bg-brand-50'
                          : 'text-slate-600 hover:text-brand-700 hover:bg-brand-50/60'
                        }`
                      }
                    >
                      <sub.icon size={14} />
                      {sub.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="hidden md:flex items-center gap-2 relative">

          {!user ? (
            <>
              <Link
                to="/login"
                className={`btn text-sm font-semibold px-4 py-2 rounded-xl transition-all ${isHome && !scrolled
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-brand-700 hover:bg-brand-50'
                  }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet2-500 text-white text-sm font-bold shadow-soft hover:-translate-y-0.5 hover:shadow-glow transition-all"
              >
                Get Started
              </Link>
            </>
          ) : (
            <div className="relative flex items-center gap-2" ref={profileMenuRef}>
              {user.role !== 'admin' && highestPlan !== 'Pro' && highestPlan !== 'Infinity' && (
                <Link
                  to="/student/courses"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isHome && !scrolled
                      ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-amber-50 border border-amber-200 text-amber-750 hover:bg-amber-100'
                  }`}
                >
                  <Crown size={12} className="text-amber-500 animate-pulse" />
                  Upgrade
                </Link>
              )}
              <NotificationBell darkMode={isHome && !scrolled} />
              <button
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-brand grid place-items-center text-white text-sm font-bold">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-semibold text-slate-700 max-w-[140px] truncate">
                  {user.name}
                </span>
              </button>
              {menu && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-3 bg-gradient-soft border-b border-slate-100">
                    <div className="text-xs text-slate-500">Signed in as</div>
                    <div className="font-semibold text-slate-800 text-sm truncate">
                      {user.email}
                    </div>
                    {user.studentId && (
                      <div className="text-[11px] text-brand-700 font-semibold mt-0.5 font-mono">
                        ID: {user.studentId}
                      </div>
                    )}
                  </div>
                  <Link
                    to="/student/profile"
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-sm"
                  >
                    <UserCircle size={16} /> My Profile
                  </Link>
                  {user.role !== 'admin' && (
                    <Link
                      to="/student/dashboard"
                      onClick={() => setMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-sm"
                    >
                      <LayoutDashboard size={16} /> My Dashboard
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-sm"
                    >
                      <ShieldCheck size={16} /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMenu(false);
                      nav('/');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-rose-50 text-sm text-rose-600 border-t border-slate-100"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className={`md:hidden p-2 rounded-lg transition ${isHome && !scrolled ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white shadow-lg">
          <div className="container-x py-3 flex flex-col gap-1">

            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${isActive ? 'text-brand-700 bg-brand-50' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
                end={l.to === '/'}
              >
                <l.icon size={16} /> {l.label}
              </NavLink>
            ))}

            <div className="border-t border-slate-100 my-1 pt-1">
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">More</div>
              {moreLinks.map((sub) => (
                <NavLink
                  key={sub.to}
                  to={sub.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition ${isActive ? 'text-brand-700 bg-brand-50' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <sub.icon size={16} /> {sub.label}
                </NavLink>
              ))}
            </div>
            <div className="flex gap-2 pt-2 flex-wrap">
              {!user ? (
                <>
                  <Link to="/login" className="btn-outline flex-1" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary flex-1"
                    onClick={() => setOpen(false)}
                  >
                    Register
                  </Link>
                </>
              ) : (
                <>
                  {user.role !== 'admin' && highestPlan !== 'Pro' && highestPlan !== 'Infinity' && (
                    <Link
                      to="/student/courses"
                      onClick={() => setOpen(false)}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-2.5 rounded-2xl text-sm shadow-soft transition-all mb-1"
                    >
                      <Crown size={16} /> Upgrade Plan
                    </Link>
                  )}
                  <Link
                    to="/student/profile"
                    className="btn-outline flex-1 min-w-[45%]"
                    onClick={() => setOpen(false)}
                  >
                    <User size={16} /> Profile
                  </Link>
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/student/dashboard'}
                    className="btn-outline flex-1 min-w-[45%]"
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    {user.role === 'admin' ? 'Admin' : 'Dashboard'}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="btn-primary w-full"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
