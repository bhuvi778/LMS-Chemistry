import { useState, useEffect } from 'react';
import api from '../../api/client.js';
import { Mail, Phone, Calendar, Trash2, Eye, CheckCircle2, MessageSquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminEnquiries() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/enquiries')
      .then(({ data }) => {
        setList(data || []);
      })
      .catch(() => {
        toast.error('Failed to load enquiries');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/enquiries/${id}`, { status });
      toast.success(`Enquiry marked as ${status}`);
      load();
      if (selected?._id === id) {
        setSelected((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const deleteEnquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await api.delete(`/enquiries/${id}`);
      toast.success('Enquiry deleted');
      load();
      if (selected?._id === id) setSelected(null);
    } catch (err) {
      toast.error('Failed to delete enquiry');
    }
  };

  const fmtDate = (ts) => {
    return new Date(ts).toLocaleString('en-AE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Contact Us Enquiries</h1>
        <p className="text-slate-500 text-sm">Review, track, and reply to student query submissions.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* List Pane */}
        <div className="lg:col-span-2 card bg-white shadow-soft overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-bold text-sm text-slate-700">
            Enquiry Submissions ({list.length})
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="animate-spin mx-auto mb-2 text-brand-500" size={24} />
              <span>Loading submissions...</span>
            </div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No enquiries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="p-4">Sender</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {list.map((item) => (
                    <tr
                      key={item._id}
                      onClick={() => setSelected(item)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition ${
                        selected?._id === item._id ? 'bg-brand-50/30' : ''
                      } ${item.status === 'new' ? 'font-medium text-slate-900' : 'text-slate-600'}`}
                    >
                      <td className="p-4">
                        <div>{item.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{item.email}</div>
                      </td>
                      <td className="p-4 truncate max-w-[150px]">{item.subject || '(No Subject)'}</td>
                      <td className="p-4 text-xs text-slate-400">{fmtDate(item.createdAt)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'new' ? 'bg-rose-100 text-rose-600' :
                          item.status === 'read' ? 'bg-amber-100 text-amber-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setSelected(item)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => deleteEnquiry(item._id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title="Delete"
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
        </div>

        {/* View/Details Pane */}
        <div className="card bg-white shadow-soft p-6 h-fit space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-base">Enquiry Detail</h3>
            <p className="text-[11px] text-slate-400">Click on any entry in the list to view full details.</p>
          </div>

          {selected ? (
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Sender</div>
                <div className="font-bold text-slate-800">{selected.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Mail size={12} /> {selected.email}
                </div>
                {selected.phone && (
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Phone size={12} /> {selected.phone}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Subject</div>
                <div className="font-semibold text-slate-700 mt-0.5">{selected.subject || '(No Subject)'}</div>
              </div>

              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Date Submitted</div>
                <div className="text-slate-600 flex items-center gap-1 mt-0.5">
                  <Calendar size={13} /> {fmtDate(selected.createdAt)}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Message</div>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selected.message}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <div className="text-xs font-semibold text-slate-500">Update Status:</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(selected._id, 'read')}
                    disabled={selected.status === 'read'}
                    className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
                  >
                    <CheckCircle2 size={13} /> Mark Read
                  </button>
                  <button
                    onClick={() => updateStatus(selected._id, 'replied')}
                    disabled={selected.status === 'replied'}
                    className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    <MessageSquare size={13} /> Mark Replied
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              No submission selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
