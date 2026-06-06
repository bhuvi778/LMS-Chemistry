import { Shield, Lock, Eye, FileText, CheckCircle } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <Shield size={22} className="text-brand-600" /> Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 mt-1">Your privacy is important to us. Learn how we collect, use, and protect your data.</p>
      </div>

      <div className="grid lg:grid-cols-[1.5fr,1fr] gap-6">
        <div className="space-y-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <section className="space-y-3">
            <h2 className="font-display font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <FileText size={18} className="text-brand-500" /> 1. Information We Collect
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              We collect information to provide better services to all our students. This includes:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-1">
              <li>Account profile details such as name, email address, phone number, and password.</li>
              <li>Learning activity data, including course progress, test scores, and performance stats.</li>
              <li>Gamification achievements, streak histories, and Ace Coin ledger transactions.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <Eye size={18} className="text-brand-500" /> 2. How We Use Information
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-1">
              <li>To customize and deliver course lectures, study materials, and mock exam assessments.</li>
              <li>To calculate and award study streaks, referral bonuses, and other gamification achievements.</li>
              <li>To process payments, manage subscriptions, and prevent platform abuse.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <Lock size={18} className="text-brand-500" /> 3. Data Protection & Security
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              We apply industry-standard cryptographic techniques to secure stored credentials and personal details. Your authentication tokens are stored securely and never shared with third parties.
            </p>
          </section>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-6">
            <h3 className="font-display font-bold text-slate-800 text-sm mb-3">Key Highlights</h3>
            <div className="space-y-3">
              {[
                'No sharing of personal details with external marketers.',
                'Encrypted passwords and secured session tokens.',
                'Full transparency on your gamified coin ledger.',
                'Request account/data deletion at any time by contacting support.'
              ].map((highlight, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle size={14} className="text-brand-600 mt-0.5 shrink-0" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 text-xs text-slate-400 leading-relaxed">
            Last Updated: June 2026. Ace2Examz reserves the right to revise this privacy policy from time to time. Your continued use of the platform constitutes agreement to the updated policy terms.
          </div>
        </div>
      </div>
    </div>
  );
}
