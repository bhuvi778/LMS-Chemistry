import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Search,
  Check,
  X as XIcon,
  ToggleLeft,
  ToggleRight,
  Users,
  Star,
  Copy,
  Youtube,
} from 'lucide-react';
import Pagination, { usePaged } from '../../components/Pagination.jsx';

const PAGE_SIZE = 10;

export default function AdminCourses() {
  const [list, setList] = useState([]);
  const [view, setView] = useState('grid'); // 'grid' | 'table'
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('ALL');
  const [page, setPage] = useState(1);
  const [priceEdit, setPriceEdit] = useState({}); // {id: value}
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    return api
      .get('/courses?includeUnpublished=true')
      .then((r) => setList(r.data))
      .catch(() => api.get('/courses').then((r) => setList(r.data)))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(list.map((c) => c.category))).sort()],
    [list]
  );

  const filtered = useMemo(() => {
    return list.filter((c) => {
      if (cat !== 'ALL' && c.category !== cat) return false;
      if (q && !(`${c.title} ${c.instructor} ${c.category}`.toLowerCase().includes(q.toLowerCase())))
        return false;
      return true;
    });
  }, [list, q, cat]);

  useEffect(() => {
    setPage(1);
  }, [q, cat, view]);

  const paged = usePaged(filtered, page, PAGE_SIZE);

  const del = async (id) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Course deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const duplicate = async (id) => {
    if (!confirm('Duplicate this course?')) return;
    try {
      await api.post(`/courses/${id}/duplicate`);
      toast.success('Course duplicated successfully as Draft');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Duplication failed');
    }
  };

  const toggleStatus = async (c) => {
    const nextVal = !c.isPublished;
    setList((prev) =>
      prev.map((x) => (x._id === c._id ? { ...x, isPublished: nextVal } : x))
    );
    try {
      await api.put(`/courses/${c._id}`, { isPublished: nextVal });
      toast.success(nextVal ? 'Published' : 'Set to draft');
    } catch (e) {
      setList((prev) =>
        prev.map((x) => (x._id === c._id ? { ...x, isPublished: !nextVal } : x))
      );
      toast.error('Failed to update');
    }
  };

  const savePrice = async (c) => {
    const val = Number(priceEdit[c._id]);
    if (Number.isNaN(val) || val < 0) return toast.error('Invalid price');
    try {
      await api.put(`/courses/${c._id}`, { price: val });
      setList((prev) => prev.map((x) => (x._id === c._id ? { ...x, price: val } : x)));
      setPriceEdit((p) => {
        const n = { ...p };
        delete n[c._id];
        return n;
      });
      toast.success('Price updated');
    } catch {
      toast.error('Failed');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Courses</h1>
          <p className="text-slate-500">Manage all chemistry courses — toggle status & edit price inline.</p>
        </div>
        <Link to="/admin/courses/new" className="btn-primary self-start md:self-auto">
          <Plus size={16} /> Add Course
        </Link>
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-5 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses, instructor…"
            className="input pl-9"
          />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input lg:max-w-xs">
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'ALL' ? 'All Categories' : c}
            </option>
          ))}
        </select>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 ${
              view === 'grid' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500'
            }`}
          >
            <LayoutGrid size={16} /> Cards
          </button>
          <button
            onClick={() => setView('table')}
            className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 ${
              view === 'table' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500'
            }`}
          >
            <List size={16} /> Table
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          No courses match your filters.
        </div>
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paged.map((c) => {
            const editing = priceEdit[c._id] !== undefined;
            return (
              <div key={c._id} className="card overflow-hidden flex flex-col group">
                <div className="relative h-40 overflow-hidden bg-slate-100">
                  <img
                    src={c.thumbnail}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-2 left-2 chip bg-white/95 backdrop-blur text-brand-700 shadow">
                    {(c.categories?.[0] || c.category) || 'No Category'}
                  </div>
                  <button
                    onClick={() => toggleStatus(c)}
                    title={c.isPublished ? 'Click to unpublish' : 'Click to publish'}
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow transition ${
                      c.isPublished
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-slate-400 text-white hover:bg-slate-500'
                    }`}
                  >
                    {c.isPublished ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {c.isPublished ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 line-clamp-2 min-h-[3rem]">
                    {c.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">by {c.instructor}</div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star size={12} fill="currentColor" /> {c.rating || 4.8}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-400 mb-1">
                      Price
                    </div>
                    {editing ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          type="number"
                          value={priceEdit[c._id]}
                          onChange={(e) =>
                            setPriceEdit((p) => ({ ...p, [c._id]: e.target.value }))
                          }
                          className="input !py-1.5 !px-2 text-sm"
                        />
                        <button
                          onClick={() => savePrice(c)}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setPriceEdit((p) => {
                              const n = { ...p };
                              delete n[c._id];
                              return n;
                            })
                          }
                          className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setPriceEdit((p) => ({ ...p, [c._id]: c.price || 0 }))
                        }
                        className="flex items-baseline gap-2 hover:text-brand-700 group/p"
                      >
                        <span className="text-xl font-extrabold gradient-text">
                          ₹{(c.price || 0).toLocaleString()}
                        </span>
                        {c.mrp > c.price && (
                          <span className="text-xs line-through text-slate-400">
                            ₹{c.mrp.toLocaleString()}
                          </span>
                        )}
                        <Edit
                          size={12}
                          className="opacity-0 group-hover/p:opacity-100 text-brand-500"
                        />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex gap-1.5">
                    <Link
                      to={`/admin/courses/${c._id}/edit`}
                      className="btn-outline !py-1.5 !px-2 text-xs"
                      title="Edit Course"
                    >
                      <Edit size={13} />
                    </Link>
                    <Link
                      to={`/admin/courses/new?duplicateFrom=${c._id}`}
                      className="btn-outline !py-1.5 !px-2 text-xs text-brand-700 border-brand-200 hover:bg-brand-50"
                      title="Duplicate Course"
                    >
                      <Copy size={13} />
                    </Link>
                    <Link
                      to={`/admin/courses/${c._id}/content`}
                      className="flex-1 btn-primary !py-1.5 text-xs justify-center"
                    >
                      Content
                    </Link>
                    <Link
                      to={`/admin/courses/${c._id}/content?tab=yt-lectures`}
                      className="btn-outline !py-1.5 !px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      title="Manage YT Lectures"
                    >
                      <Youtube size={13} />
                    </Link>
                    <button
                      onClick={() => del(c._id)}
                      className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                      title="Delete Course"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => (
                <tr key={c._id} className="border-t border-slate-100">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.thumbnail}
                        alt=""
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <div className="font-semibold">{c.title}</div>
                        <div className="text-xs text-slate-500">{c.instructor}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {(c.categories?.length ? c.categories : [c.category]).filter(Boolean).map((cat) => (
                      <span key={cat} className="chip bg-brand-50 text-brand-700 mr-1">{cat}</span>
                    ))}
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star size={12} fill="currentColor" /> {c.rating || 4.8}
                    </span>
                  </td>
                  <td className="p-4 font-semibold">₹{c.price?.toLocaleString()}</td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleStatus(c)}
                      className={`chip ${
                        c.isPublished
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      } cursor-pointer hover:shadow-sm`}
                    >
                      {c.isPublished ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                      {c.isPublished ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-2">
                      <Link
                        to={`/admin/courses/${c._id}/edit`}
                        className="p-2 rounded-lg hover:bg-brand-50 text-brand-700"
                        title="Edit Course"
                      >
                        <Edit size={16} />
                      </Link>
                      <Link
                        to={`/admin/courses/new?duplicateFrom=${c._id}`}
                        className="p-2 rounded-lg hover:bg-brand-50 text-brand-700"
                        title="Duplicate Course"
                      >
                        <Copy size={16} />
                      </Link>
                      <Link
                        to={`/admin/courses/${c._id}/content`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100"
                        title="Manage Content"
                      >
                        Content
                      </Link>
                      <Link
                        to={`/admin/courses/${c._id}/content?tab=yt-lectures`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100"
                        title="Manage YT Lectures"
                      >
                        YT Lectures
                      </Link>
                      <button
                        onClick={() => del(c._id)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                        title="Delete Course"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
    </div>
  );
}
