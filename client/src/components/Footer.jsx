import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Atom, Mail, Phone, MapPin, Youtube, Instagram, Facebook, ArrowRight, Zap, Loader2 } from 'lucide-react';
import api from '../api/client.js';
import toast from 'react-hot-toast';

// Custom brand icons not available in lucide-react or requiring specific branding (like X)
const XIcon = ({ size = 16, ...props }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" {...props}>
    <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
  </svg>
);

const TelegramIcon = ({ size = 16, ...props }) => (
  <svg viewBox="0 0 448 512" width={size} height={size} fill="currentColor" {...props}>
    <path d="M446.7 98.6l-376.6 145c-25.9 10-25.8 24.5-4.8 31l96.6 30.2 224-141.2c10.6-6.4 20.3-3 12.3 4.1L216.7 341.2l-8 120.3c11.8 0 17-5.4 23.6-11.8l56.7-55.1 118 87.1c21.8 12 37.5 5.8 43-20.2l77.7-366.1c8-32.9-12.7-47.7-34.3-37.7z" />
  </svg>
);

const QuoraIcon = ({ size = 16, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...props}>
    <path d="M7.3799.9483A11.9628 11.9628 0 0 1 21.248 19.5397l2.4096 2.4225c.7322.7362.21 1.9905-.8272 1.9905l-10.7105.01a12.52 12.52 0 0 1-.304 0h-.02A11.9628 11.9628 0 0 1 7.3818.9503Zm7.3217 4.428a7.1717 7.1717 0 1 0-5.4873 13.2512 7.1717 7.1717 0 0 0 5.4883-13.2511Z" />
  </svg>
);

