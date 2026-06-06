import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import { Mail, Loader2, Trash2, Download, Users } from 'lucide-react';

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchSubscribers = async () => {
    try {
      const { data } = await api.get('/subscribers/admin');
      setSubscribers(data.subscribers || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubscribers(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Remove this subscriber?')) return;
    setDeleting(id);
    try {
      await api.delete(`/subscribers/${id}`);
      setSubscribers((prev) => prev.filter((s) => s._id !== id));
      toast.success('Subscriber removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    } finally {
      setDeleting(null);
    }
  };

  const exportCSV = () => {
    const rows = [['Email', 'Subscribed At']];
    subscribers.forEach((s) => rows.push([s.email, new Date(s.createdAt).toLocaleString('en-AE')]));
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold flex items-center gap-2">
            <Mail className="text-brand-600" size={22} /> Email Subscribers
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Students who subscribed via the footer newsletter form.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="chip bg-brand-50 text-brand-700 font-semibold flex items-center gap-1.5">
            <Users size={13} /> {subscribers.length} total
          </span>
          {subscribers.length > 0 && (
            <button onClick={exportCSV} className="btn btn-outline flex items-center gap-1.5 text-sm">
              <Download size={15} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : subscribers.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <Mail size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No subscribers yet</p>
          <p className="text-sm mt-1">Students who fill in the footer form will appear here.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Subscribed At</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s, i) => (
                <tr key={s._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${s.email}`} className="font-medium text-brand-700 hover:underline">
                      {s.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(s.createdAt).toLocaleString('en-AE')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(s._id)}
                      disabled={deleting === s._id}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove subscriber"
                    >
                      {deleting === s._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
