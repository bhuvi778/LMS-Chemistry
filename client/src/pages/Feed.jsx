import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { Calendar, Search, Loader2, ArrowRight, BookOpen, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Feed() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    api.get('/feed')
      .then(({ data }) => {
        setList(data || []);
      })
      .catch((err) => {
        toast.error('Failed to load feed announcements');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filtered = list.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.content.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (ts) => {
    return new Date(ts).toLocaleDateString('en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPlainSummary = (html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container-x">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wider">
              News & Announcements
            </span>
            <h1 className="font-display text-3xl font-extrabold text-slate-800 mt-2">Latest Updates</h1>
            <p className="text-slate-500 text-sm mt-1">Stay updated with the latest updates, CBSE/NEET tips, and platform news.</p>
          </div>

          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search announcements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 size={36} className="animate-spin text-brand-500 mb-3" />
            <div className="text-sm">Loading feed items...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 max-w-lg mx-auto">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="font-bold text-slate-700 text-lg">No updates found</h3>
            <p className="text-sm mt-1">Check back later for announcements and newsletters!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedItem(item)}
                className="card bg-white shadow-soft hover:shadow-md hover:-translate-y-1 transition duration-300 flex flex-col h-full overflow-hidden border border-slate-100 cursor-pointer"
              >
                {item.image && (
                  <div className="h-48 overflow-hidden bg-slate-100 relative shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-3">
                    <Calendar size={13} />
                    <span>{fmtDate(item.createdAt)}</span>
                  </div>
                  <h3 className="font-display font-extrabold text-slate-800 text-lg leading-snug mb-3">
                    {item.title}
                  </h3>
                  {/* Clean text summary */}
                  <p className="text-slate-500 text-sm leading-relaxed flex-1 line-clamp-3">
                    {getPlainSummary(item.content)}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-50 shrink-0 flex justify-between items-center">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 group">
                      Read Full Post <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feed Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto" onClick={() => setSelectedItem(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            {selectedItem.image && (
              <div className="h-64 overflow-hidden bg-slate-100 relative">
                <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            
            {!selectedItem.image && (
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full p-2 transition z-10"
              >
                <X size={18} />
              </button>
            )}

            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                <Calendar size={14} />
                <span>{fmtDate(selectedItem.createdAt)}</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl text-slate-800 leading-snug">
                {selectedItem.title}
              </h2>
              <div
                className="text-slate-600 text-sm leading-relaxed prose prose-slate max-w-none overflow-y-auto max-h-[40vh] pr-2 break-words"
                dangerouslySetInnerHTML={{ __html: selectedItem.content }}
              />

              {selectedItem.link && (
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <a
                    href={selectedItem.link}
                    target={selectedItem.link.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Visit Link <ArrowRight size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
