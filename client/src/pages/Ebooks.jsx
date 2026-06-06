import { useEffect, useState } from 'react';
import { BookOpen, Download, Lock, Search, ChevronRight } from 'lucide-react';
import api from '../api/client.js';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Ebooks() {
  const { user } = useAuth();
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/ebooks').then((r) => setEbooks(r.data)).finally(() => setLoading(false));
  }, []);

  const handleDownload = async (eb) => {
    if (!user) { toast.error('Please login to download ebooks'); return; }
    if (!eb.hasAccess) { toast.error('Enroll in the related course to access this ebook'); return; }
    try {
      const { data } = await api.get(`/ebooks/${eb._id}/download`);
      window.open(data.fileUrl, '_blank');
    } catch (err) {
      toast.error(err.message || 'Failed to open ebook');
    }
  };

  const subjects = [...new Set(ebooks.map((e) => e.subject).filter(Boolean))];

  const filtered = ebooks.filter((eb) => {
    const matchSearch = !search || eb.title.toLowerCase().includes(search.toLowerCase()) ||
      eb.subject?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'free' && eb.isFree) ||
      (filter === 'enrolled' && eb.hasAccess) || eb.subject === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <section className="bg-gradient-soft py-14">
        <div className="container-x">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 grid place-items-center">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-extrabold gradient-text">E-Books Library</h1>
              <p className="text-slate-500 text-sm">Chemistry study materials & notes</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ebooks..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'free', 'enrolled', ...subjects].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition capitalize ${
                    filter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card h-64 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
              <p>No ebooks found</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((eb) => (
                <div key={eb._id} className="card overflow-hidden flex flex-col group hover:shadow-lg transition-all">
                  {/* Cover */}
                  <div className="relative h-44 bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                    {eb.coverImage ? (
                      <img src={eb.coverImage} alt={eb.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={48} className="text-white/40" />
                    )}
                    {eb.isFree && (
                      <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">FREE</span>
                    )}
                    {!eb.hasAccess && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Lock size={28} className="text-white" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mb-1">{eb.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      {eb.subject && <span className="text-[11px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">{eb.subject}</span>}
                      {eb.grade && <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{eb.grade}</span>}
                    </div>
                    {eb.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{eb.description}</p>}
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {eb.pages ? `${eb.pages} pages` : ''} {eb.fileSize ? `· ${eb.fileSize}` : ''}
                      </span>
                      <button
                        onClick={() => handleDownload(eb)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                          eb.hasAccess
                            ? 'bg-brand-600 text-white hover:bg-brand-700'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {eb.hasAccess ? <><Download size={13} /> Open</> : <><Lock size={13} /> Locked</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
