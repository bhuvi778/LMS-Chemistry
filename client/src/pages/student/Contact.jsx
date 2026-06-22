import { useState } from 'react';
import { Phone, Mail, MessageSquare, MapPin, Clock, Send, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.error('Please fill all required fields');
    setLoading(true);
    try {
      await api.post('/enquiries', { ...form, source: 'student_panel' });
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send message. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: Mail, label: 'Email Us', value: 'support@ace2examz.com', href: 'mailto:support@ace2examz.com', color: 'bg-blue-50 text-blue-600' },
    { icon: Phone, label: 'Call Us', value: '+91-9115179935', href: 'tel:+919115179935', color: 'bg-emerald-50 text-emerald-600' },
    { icon: MessageSquare, label: 'WhatsApp', value: 'Chat with Us', href: 'https://wa.me/919115179935', color: 'bg-green-50 text-green-600' },
    { icon: MapPin, label: 'Our Address', value: 'Chhota Tiwana Rd, Jalalabad West, Fazilka (PB) India', href: 'https://maps.google.com/?q=Chhota+Tiwana+Rd,+Jalalabad+West,+Fazilka+152024', color: 'bg-indigo-50 text-indigo-600' },
    { icon: Clock, label: 'Working Hours', value: 'Mon–Sat: 9am – 6pm', href: null, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-800">Contact Us</h1>
        <p className="text-sm text-slate-500 mt-1">Have a question? We'd love to hear from you. Send us a message!</p>
      </div>

      <div className="grid lg:grid-cols-[1fr,1.3fr] gap-6">
        {/* Contact Info */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-3xl p-7 text-white">
            <h2 className="font-display font-extrabold text-xl mb-2">Get In Touch</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Our support team is here to help. Whether you have a question about courses, payments, or anything else, we're ready to answer!
            </p>
            <div className="mt-6 space-y-3">
              {contactInfo.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <c.icon size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{c.label}</div>
                    {c.href ? (
                      <a href={c.href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-white hover:text-white/80 transition">
                        {c.value}
                      </a>
                    ) : (
                      <div className="text-sm font-semibold">{c.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="font-display font-extrabold text-slate-800 text-xl">Message Sent!</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-sm">We've received your message and will get back to you within 24 hours.</p>
              <button onClick={() => setSent(false)} className="mt-6 px-6 py-2.5 bg-brand-50 text-brand-700 font-bold text-sm rounded-2xl hover:bg-brand-100 transition">
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-display font-extrabold text-slate-800 text-base mb-2">Send a Message</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input w-full"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="input w-full"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Subject</label>
                <input
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="input w-full"
                  placeholder="What's this about?"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="input w-full resize-none"
                  placeholder="Write your message here..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-brand text-white font-bold py-3 rounded-2xl text-sm shadow-soft hover:-translate-y-0.5 transition-all disabled:opacity-60"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
