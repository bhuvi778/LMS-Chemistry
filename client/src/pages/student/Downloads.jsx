import { useState, useEffect } from 'react';
import { BookOpen, Trash2, FileText, Bookmark, ArrowRight, DownloadCloud, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

// In-app PDF viewer modal — files open inside the app, not downloaded to device
function InAppViewer({ item, onClose }) {
  const resolveUrl = (url) => {
    if (!url) return '';
    // Google Drive file
    const driveFile = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
    if (driveFile) return `https://drive.google.com/file/d/${driveFile[1]}/preview`;
    // Generic PDF - use Google Docs viewer
    if (url.toLowerCase().includes('.pdf')) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const embedUrl = resolveUrl(item.fileUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 pr-4">{item.title}</h3>
          <div className="flex items-center gap-2">
            <a
              href={item.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
              title="Open in new tab"
            >
              <ExternalLink size={12} /> Open Tab
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 grid place-items-center transition shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <iframe
          className="w-full flex-1 rounded-b-2xl"
          style={{ minHeight: '75vh' }}
          src={embedUrl}
          title={item.title}
          allow="fullscreen"
        />
      </div>
    </div>
  );
}

export default function Downloads() {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openItem, setOpenItem] = useState(null); // item to view in-app

  const getDownloadsKey = () => user ? `lms_chemistry_downloads_${user._id}` : 'lms_chemistry_downloads_guest';

  useEffect(() => {
    try {
      const key = getDownloadsKey();
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      setDownloads(saved);
    } catch (e) {
      console.error('Failed to load local downloads', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleOpen = (item) => {
    if (!item.fileUrl) {
      toast.error('File URL not found');
      return;
    }
    setOpenItem(item);
  };

  const handleRemove = (id) => {
    try {
      const key = getDownloadsKey();
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = saved.filter(i => i._id !== id);
      localStorage.setItem(key, JSON.stringify(updated));
      setDownloads(updated);
      toast.success('Removed from downloads');
    } catch (e) {
      toast.error('Failed to remove download');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></div>
        <span className="text-sm font-semibold">Loading downloads...</span>
      </div>
    );
  }

  // Group downloads by contentType
  const ebooks = downloads.filter(d => (d.contentType || 'ebook') === 'ebook');
  const enotes = downloads.filter(d => d.contentType === 'enote');
  const emagazines = downloads.filter(d => d.contentType === 'emagazine');

  const MaterialCard = ({ item }) => (
    <div className="bg-white rounded-3xl border border-slate-100 p-4 flex gap-4 shadow-2xs hover:shadow-xs transition duration-200 group">
      <div className="w-12 h-16 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-700 shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
        {item.coverImage ? (
          <img src={item.coverImage} alt="" className="w-full h-full object-cover" />
        ) : item.contentType === 'enote' ? (
          <FileText size={20} className="text-white/60" />
        ) : item.contentType === 'emagazine' ? (
          <Bookmark size={20} className="text-white/60" />
        ) : (
          <BookOpen size={20} className="text-white/60" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.subject && (
              <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase">
                {item.subject}
              </span>
            )}
            {item.contentType === 'enote' && item.subCategory && (
              <span className="text-[9px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded font-bold">
                {item.subCategory}
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1 group-hover:text-indigo-600 transition">
            {item.title}
          </h3>
          {item.chapter && (
            <p className="text-[10px] text-slate-400 font-bold truncate">
              Ch: {item.chapter}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-slate-400 font-bold">
            {item.fileSize || 'PDF'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRemove(item._id)}
              className="p-1.5 rounded-lg border border-rose-100 hover:border-rose-200 text-rose-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
              title="Remove from Downloads"
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={() => handleOpen(item)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold rounded-lg shadow-xs transition cursor-pointer"
            >
              <BookOpen size={10} className="stroke-[3px]" />
              <span>View</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 w-full max-w-5xl">
      {/* In-app viewer modal */}
      {openItem && <InAppViewer item={openItem} onClose={() => setOpenItem(null)} />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <DownloadCloud size={24} className="text-indigo-600" />
            <span>My Downloads</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Access all your saved books, revision notes, and study materials — view them right here in the app.</p>
        </div>

        <div className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 font-black rounded-2xl text-xs border border-indigo-100/35 shrink-0">
          <DownloadCloud size={14} className="animate-pulse" />
          <span>{downloads.length} Materials Saved</span>
        </div>
      </div>

      {downloads.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-150/60 p-12 text-center shadow-xs space-y-5 border-dashed border-2">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100 shadow-sm">
            <DownloadCloud size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-700 text-base">No Saved Materials</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
              You haven't saved any study materials yet. Visit the Library to find high-quality books and revision notes!
            </p>
          </div>
          <Link
            to="/student/library"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg transition cursor-pointer"
          >
            <span>Explore Library</span>
            <ArrowRight size={13} className="stroke-[3px]" />
          </Link>
        </div>
      ) : (
        /* Categorized Downloads Lists */
        <div className="space-y-8">

          {/* E-Books Section */}
          {ebooks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <span className="text-base">📚</span>
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Saved E-Books ({ebooks.length})</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {ebooks.map(item => (
                  <MaterialCard key={item._id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* E-Notes Section */}
          {enotes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <span className="text-base">📝</span>
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Saved E-Notes ({enotes.length})</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {enotes.map(item => (
                  <MaterialCard key={item._id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* E-Magazines Section */}
          {emagazines.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <span className="text-base">🔖</span>
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Saved E-Magazines ({emagazines.length})</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {emagazines.map(item => (
                  <MaterialCard key={item._id} item={item} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
