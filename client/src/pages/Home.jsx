import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useMotionValue, useTransform } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Award,
  Users,
  BookOpen,
  Trophy,
  Star,
  PlayCircle,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  FlaskConical,
  Atom,
  CheckCircle2,
  Video,
  FileText,
  BarChart3,
  MessageCircle,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Globe,
  Download,
  ChevronDown,
  BookMarked,
  TestTube,
  Brain,
  Flame,
  BadgeCheck,
  ListChecks,
  Headphones,
} from 'lucide-react';
import api from '../api/client.js';
import CourseCard from '../components/CourseCard.jsx';
import ChemHero from '../components/ChemHero.jsx';
import HeroCanvas from '../components/HeroCanvas.jsx';

// Fallback palette — auto-assigned when admin hasn't set a custom icon/color
const CAT_COLORS = ['from-blue-500 to-indigo-600', 'from-green-500 to-emerald-600', 'from-orange-500 to-amber-600', 'from-rose-500 to-pink-600', 'from-violet-500 to-purple-600', 'from-cyan-500 to-sky-600', 'from-teal-500 to-emerald-600', 'from-fuchsia-500 to-purple-600', 'from-yellow-500 to-orange-500', 'from-sky-500 to-blue-600'];
const CAT_ICONS = ['📘', '🧪', '⚗️', '🔬', '📐', '🧬', '🔭', '💡', '📊', '🎯'];

