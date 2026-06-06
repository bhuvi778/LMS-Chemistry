import { useState } from 'react';
import api from '../api/client.js';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Send, Loader2, MessageSquare, Shield } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in name, email and message');
      return;
    }
    setLoading(true);
    try {
      await api.post('/enquiries', form);
      toast.success('Your message has been submitted. We will get back to you soon!');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <section className="bg-gradient-brand text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
        <div className="container-x text-center relative z-10">
          <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wide">
            Get in touch
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-3">Contact Our Support Team</h1>
          <p className="text-white/80 max-w-xl mx-auto mt-4 text-base">
            Have questions about courses, admissions, or technical issues? Send us a message and our team will assist you.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 container-x">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Info Column */}
          <div className="space-y-6">
            <div className="card p-6 bg-white shadow-soft">
              <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                <MessageSquare className="text-brand-600" size={20} />
                Connect With Us
              </h2>
              <div className="space-y-4">
                <a href="mailto:uae@ace2examz.com" className="flex items-start gap-3.5 group p-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">Email Us</div>
                    <div className="text-sm font-semibold text-slate-700 group-hover:text-brand-700">uae@ace2examz.com</div>
                  </div>
                </a>

                <a href="tel:+919115179935" className="flex items-start gap-3.5 group p-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">Call Us</div>
                    <div className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">+91-9115179935</div>
                  </div>
                </a>

                <div className="flex items-start gap-3.5 p-2 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">Our Office</div>
                    <div className="text-sm font-semibold text-slate-700">Chhota Tiwana Rd, Jalalabad West, Distt - Fazilka (PB) India, 152024</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-br from-brand-900 to-indigo-950 text-white shadow-soft">
              <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                <Shield size={18} className="text-brand-300" /> Secure Response
              </h3>
              <p className="text-xs text-brand-100/80 leading-relaxed">
                All submissions are encrypted and processed by our secure support CRM. We average a response time of under 4 hours on working days.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-2 card p-8 bg-white shadow-soft">
            <h3 className="font-display text-2xl font-extrabold text-slate-800 mb-2">Send Message</h3>
            <p className="text-slate-500 text-sm mb-6">Complete the form below and we'll dispatch an advisor to review your case.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name <span className="text-red-500">*</span></label>
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={handleInput}
                    placeholder="Enter your name"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Email Address <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInput}
                    placeholder="Enter email address"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleInput}
                    placeholder="e.g. +91 91..."
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Subject <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input
                    name="subject"
                    value={form.subject}
                    onChange={handleInput}
                    placeholder="Enquiry subject"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Your Message <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={5}
                  name="message"
                  value={form.message}
                  onChange={handleInput}
                  placeholder="Tell us what you need help with..."
                  className="input min-h-[120px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending message...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Submit Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