export default function Footer() {
  const [subEmail, setSubEmail] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subEmail.trim()) return;
    setSubLoading(true);
    try {
      const { data } = await api.post('/subscribers', { email: subEmail.trim() });
      toast.success(data.message || 'Subscribed!');
      setSubEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Subscription failed');
    } finally {
      setSubLoading(false);
    }
  };
  return (
    <footer className="bg-[#060B1F] text-slate-400 relative overflow-hidden">
      {/* top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="absolute top-0 left-1/4 w-[400px] h-[200px] bg-brand-600/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[200px] bg-violet2-500/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Newsletter bar */}
      <div className="border-b border-white/5">
        <div className="container-x py-10 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div>
            <h3 className="font-display font-extrabold text-xl text-white">Get exam tips & free study material</h3>
            <p className="text-xs text-slate-500 mt-1">Join 1,000+ students. No spam, only value.</p>
          </div>
          <form className="flex gap-2 w-full md:w-auto" onSubmit={handleSubscribe}>
            <input
              type="email"
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 md:w-72 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-sm"
            />
            <button type="submit" disabled={subLoading} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet2-500 text-white font-bold text-sm hover:-translate-y-0.5 transition-all shadow-soft disabled:opacity-70">
              {subLoading ? <Loader2 size={15} className="animate-spin" /> : <><ArrowRight size={15} /> Subscribe</>}
            </button>
          </form>
        </div>
      </div>

      {/* Main grid */}
      <div className="container-x py-16 grid md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand */}
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center mb-4">
            <img src="/logo-light.png" alt="Ace2Examz Logo" className="h-11 w-auto object-contain" />
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
            India's most trusted Chemistry Platform for CBSE, JEE, NEET and more. Taught by expert faculty.
          </p>

          <div className="flex items-center gap-1 mt-5 p-3 rounded-xl bg-white/5 border border-white/8 max-w-sm">
            <Zap size={14} className="text-amber-400 shrink-0" />
            <span className="text-xs text-white/60 font-medium">1,000+ students trust Ace2Examz for their chemistry preparation.</span>
          </div>

          <div className="flex gap-2.5 mt-5">
            {[
              { I: Youtube, href: 'https://www.youtube.com/@ace2examz', label: 'YouTube' },
              { I: Instagram, href: 'https://www.instagram.com/ace2examz', label: 'Instagram' },
              { I: XIcon, href: 'https://x.com/ace2examz', label: 'X (Twitter)' },
              { I: Facebook, href: 'https://facebook.com/ace2examzz', label: 'Facebook' },
              { I: TelegramIcon, href: 'https://t.me/ace2examz', label: 'Telegram' },
              { I: QuoraIcon, href: 'https://www.quora.com/profile/Ace2Examz', label: 'Quora' },
            ].map(({ I, href, label }) => (
              <a 
                key={label} 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label={label} 
                className="w-9 h-9 grid place-items-center rounded-lg bg-white/5 border border-white/8 hover:bg-brand-600 hover:border-brand-500 transition"
              >
                <I size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Exams */}
        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Exams</h4>
          <ul className="space-y-2.5 text-sm">
            {(categories.length > 0 ? categories : [{ name: 'CBSE' }, { name: 'JEE' }, { name: 'NEET' }]).slice(0, 5).map(cat => {
              const name = cat.name || cat;
              return (
                <li key={name}>
                  <Link to={`/courses?category=${encodeURIComponent(name)}`} className="hover:text-white hover:translate-x-1 inline-flex items-center gap-1.5 transition-all group">
                    <span className="w-1 h-1 rounded-full bg-brand-500 group-hover:w-2 transition-all" />
                    {name} Chemistry
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Company</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { to: '/about', label: 'About Us' },
              { to: '/courses', label: 'All Courses' },
              { to: '/results', label: 'Our Results' },
              { to: '/feed', label: 'Updates Feed' },
              { to: '/contact', label: 'Contact Us' },
              { to: 'https://ace2examz.com/blogs', label: 'Blog' },
              { to: '/privacy-policy', label: 'Privacy Policy' },
              { to: '/terms', label: 'Terms & Conditions' },
            ].map(item => (
              <li key={item.label}>
                {item.to.startsWith('http') ? (
                  <a href={item.to} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:translate-x-1 inline-flex items-center gap-1.5 transition-all group">
                    <span className="w-1 h-1 rounded-full bg-violet2-500 group-hover:w-2 transition-all" />
                    {item.label}
                  </a>
                ) : (
                  <Link to={item.to} className="hover:text-white hover:translate-x-1 inline-flex items-center gap-1.5 transition-all group">
                    <span className="w-1 h-1 rounded-full bg-violet2-500 group-hover:w-2 transition-all" />
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5 items-start">
              <Mail size={15} className="mt-0.5 text-brand-400 shrink-0" />
              <a href="mailto:support@ace2examz.com" className="hover:text-white transition">support@ace2examz.com</a>
            </li>
            <li className="flex gap-2.5 items-start">
              <Phone size={15} className="mt-0.5 text-brand-400 shrink-0" />
              <a href="tel:+919115179935" className="hover:text-white transition">+91-9115179935</a>
            </li>
            <li className="flex gap-2.5 items-start">
              <MapPin size={15} className="mt-0.5 text-brand-400 shrink-0" />
              <span>Chhota Tiwana Rd, Jalalabad West, Distt - Fazilka (PB) India, 152024</span>
            </li>
          </ul>

          <div className="mt-6">
            <h5 className="text-white font-bold mb-3 text-sm">Quick Links</h5>
            <div className="flex flex-col gap-2">
              <Link to="/register" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet2-500 text-white text-xs font-bold hover:-translate-y-0.5 transition-all">
                Start Free Today <ArrowRight size={13} />
              </Link>
              <Link to="/courses" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-white/70 text-xs font-semibold hover:border-brand-400 hover:text-white transition-all">
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="container-x py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} Ace2Examz. All rights reserved.
          </div>
          <div className="text-xs text-slate-500">
            Made with ❤️ for Chemistry students across India
          </div>
        </div>
      </div>
    </footer>
  );
}
