import { Zap, Download, FileText, Lock, Sparkles, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Boosters() {
  const boosterPacks = [
    {
      title: 'Physical Chemistry Speed Formulas',
      desc: 'All formula charts and equilibrium constants compiled in a 5-page revision guide.',
      subject: 'Physical Chemistry',
      pages: 5,
      size: '1.2 MB',
      isFree: true,
      hasAccess: true,
    },
    {
      title: 'Organic Name Reactions Cheat Sheet',
      desc: 'Detailed mechanism maps for Alderman, Wurtz, Grignard and other essential organic name reactions.',
      subject: 'Organic Chemistry',
      pages: 12,
      size: '3.4 MB',
      isFree: false,
      hasAccess: true,
    },
    {
      title: 'Inorganic Exception & Periodicity Checklist',
      desc: 'Important exceptions in oxidation states, ionization energy, and s/p/d block reactions.',
      subject: 'Inorganic Chemistry',
      pages: 8,
      size: '2.1 MB',
      isFree: false,
      hasAccess: true,
    },
    {
      title: 'Mole Concept Quick Solve Tricks',
      desc: 'High-speed shortcut methods to solve stoichiometry and volumetric problems in under 30 seconds.',
      subject: 'Physical Chemistry',
      pages: 4,
      size: '0.8 MB',
      isFree: true,
      hasAccess: true,
    },
    {
      title: 'Coordination Compounds Nomenclature Kit',
      desc: 'Rules, isomerism maps, and magnetic property calculation summaries for board exams.',
      subject: 'Inorganic Chemistry',
      pages: 6,
      size: '1.5 MB',
      isFree: false,
      hasAccess: false,
    }
  ];

  const handleDownload = (booster) => {
    if (!booster.hasAccess) {
      toast.error('Unlock this Booster Pack using your Toppers Pass or Course Enrollment!');
      return;
    }
    toast.success(`Downloading ${booster.title}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold text-slate-800">Study Boosters</h1>
            <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[9px] font-bold tracking-wide">
              NEW
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">High-yield cheatsheets, chemistry formula booklets, and reaction maps.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {boosterPacks.map((pack, idx) => (
          <div key={idx} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300">
            <div className="p-5 space-y-4">
              {/* Card Header */}
              <div className="flex justify-between items-center">
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  pack.subject === 'Organic Chemistry' ? 'bg-amber-50 text-amber-700' :
                  pack.subject === 'Inorganic Chemistry' ? 'bg-rose-50 text-rose-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {pack.subject}
                </span>
                
                {pack.isFree && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold rounded-md">
                    FREE ACCESS
                  </span>
                )}
              </div>

              {/* Card Title & Desc */}
              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-slate-800 text-base leading-snug group-hover:text-brand-700 transition">
                  {pack.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {pack.desc}
                </p>
              </div>

              {/* Card Details */}
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-50">
                <span className="flex items-center gap-1">
                  <FileText size={12} className="text-slate-400" />
                  {pack.pages} pages
                </span>
                <span>•</span>
                <span>{pack.size}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-5 pt-0">
              <button
                onClick={() => handleDownload(pack)}
                className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  pack.hasAccess
                    ? 'bg-gradient-brand text-white shadow-soft hover:shadow-glow'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                {pack.hasAccess ? (
                  <>
                    <Download size={13} />
                    <span>Download PDF</span>
                  </>
                ) : (
                  <>
                    <Lock size={13} />
                    <span>Unlock Booster Pack</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