const PLATFORM_FEATURES = [
  { icon: Video, title: '300+ HD Lectures', desc: 'Concept-to-exam lectures covering every chapter in depth.', color: 'from-blue-500 to-indigo-600' },
  { icon: TestTube, title: 'Full-Length Mock Tests', desc: 'Chapter tests, Part-tests & Full syllabus mocks with OMR simulation and detailed solutions.', color: 'from-emerald-500 to-teal-600' },
  { icon: BookMarked, title: 'PYQ Bank (15+ Years)', desc: '15,000+ Previous Year Questions with detailed video & text solutions, exam-wise filtered.', color: 'from-amber-500 to-orange-600' },
  { icon: MessageCircle, title: '24×7 Doubt Support', desc: 'Live doubt sessions daily + dedicated doubt forums. No question goes unanswered.', color: 'from-rose-500 to-pink-600' },
  { icon: FileText, title: 'Study Notes & DPPs', desc: 'Downloadable PDF notes and Daily Practice Problems designed by IIT toppers.', color: 'from-purple-500 to-violet-600' },
  { icon: BarChart3, title: 'AI Progress Tracker', desc: 'Personalised analytics, weak-chapter detection & smart revision scheduling.', color: 'from-cyan-500 to-sky-600' },
  { icon: ListChecks, title: 'Structured Learning Path', desc: 'Scientifically sequenced curriculum: Concept → Solved Examples → DPP → Test → Revision.', color: 'from-brand-500 to-violet2-500' },
  { icon: Headphones, title: 'Live Mentorship', desc: 'Weekly live mentorship sessions to personalise your preparation strategy.', color: 'from-fuchsia-500 to-purple-600' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Choose Your Exam & Course', desc: 'Pick from JEE, NEET, CSIR-NET, GATE, IIT-JAM, TIFR and more. Browse curated batches tailored for every stage.', icon: Target, color: 'from-brand-500 to-indigo-600' },
  { step: '02', title: 'Watch, Practice & Test', desc: 'Learn via HD video lectures, solve DPPs, attempt chapter tests and track progress with our AI analytics dashboard.', icon: Brain, color: 'from-violet2-500 to-fuchsia-600' },
  { step: '03', title: 'Crack & Celebrate', desc: 'Regular mock tests, personalised revision & live doubt support take you to your target rank.', icon: Trophy, color: 'from-amber-500 to-orange-600' },
];

const STATS = [
  { n: '1000+', label: 'Active Learners', icon: Users, color: 'text-brand-600' },
  { n: '300+', label: 'HD Video Lectures', icon: Video, color: 'text-violet2-500' },
  { n: '95%', label: 'Success Rate', icon: TrendingUp, color: 'text-emerald-600' },
  { n: '150+', label: 'Top Selections', icon: Award, color: 'text-amber-600' },
  { n: '4.9★', label: 'Average Rating', icon: Star, color: 'text-rose-500' },
  { n: '15+', label: 'Years PYQ Bank', icon: BookOpen, color: 'text-cyan-600' },
];

const FACULTY = [
  { name: 'Dr. Anupam Sharma', title: 'IIT Delhi · Organic Chemistry', exp: '12 yrs', students: '30K+ students', avatar: 'https://ui-avatars.com/api/?name=Anupam+Sharma&background=3366ff&color=fff&size=120', tags: ['JEE', 'NEET', 'CSIR-NET'] },
  { name: 'Dr. Priya Verma', title: 'IISc Bangalore · Physical Chem', exp: '10 yrs', students: '20K+ students', avatar: 'https://ui-avatars.com/api/?name=Priya+Verma&background=7c3aed&color=fff&size=120', tags: ['GATE', 'IIT-JAM', 'TIFR'] },
  { name: 'Prof. Rohit Gupta', title: 'IIT Bombay · Inorganic Chemistry', exp: '15 yrs', students: '25K+ students', avatar: 'https://ui-avatars.com/api/?name=Rohit+Gupta&background=059669&color=fff&size=120', tags: ['JEE', 'NEET', 'NEST'] },
  { name: 'Dr. Sneha Patel', title: 'IIT Madras · Analytical Chem', exp: '8 yrs', students: '15K+ students', avatar: 'https://ui-avatars.com/api/?name=Sneha+Patel&background=d97706&color=fff&size=120', tags: ['CSIR-NET', 'GATE', 'IAT'] },
];

const FAQS = [
  { q: 'Are the courses available on mobile?', a: 'Yes! Ace2Examz works perfectly on all devices — Android, iOS, tablet and desktop. Download lectures for offline viewing too.' },
  { q: 'What is included in a course?', a: 'Every course includes HD video lectures, PDF notes, DPPs, chapter-wise mock tests, PYQ solving sessions, live doubt classes and progress tracking.' },
  { q: 'How are doubts resolved?', a: 'You can post doubts anytime in our forum. We also conduct live doubt sessions daily where faculty resolves questions in real-time.' },
  { q: 'Is there a free trial available?', a: 'Yes! Selected lectures from every course are available for free. Register to access demo lectures and a free chapter test.' },
  { q: 'Do you provide certificates on course completion?', a: 'Yes, a verified digital certificate is issued upon completing the course and the final assessment.' },
  { q: 'How often is the content updated?', a: 'Content is updated every year to match the latest exam patterns, syllabus changes and new PYQs from all major exams.' },
];

function AnimCounter({ target, duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const raw = target.replace(/[^0-9.]/g, '');
  const isDecimal = raw.includes('.');
  const num = isDecimal ? parseFloat(raw) : (parseInt(raw) || 0);
  const suffix = target.replace(/[0-9.,]/g, '');
  useEffect(() => {
    if (!inView || num === 0 || isDecimal) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(num / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, num, duration, isDecimal]);
  return <span ref={ref}>{(num === 0 || isDecimal) ? target : count.toLocaleString() + suffix}</span>;
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition">
        <span className="font-semibold text-slate-900 pr-4">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={20} className="text-slate-400 shrink-0" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Tilt3D({ children, className, intensity = 7 }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useTransform(y, [0, 1], [intensity, -intensity]);
  const rotateY = useTransform(x, [0, 1], [-intensity, intensity]);
  return (
    <div style={{ perspective: '900px' }} className="h-full">
      <motion.div
        className={className}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={e => {
          const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
          x.set((e.clientX - left) / width);
          y.set((e.clientY - top) / height);
        }}
        onMouseLeave={() => { x.set(0.5); y.set(0.5); }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [courses, setCourses] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [toppers, setToppers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState('ALL');
  const [slide, setSlide] = useState(0);
  const [heroMouse, setHeroMouse] = useState({ x: -200, y: -200 });
  const [activePopup, setActivePopup] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    api.get('/content/banner').then(r => setBanners(r.data)).catch(() => {});
    api.get('/courses?featured=true').then(r => setCourses(r.data)).catch(() => {});
    api.get('/content/highlight').then(r => setHighlights(r.data)).catch(() => {});
    api.get('/content/topper').then(r => setToppers(r.data)).catch(() => {});
    api.get('/content/review').then(r => setReviews(r.data)).catch(() => {});
    api.get('/content/video').then(r => setVideos(r.data)).catch(() => {});
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    api.get('/popups/active').then(r => {
      if (r.data && !localStorage.getItem(`popup_seen_${r.data._id}`)) {
        setActivePopup(r.data);
        setTimeout(() => setShowPopup(true), 1200);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!banners.length) return;
    const t = setInterval(() => setSlide(s => (s + 1) % banners.length), 5500);
    return () => clearInterval(t);
  }, [banners.length]);

  const filteredCourses = activeCat === 'ALL' ? courses : courses.filter(c => c.category === activeCat || (c.categories || []).includes(activeCat));

  return (
    <div className="overflow-x-hidden">

      {/* HERO */}
      <section
        className="relative min-h-[92vh] flex items-center bg-[#050B1F] overflow-hidden"
        onMouseMove={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHeroMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        {/* 3D Molecular Canvas */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <HeroCanvas />
        </div>
        {/* Cursor Glow */}
        <div
          className="absolute inset-0 pointer-events-none z-[1] transition-all duration-200"
          style={{ background: `radial-gradient(560px circle at ${heroMouse.x}px ${heroMouse.y}px, rgba(99,102,241,0.13), transparent 45%)` }}
        />
        <div className="absolute inset-0 pointer-events-none z-[2]">
          <div className="absolute top-0 left-[10%] w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-[5%] w-[500px] h-[500px] rounded-full bg-violet2-500/25 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-fuchsia-600/12 blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:55px_55px]" />
        </div>
        <div className="relative z-10 container-x py-20 grid lg:grid-cols-[1.15fr,1fr] gap-14 items-center w-full">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-sm mb-7">
              <Flame size={14} className="text-amber-400" />
              <span className="text-xs font-bold text-white/90 tracking-wide uppercase">India's #1 Chemistry Learning Platform</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-black">NEW</span>
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.div key={slide} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -22 }} transition={{ duration: 0.5 }}>
                <h1 className="font-display text-5xl sm:text-6xl lg:text-[4rem] xl:text-[4.4rem] font-extrabold leading-[1.05] text-white tracking-tight">
                  {banners[slide]?.title || 'Master Chemistry,'}<br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-violet-400 to-fuchsia-400">Crack Every Exam</span>
                </h1>
                <p className="mt-5 text-base sm:text-lg text-white/65 max-w-2xl leading-relaxed">
                  {banners[slide]?.description || 'JEE · NEET · CSIR-NET · GATE · IIT-JAM · IAT · NEST · TIFR — 600+ HD lectures, 15,000+ PYQs, live doubt classes & AI progress tracking by IIT/IISc faculty.'}
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="flex flex-wrap gap-3 mt-9">
              <Link to={banners[slide]?.link || "/courses"} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet2-500 text-white font-bold text-base shadow-[0_8px_32px_rgba(99,102,241,.45)] hover:-translate-y-0.5 hover:shadow-[0_12px_48px_rgba(99,102,241,.55)] transition-all duration-200">
                Explore All Courses <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-base hover:bg-white/20 hover:-translate-y-0.5 backdrop-blur-sm transition-all duration-200">
                <PlayCircle size={18} className="text-amber-400" /> Try Free Lectures
              </Link>
            </div>
            <div className="flex flex-wrap gap-2.5 mt-8">
              {[{ icon: BadgeCheck, label: 'IIT/IISc Faculty' }, { icon: ShieldCheck, label: '100% Secure' }, { icon: Download, label: 'Offline Access' }, { icon: Zap, label: 'Live Doubt Support' }].map(b => (
                <div key={b.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-white/75 text-xs font-semibold backdrop-blur-sm">
                  <b.icon size={13} className="text-brand-300" />{b.label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-6 mt-12 max-w-md">
              {[{ n: '50K+', l: 'Active Learners' }, { n: '500+', l: 'Top Selections' }, { n: '4.9★', l: 'Average Rating' }].map(s => (
                <div key={s.l} className="text-center">
                  <div className="text-3xl sm:text-4xl font-display font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-violet-400">{s.n}</div>
                  <div className="text-[11px] text-white/50 font-semibold mt-1 uppercase tracking-widest">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative hidden lg:block" style={{ perspective: '1000px' }}>
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-brand-500/20 via-violet2-500/15 to-fuchsia-500/10 blur-2xl" />
            <AnimatePresence mode="wait">
              {banners[slide]?.image ? (
                <motion.div
                  key={`banner-img-${slide}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="relative z-10 w-full aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-[#090e24]/50 backdrop-blur-md"
                >
                  <img
                    src={banners[slide].image}
                    alt={banners[slide].title || 'Hero Banner'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050B1F]/60 via-transparent to-transparent pointer-events-none" />
                </motion.div>
              ) : (
                <motion.div
                  key="default-chem-hero"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <ChemHero className="relative z-10" />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} whileHover={{ y: -4, scale: 1.03 }} className="absolute -bottom-6 -left-8 bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 max-w-[240px] z-20 cursor-default">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center shrink-0">
                <Trophy className="text-white" size={22} />
              </div>
              <div>
                <div className="font-black text-slate-900 text-sm">AIR 12 • JEE Adv 2025</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Chem Score 98/100 🎉</div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} whileHover={{ y: -4, scale: 1.03 }} className="absolute -top-4 -right-6 bg-white rounded-2xl shadow-2xl p-3 flex items-center gap-2.5 z-20 cursor-default">
              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" /></span>
              <div>
                <div className="text-[10px] uppercase font-black text-rose-600 tracking-wide">Live Now</div>
                <div className="text-xs font-bold text-slate-900">Organic Chemistry</div>
                <div className="text-[10px] text-slate-400">1,240 students watching</div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} whileHover={{ y: -4, scale: 1.03 }} className="absolute top-1/2 -right-10 bg-white rounded-2xl shadow-2xl p-4 z-20 min-w-[170px] cursor-default">
              <div className="text-xs font-bold text-slate-500 mb-2">Weekly Progress</div>
              <div className="flex items-end gap-1 h-10">
                {[40, 60, 45, 80, 65, 90, 75].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-brand-500 to-violet2-500 opacity-80" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1"><TrendingUp size={12} /> +24% this week</div>
            </motion.div>
          </div>
        </div>
        {banners.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
            <button onClick={() => setSlide(s => (s - 1 + banners.length) % banners.length)} className="w-8 h-8 rounded-full border border-white/20 bg-white/10 grid place-items-center text-white hover:bg-white/20 transition"><ChevronLeft size={16} /></button>
            <div className="flex gap-1.5">{banners.map((_, i) => <button key={i} onClick={() => setSlide(i)} className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-8 bg-white' : 'w-2.5 bg-white/30'}`} />)}</div>
            <button onClick={() => setSlide(s => (s + 1) % banners.length)} className="w-8 h-8 rounded-full border border-white/20 bg-white/10 grid place-items-center text-white hover:bg-white/20 transition"><ChevronRight size={16} /></button>
          </div>
        )}
      </section>

      {/* EXAM BAR */}
      {categories.length > 0 && (
      <section className="bg-white border-b border-slate-100 shadow-sm">
        <div className="container-x py-4">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 shrink-0">Prepare for</span>
            {categories.map((c, i) => (
              <Link key={c._id} to={`/courses?category=${c.name}`} className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 text-sm font-bold text-slate-600 transition border border-slate-100">
                <span>{c.icon || CAT_ICONS[i % CAT_ICONS.length]}</span> {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* STATS */}
      <section className="py-14 bg-gradient-to-br from-slate-50 to-white">
        <div className="container-x">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <Tilt3D className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-100 shadow-sm text-center gap-2 h-full" intensity={5}>
                  <div className={`${s.color} mb-1`}><s.icon size={26} /></div>
                  <div className="font-display font-black text-2xl text-slate-900"><AnimCounter target={s.n} /></div>
                  <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{s.label}</div>
                </Tilt3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section className="section bg-white">
        <div className="container-x">
          <div className="text-center mb-14">
            <span className="chip bg-brand-50 text-brand-700 border border-brand-100 mb-4"><Sparkles size={13} /> Everything in One Platform</span>
            <h2 className="heading">Everything you need to <span className="gradient-text">crack your exam</span></h2>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto text-base">Ace2Examz isn't just videos — it's a complete chemistry preparation ecosystem.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLATFORM_FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Tilt3D className="group p-6 rounded-2xl bg-white border border-slate-100 hover:border-brand-200 hover:shadow-lg transition-all duration-300 h-full cursor-default">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} grid place-items-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </Tilt3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section bg-[#06091a] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-600/20 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet2-600/20 blur-[100px] rounded-full" />
        </div>
        <div className="relative container-x">
          <div className="text-center mb-16">
            <span className="chip bg-white/10 text-white/80 border border-white/15 mb-4"><Zap size={13} /> Simple 3-Step Journey</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl">How Ace2Examz <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-fuchsia-400">works</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative" style={{ perspective: '1200px' }}>
            <div className="hidden md:block absolute top-16 left-[calc(33.33%+24px)] right-[calc(33.33%+24px)] h-0.5 bg-gradient-to-r from-brand-500 to-violet2-500 opacity-40" />
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.step} initial={{ opacity: 0, y: 30, rotateX: 25 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6, ease: 'easeOut' }}>
                <Tilt3D className="relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition text-center h-full cursor-default" intensity={6}>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} grid place-items-center mx-auto mb-5 shadow-lg`}><step.icon size={28} className="text-white" /></div>
                  <div className="absolute top-4 right-4 font-black text-4xl text-white/5 font-display">{step.step}</div>
                  <h3 className="font-display font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
                </Tilt3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section className="section bg-gradient-to-b from-white to-slate-50">
        <div className="container-x">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <span className="chip bg-brand-50 text-brand-700 border border-brand-100 mb-3"><BookOpen size={13} /> Featured Courses</span>
              <h2 className="heading">Pick the perfect <span className="gradient-text">Chemistry batch</span></h2>
              <p className="text-slate-500 mt-2 max-w-xl">Handpicked, exam-aligned batches with concept lectures, PYQs and full-length tests.</p>
            </div>
            <Link to="/courses" className="btn-outline self-start md:self-auto shrink-0">View All Courses <ArrowRight size={16} /></Link>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-8">
            {['ALL', ...categories.map(c => c.name)].map((k, i) => (
              <button key={k} onClick={() => setActiveCat(k)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCat === k ? 'bg-gradient-brand text-white shadow-soft scale-105' : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700'}`}>
                {k === 'ALL' ? '🌐 All Exams' : `${categories.find(c => c.name === k)?.icon || CAT_ICONS[(i - 1) % CAT_ICONS.length]} ${k}`}
              </button>
            ))}
          </div>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <FlaskConical size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-semibold">No featured courses in this category.</p>
              <Link to="/courses" className="text-brand-600 font-bold mt-2 inline-block">Browse all courses →</Link>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={activeCat} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses.slice(0, 6).map(c => <CourseCard key={c._id} course={c} />)}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* EXAM CATEGORY CARDS */}
      <section className="section bg-white">
        <div className="container-x">
          <div className="text-center mb-12">
            <span className="chip bg-violet-50 text-violet-700 border border-violet-100 mb-4"><Globe size={13} /> All Exam Categories</span>
            <h2 className="heading">Courses for <span className="gradient-text">every Chemistry exam</span></h2>
            <p className="text-slate-500 mt-2 max-w-lg mx-auto">From school foundation to post-graduate entrance — we cover it all.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, i) => (
              <motion.div key={cat._id} initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Tilt3D className="block h-full" intensity={5}>
                  <Link to={`/courses?category=${cat.name}`} className="group flex items-center gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:border-brand-200 hover:shadow-lg transition-all duration-300 h-full">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color || CAT_COLORS[i % CAT_COLORS.length]} grid place-items-center text-2xl shrink-0 group-hover:scale-110 transition-transform`}>{cat.icon || CAT_ICONS[i % CAT_ICONS.length]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900">{cat.name}</div>
                      {cat.subcategories?.length > 0 && (
                        <div className="text-sm text-slate-500 truncate">{cat.subcategories.slice(0, 3).join(', ')}</div>
                      )}
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                </Tilt3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      {highlights.length > 0 && (
        <section className="section bg-[#06091a] text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-48 -right-48 w-[700px] h-[700px] rounded-full opacity-30 bg-[radial-gradient(circle,#7c3aed,transparent_70%)]" />
            <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full opacity-30 bg-[radial-gradient(circle,#3366ff,transparent_70%)]" />
          </div>
          <div className="relative container-x">
            <div className="text-center mb-14">
              <span className="chip bg-white/10 text-white/80 border border-white/15 mb-4"><Sparkles size={13} /> Why Ace2Examz</span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">The unfair advantage <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-brand-400">you deserve</span></h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {highlights.map((h, i) => (
                <motion.div key={h._id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <Tilt3D className="group p-7 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-400/40 transition h-full cursor-default" intensity={6}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet2-600 grid place-items-center text-2xl mb-5 group-hover:scale-110 transition-transform shadow-lg">{h.image || '✨'}</div>
                    <h3 className="font-bold text-lg mb-2">{h.title}</h3>
                    <p className="text-sm text-white/55 leading-relaxed">{h.description}</p>
                  </Tilt3D>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FACULTY */}
      <section className="section bg-gradient-to-br from-slate-50 to-white">
        <div className="container-x">
          <div className="text-center mb-14">
            <span className="chip bg-amber-50 text-amber-700 border border-amber-100 mb-4"><GraduationCap size={13} /> Expert Faculty</span>
            <h2 className="heading">Learn from the <span className="gradient-text">best IIT/IISc minds</span></h2>
            <p className="text-slate-500 mt-2 max-w-xl mx-auto">Our faculty are JEE/CSIR toppers themselves — they know exactly what it takes to crack these exams.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FACULTY.map((f, i) => (
              <motion.div key={f.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Tilt3D className="card overflow-hidden text-center group h-full" intensity={6}>
                  <div className="h-28 bg-gradient-to-br from-brand-500 to-violet2-500 relative flex items-end justify-center">
                    <img src={f.avatar} alt={f.name} className="w-20 h-20 rounded-full ring-4 ring-white object-cover absolute -bottom-10 group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-5 pt-14">
                    <div className="font-black text-slate-900 text-base">{f.name}</div>
                    <div className="text-xs text-brand-600 font-semibold mt-0.5">{f.title}</div>
                    <div className="flex justify-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> {f.exp}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {f.students}</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                      {f.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold">{tag}</span>)}
                    </div>
                  </div>
                </Tilt3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TOPPERS */}
      {toppers.length > 0 && (
        <section className="section bg-white">
          <div className="container-x">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
              <div>
                <span className="chip bg-amber-50 text-amber-700 border border-amber-100 mb-3"><Trophy size={13} /> Toppers Hall of Fame</span>
                <h2 className="heading">Real students, <span className="gradient-text">real ranks</span></h2>
                <p className="text-slate-500 mt-2">Hundreds of Ace2Examz students crack their dream exams every year.</p>
              </div>
              <Link to="/results" className="btn-outline self-start md:self-auto shrink-0">See All Toppers <ArrowRight size={16} /></Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {toppers.slice(0, 8).map((t, i) => (
                <motion.div key={t._id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="group card overflow-hidden">
                  <div className="relative h-48 bg-gradient-brand overflow-hidden">
                    {t.image && <img src={t.image} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 chip bg-amber-400 text-amber-900 shadow"><Trophy size={11} /> {t.rank}</div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="font-black text-white text-base leading-tight">{t.title}</div>
                      <div className="text-[11px] text-white/80 font-semibold mt-0.5">{t.exam} • {t.year}</div>
                    </div>
                  </div>
                  <div className="p-4"><p className="text-sm text-slate-600 line-clamp-2">{t.description}</p></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS MARQUEE */}
      {reviews.length > 0 && (
        <section className="section bg-gradient-to-br from-violet-50 via-white to-blue-50 overflow-hidden">
          <div className="container-x mb-14 text-center">
            <span className="chip bg-white border border-violet-200 text-violet-700 mb-4"><Star size={13} /> Student Reviews</span>
            <h2 className="heading">Loved by <span className="gradient-text">1,000+ students</span></h2>
          </div>
          {[reviews.slice(0, Math.ceil(reviews.length / 2)), reviews.slice(Math.ceil(reviews.length / 2))].map((row, ri) => (
            <div key={ri} className="marquee-container overflow-hidden mb-5" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)' }}>
              <div className={`flex gap-5 ${ri === 0 ? 'marquee-left' : 'marquee-right'}`} style={{ width: 'max-content' }}>
                {[...row, ...row].map((r, i) => (
                  <div key={i} className="w-72 shrink-0 card p-5 relative">
                    <div className="absolute top-3 right-4 text-5xl text-violet-100 font-serif leading-none select-none">"</div>
                    <div className="flex items-center gap-0.5 text-amber-400 mb-2">{Array.from({ length: r.rating || 5 }).map((_, j) => <Star key={j} size={13} fill="currentColor" />)}</div>
                    <h4 className="font-bold text-slate-900 text-sm">{r.title}</h4>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-3">{r.description}</p>
                    <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-slate-100">
                      <img src={r.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.author || 'S')}&background=7c3aed&color=fff`} alt={r.author} className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-100" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{r.author}</div>
                        <div className="text-[10px] text-slate-400">Verified Student</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* SAMPLE LECTURES */}
      {videos.length > 0 && (
        <section className="section bg-white">
          <div className="container-x">
            <div className="text-center mb-14">
              <span className="chip bg-rose-50 text-rose-700 border border-rose-100 mb-4"><PlayCircle size={13} /> Free Sample Lectures</span>
              <h2 className="heading">See the quality <span className="gradient-text">before you enroll</span></h2>
              <p className="text-slate-500 mt-2 max-w-lg mx-auto">These free lectures give you a taste of how we make chemistry concepts crystal-clear.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {videos.slice(0, 3).map(v => (
                <div key={v._id} className="card overflow-hidden group">
                  <div className="aspect-video bg-slate-900">
                    <iframe src={v.videoUrl} title={v.title} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                  <div className="p-5">
                    <span className="chip bg-brand-50 text-brand-700 text-[10px] mb-2">Free</span>
                    <h4 className="font-bold text-slate-900 mt-1">{v.title}</h4>
                    <p className="text-sm text-slate-500 mt-1">{v.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/courses" className="btn-primary !px-8 !py-3 text-base">Browse All Courses <ArrowRight size={18} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="section bg-gradient-to-br from-slate-50 to-white">
        <div className="container-x max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="chip bg-indigo-50 text-indigo-700 border border-indigo-100 mb-4"><MessageCircle size={13} /> FAQ</span>
            <h2 className="heading">Frequently Asked <span className="gradient-text">Questions</span></h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <FaqItem q={faq.q} a={faq.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-x">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-violet2-600 to-fuchsia-600 p-10 sm:p-16 text-white">
            <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-fuchsia-500/30 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="relative z-10 grid md:grid-cols-[1.6fr,1fr] gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white/90 text-xs font-bold mb-6"><Flame size={13} className="text-amber-300" /> Limited Seats — Enroll Now</div>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-tight">Start your Chemistry<br /> journey today.</h2>
                <p className="mt-4 text-white/75 text-lg max-w-xl leading-relaxed">Join 1,000+ students already cracking JEE, NEET, GATE, CSIR-NET and more with Ace2Examz's expert faculty.</p>
                <div className="grid sm:grid-cols-3 gap-4 mt-7 max-w-xl">
                  {[{ icon: CheckCircle2, label: 'Free Demo Lectures' }, { icon: CheckCircle2, label: 'Cancel Anytime' }, { icon: CheckCircle2, label: 'Verified Certificate' }].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-white/80 text-sm font-semibold"><item.icon size={16} className="text-emerald-300 shrink-0" />{item.label}</div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 mt-8">
                  <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-brand-700 font-black text-base hover:bg-slate-100 hover:-translate-y-0.5 transition-all shadow-xl">Create Free Account <ArrowRight size={18} /></Link>
                  <Link to="/courses" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border-2 border-white/35 text-white font-bold text-base hover:bg-white/10 hover:-translate-y-0.5 transition-all">Browse Courses</Link>
                </div>
              </div>
              <div className="hidden md:flex justify-center items-center">
                <div className="relative w-56 h-56">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 rounded-full border-4 border-dashed border-white/25" />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }} className="absolute inset-8 rounded-full border-2 border-dashed border-white/15" />
                  <div className="absolute inset-6 rounded-full bg-white/15 backdrop-blur-sm grid place-items-center shadow-2xl"><Atom size={80} className="text-white" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Promotional Popup Overlay */}
      <AnimatePresence>
        {showPopup && activePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => {
              localStorage.setItem(`popup_seen_${activePopup._id}`, 'true');
              setShowPopup(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full border border-slate-100 relative flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  localStorage.setItem(`popup_seen_${activePopup._id}`, 'true');
                  setShowPopup(false);
                }}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 flex items-center justify-center backdrop-blur-sm transition"
              >
                <X size={16} />
              </button>

              {activePopup.image && (
                <div className="h-48 overflow-hidden bg-slate-100">
                  <img src={activePopup.image} alt={activePopup.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-6 text-center space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                  Special Announcement
                </span>
                <h3 className="font-display font-extrabold text-slate-800 text-xl leading-snug">
                  {activePopup.title}
                </h3>
                {activePopup.description && (
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {activePopup.description}
                  </p>
                )}
                
                <div className="pt-2">
                  {activePopup.link ? (
                    <a
                      href={activePopup.link}
                      onClick={() => {
                        localStorage.setItem(`popup_seen_${activePopup._id}`, 'true');
                        setShowPopup(false);
                      }}
                      className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-md"
                    >
                      {activePopup.buttonText || 'View Offer'}
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        localStorage.setItem(`popup_seen_${activePopup._id}`, 'true');
                        setShowPopup(false);
                      }}
                      className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-md"
                    >
                      {activePopup.buttonText || 'Dismiss'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
