import { useEffect, useState } from 'react';
import { BookOpen, Download, Lock, Search, ChevronRight, FileText, Bookmark, DownloadCloud, Trash2, HelpCircle } from 'lucide-react';
import api from '../api/client.js';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Ebooks() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [libraryTab, setLibraryTab] = useState('ebook'); // 'ebook', 'enote', 'emagazine', 'downloads'
  const [noteSubTab, setNoteSubTab] = useState('all');
  const [localDownloads, setLocalDownloads] = useState([]);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const getDownloadsKey = () => user ? `lms_chemistry_downloads_${user._id}` : 'lms_chemistry_downloads_guest';

  useEffect(() => {
    // Load study materials
    api.get('/ebooks')
      .then((r) => setMaterials(r.data || []))
      .finally(() => setLoading(false));

    api.get('/categories')
      .then((r) => setCategories(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Load local downloads for the active user
    try {
      const key = getDownloadsKey();
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      setLocalDownloads(saved);
    } catch (e) {
      console.error('Failed to load local downloads', e);
    }
  }, [user]);

  const saveToDownloads = (item) => {
    try {
      const key = getDownloadsKey();
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (!saved.some(i => i._id === item._id)) {
        const updated = [...saved, { ...item, downloadedAt: new Date().toISOString() }];
        localStorage.setItem(key, JSON.stringify(updated));
        setLocalDownloads(updated);
      }
    } catch (e) {
      console.error('Failed to save to local downloads', e);
    }
  };

  const removeFromDownloads = (id) => {
    try {
      const key = getDownloadsKey();
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = saved.filter(i => i._id !== id);
      localStorage.setItem(key, JSON.stringify(updated));
      setLocalDownloads(updated);
      toast.success('Removed from my downloads');
    } catch (e) {
      console.error('Failed to remove download', e);
    }
  };

  const handleDownload = async (eb) => {
    if (!user) { toast.error('Please login to download files'); return; }
    if (!eb.hasAccess) { toast.error('Enroll in the related course to access this material'); return; }
    try {
      const { data } = await api.get(`/ebooks/${eb._id}/download`);
      window.open(data.fileUrl, '_blank');
      // Save to local downloads
      saveToDownloads(eb);
    } catch (err) {
      toast.error(err.message || 'Failed to open file');
    }
  };

  // Base filtering by library tab & search
  const getFilteredMaterials = () => {
    let baseList = [];
    if (libraryTab === 'downloads') {
      baseList = localDownloads;
    } else {
      baseList = materials.filter((eb) => {
        const matchType = (eb.contentType || 'ebook') === libraryTab;
        if (!matchType) return false;
        
        if (libraryTab === 'enote') {
          const matchSub = noteSubTab === 'all' || eb.subCategory === noteSubTab;
          if (!matchSub) return false;
        }
        return true;
      });
    }

    return baseList.filter((eb) => {
      const matchGrade = selectedGradeFilter === 'all' || eb.grade === selectedGradeFilter;
      const matchSearch = !search || 
        eb.title.toLowerCase().includes(search.toLowerCase()) ||
        eb.subject?.toLowerCase().includes(search.toLowerCase()) ||
        eb.chapter?.toLowerCase().includes(search.toLowerCase()) ||
        eb.grade?.toLowerCase().includes(search.toLowerCase());
      return matchGrade && matchSearch;
    });
  };

  const filtered = getFilteredMaterials();

  // Helper to group E-Notes by Subject, Grade, and Chapter
  const getGroupedEnotes = (notesList) => {
    const groups = {}; // subject -> grade -> chapter -> array of notes
    notesList.forEach(note => {
      const sub = note.subject || 'General Chemistry';
      const grade = note.grade || 'General';
      const chap = note.chapter || 'General Notes';
      if (!groups[sub]) groups[sub] = {};
      if (!groups[sub][grade]) groups[sub][grade] = {};
      if (!groups[sub][grade][chap]) groups[sub][grade][chap] = [];
      groups[sub][grade][chap].push(note);
    });
    return groups;
  };

  const groupedEnotes = libraryTab === 'enote' ? getGroupedEnotes(filtered) : {};

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header section */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl -ml-16 -mb-16"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
              Study Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Chemistry Library</h1>
            <p className="text-slate-300 text-sm max-w-lg">
              Explore professional Chemistry study resources, textbooks, hand-written notes, exam revision papers, and magazines.
            </p>
          </div>
        </div>
      </section>

      {/* Main Library Tab Bar */}
      <div className="flex gap-2 p-1 bg-slate-100/80 border border-slate-200/50 rounded-2xl max-w-xl">
        {[
          { key: 'ebook', label: 'E-Books', icon: BookOpen },
          { key: 'enote', label: 'E-Notes', icon: FileText },
          { key: 'emagazine', label: 'E-Magazines', icon: Bookmark },
          { key: 'downloads', label: 'My Downloads', icon: DownloadCloud }
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setLibraryTab(tab.key);
                setSearch('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition duration-200 cursor-pointer ${
                libraryTab === tab.key
                  ? 'bg-white text-indigo-600 shadow-md font-black'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TabIcon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.key === 'downloads' && localDownloads.length > 0 && (
                <span className="bg-indigo-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {localDownloads.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                libraryTab === 'enote' 
                  ? "Search notes, subjects, or chapters..." 
                  : "Search files, subjects, or grades..."
              }
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold bg-slate-50/50"
            />
          </div>
          <div>
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold bg-slate-50/50 cursor-pointer"
            >
              <option value="all">All Grades / Classes</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* E-Notes Subcategory filters */}
        {libraryTab === 'enote' && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Note Categories:</span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {['all', 'Short Notes', 'Handwritten Notes', 'VVIQ', 'Mindmaps', 'Formula Charts', 'PYQs'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setNoteSubTab(sub)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    noteSubTab === sub
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sub === 'all' ? '📁 All Notes' : sub}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Library Grid / Grouped Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200/60 border-dashed rounded-3xl p-16 text-center flex flex-col items-center justify-center shadow-xs">
          <BookOpen size={48} className="text-slate-300 animate-pulse mb-3" />
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">No materials found</h3>
          <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
            {libraryTab === 'downloads' 
              ? "You haven't opened or downloaded any files yet. Open some materials from the library to save them here!"
              : "We couldn't find any resources matching your current filters or search term."}
          </p>
        </div>
      ) : libraryTab === 'enote' ? (
        /* Grouped E-Notes Layout: Grouped by Subject, Grade, and Chapter */
        <div className="space-y-8">
          {Object.entries(groupedEnotes).map(([subject, grades]) => (
            <div key={subject} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
              {/* Subject Header */}
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="text-base">🧪</span>
                <h2 className="text-sm font-black text-slate-800 tracking-wide uppercase">{subject}</h2>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {Object.values(grades).map(chaps => Object.values(chaps).flat()).flat().length} Notes
                </span>
              </div>

              {/* Grades inside Subject */}
              <div className="space-y-8">
                {Object.entries(grades).map(([grade, chapters]) => (
                  <div key={grade} className="space-y-4 border-l-2 border-indigo-100/50 pl-4">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-indigo-50/50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                        🎓 {grade}
                      </span>
                    </div>

                    {/* Chapters inside Grade */}
                    <div className="space-y-6 pl-1">
                      {Object.entries(chapters).map(([chapter, notes]) => (
                        <div key={chapter} className="space-y-3">
                          <h3 className="text-xs font-extrabold text-slate-500">
                            📁 Chapter: {chapter}
                          </h3>
                          
                          {/* Notes Grid for this Chapter */}
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {notes.map((eb) => (
                              <div key={eb._id} className="card overflow-hidden flex flex-col group hover:shadow-md border border-slate-200/80 hover:border-slate-300 transition-all bg-slate-50/10">
                                {/* Cover */}
                                <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center overflow-hidden">
                                  {eb.coverImage ? (
                                    <img src={eb.coverImage} alt={eb.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <FileText size={40} className="text-white/30" />
                                  )}
                                  {eb.isFree && (
                                    <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded">FREE</span>
                                  )}
                                  {!eb.hasAccess && (
                                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-3xs">
                                      <Lock size={22} className="text-white" />
                                    </div>
                                  )}
                                </div>
                                {/* Info */}
                                <div className="p-4 flex-1 flex flex-col">
                                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                    <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded uppercase">
                                      {eb.subCategory || 'E-Note'}
                                    </span>
                                    {eb.grade && (
                                      <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                                        {eb.grade}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="font-bold text-xs text-slate-800 line-clamp-2 mb-2 group-hover:text-indigo-600 transition">{eb.title}</h3>
                                  
                                  <div className="mt-auto flex items-center justify-between pt-2">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {eb.fileSize || 'PDF File'}
                                    </span>
                                    <button
                                      onClick={() => handleDownload(eb)}
                                      className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                        eb.hasAccess
                                          ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs'
                                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                      }`}
                                    >
                                      {eb.hasAccess ? <><Download size={11} className="stroke-[3px]" /> Open</> : <><Lock size={11} /> Locked</>}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Regular Grid for E-Books, E-Magazines, and Downloads */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((eb) => (
            <div key={eb._id} className="card overflow-hidden flex flex-col group hover:shadow-md border border-slate-200/80 hover:border-slate-300 transition-all bg-white">
              {/* Cover */}
              <div className="relative h-44 bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                {eb.coverImage ? (
                  <img src={eb.coverImage} alt={eb.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen size={44} className="text-white/40" />
                )}
                {eb.isFree && (
                  <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded">FREE</span>
                )}
                {!eb.hasAccess && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-3xs">
                    <Lock size={24} className="text-white" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-xs text-slate-800 line-clamp-2 mb-2 group-hover:text-indigo-600 transition">{eb.title}</h3>
                <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                  {eb.subject && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{eb.subject}</span>}
                  {eb.grade && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{eb.grade}</span>}
                </div>
                {eb.description && <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">{eb.description}</p>}
                
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {eb.pages ? `${eb.pages} p. · ` : ''} {eb.fileSize || 'PDF'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {libraryTab === 'downloads' && (
                      <button
                        onClick={() => removeFromDownloads(eb._id)}
                        className="p-1.5 rounded-lg border border-rose-100 hover:border-rose-200 text-rose-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove from Downloads"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(eb)}
                      className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        eb.hasAccess
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {eb.hasAccess ? <><Download size={11} className="stroke-[3px]" /> Open</> : <><Lock size={11} /> Locked</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
