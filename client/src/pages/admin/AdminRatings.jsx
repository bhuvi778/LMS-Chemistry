import { useState, useEffect } from 'react';
import api from '../../api/client.js';
import { Star, Trash2, Calendar, BookOpen, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminRatings() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/ratings')
      .then(({ data }) => {
        setList(data || []);
      })
      .catch(() => {
        toast.error('Failed to load course ratings');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const deleteRating = async (courseId, reviewId) => {
    if (!window.confirm('Are you sure you want to delete this rating/review?')) return;
    setDeletingId(reviewId);
    try {
      await api.delete(`/admin/ratings/${courseId}/review/${reviewId}`);
      toast.success('Rating deleted successfully');
      setList(prev => prev.filter(item => item._id !== reviewId));
    } catch (err) {
      toast.error('Failed to delete rating');
    } finally {
      setDeletingId(null);
    }
  };

  const fmtDate = (ts) => {
    return new Date(ts).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filtered = list.filter(item => {
    const q = search.toLowerCase();
    return (
      item.studentName?.toLowerCase().includes(q) ||
      item.courseTitle?.toLowerCase().includes(q) ||
      item.comment?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Course Ratings &amp; Reviews</h1>
          <p className="text-slate-500 text-sm">Monitor and moderate course-specific student reviews and ratings.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="input pl-9 !py-1.5"
            placeholder="Search by student, course, comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card bg-white shadow-soft overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-bold text-sm text-slate-700">
          Course Reviews ({filtered.length})
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="animate-spin mx-auto mb-2 text-brand-500" size={24} />
            <span>Loading reviews...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {search ? 'No matching reviews found.' : 'No course ratings or reviews found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="p-4">Student</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Comment</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{item.studentName || 'Student'}</div>
                      <div className="text-[11px] text-slate-400">{item.studentEmail}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-1.5 font-medium text-slate-700">
                        <BookOpen size={13} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="break-words max-w-[260px]" title={item.courseTitle}>{item.courseTitle}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            size={14}
                            className={idx < item.rating ? 'fill-amber-500' : 'text-slate-200'}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-4 max-w-[300px]">
                      <div className="text-slate-600 truncate-2-lines italic">
                        {item.comment ? `"${item.comment}"` : <span className="text-slate-400 font-normal">(No comment)</span>}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {fmtDate(item.createdAt)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteRating(item.courseId, item._id)}
                        disabled={deletingId === item._id}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        title="Delete rating"
                      >
                        {deletingId === item._id ? (
                          <Loader2 size={15} className="animate-spin text-rose-500" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
