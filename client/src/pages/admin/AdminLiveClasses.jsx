import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit, X, Save, Video, Clock, Link as LinkIcon, ExternalLink, Users, Bell, Lock } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

const empty = {
  title: '',
  description: '',
  courseName: '',
  course: '',
  instructor: 'Ace2Examz Faculty',
  meetLink: '',
  scheduledAt: '',
  durationMins: 60,
  isActive: true,
  useInternalRoom: true,
  roomPasscode: '',
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-AE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function toLocalInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminLiveClasses() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [courses, setCourses] = useState([]);

  const load = () => api.get('/admin/live-classes').then((r) => setList(r.data)).catch(() => {});

  useEffect(() => {
    load();
    api.get('/courses?includeUnpublished=true').then((r) => setCourses(r.data)).catch(() =>
      api.get('/courses').then((r) => setCourses(r.data)).catch(() => {})
    );
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editing };
      if (!payload.course) payload.course = null;
      if (payload.useInternalRoom) payload.meetLink = '';
      if (editing._id) {
        await api.put(`/admin/live-classes/${editing._id}`, payload);
        toast.success('Live class updated');
      } else {
        await api.post('/admin/live-classes', payload);
        toast.success('Live class scheduled');
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this live class?')) return;
    await api.delete(`/admin/live-classes/${id}`);
    toast.success('Deleted');
    load();
  };

  const set = (k, v) => setEditing((f) => ({ ...f, [k]: v }));

  const upcoming = list.filter((lc) => new Date(lc.scheduledAt) >= new Date());
  const past = list.filter((lc) => new Date(lc.scheduledAt) < new Date());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Live Classes</h1>
          <p className="text-slate-500">Schedule and manage live class sessions for students.</p>
        </div>
        <button onClick={() => setEditing({ ...empty })} className="btn-primary">
          <Plus size={16} /> Schedule Class
        </button>
      </div>

      {/* Form Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-lg">{editing._id ? 'Edit Live Class' : 'Schedule New Class'}</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input required className="input" value={editing.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Organic Chemistry — Reaction Mechanisms" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[70px]" value={editing.description} onChange={(e) => set('description', e.target.value)} placeholder="What will be covered…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Linked Course (optional)</label>
                  <select className="input" value={editing.course || ''} onChange={(e) => {
                    const c = courses.find((x) => x._id === e.target.value);
                    set('course', e.target.value || null);
                    if (c) set('courseName', c.title);
                    else set('courseName', '');
                  }}>
                    <option value="">— Select course —</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>{c.category} · {c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Instructor</label>
                  <input className="input" value={editing.instructor} onChange={(e) => set('instructor', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label flex items-center justify-between">
                  <span>Streaming Mode</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => set('useInternalRoom', true)}
                    className={`p-3 rounded-xl border-2 text-left transition ${editing.useInternalRoom ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <div className="font-semibold text-sm flex items-center gap-1.5"><Video size={14} className="text-brand-600" /> Self-hosted (WebRTC)</div>
                    <div className="text-[10px] text-slate-500">Runs on ace2examz.com — no Zoom/Meet needed</div>
                  </button>
                  <button type="button" onClick={() => set('useInternalRoom', false)}
                    className={`p-3 rounded-xl border-2 text-left transition ${!editing.useInternalRoom ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <div className="font-semibold text-sm flex items-center gap-1.5"><LinkIcon size={14} className="text-slate-600" /> External Link</div>
                    <div className="text-[10px] text-slate-500">Zoom / Meet / etc.</div>
                  </button>
                </div>
              </div>
              {editing.useInternalRoom ? (
                <div>
                  <label className="label flex items-center gap-1"><Lock size={12} /> Room Passcode (optional)</label>
                  <input className="input" value={editing.roomPasscode} onChange={(e) => set('roomPasscode', e.target.value)} placeholder="Leave blank for no passcode" maxLength={20} />
                  <p className="text-[11px] text-slate-500 mt-1">Enrolled students don't need a passcode by default.</p>
                </div>
              ) : (
                <div>
                  <label className="label">Meet / Zoom Link *</label>
                  <input required={!editing.useInternalRoom} type="url" className="input" value={editing.meetLink} onChange={(e) => set('meetLink', e.target.value)} placeholder="https://meet.google.com/…" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Scheduled At *</label>
                  <input required type="datetime-local" className="input" value={toLocalInput(editing.scheduledAt)} onChange={(e) => set('scheduledAt', new Date(e.target.value).toISOString())} />
                </div>
                <div>
                  <label className="label">Duration (minutes)</label>
                  <input type="number" min="15" className="input" value={editing.durationMins} onChange={(e) => set('durationMins', Number(e.target.value))} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.isActive} onChange={(e) => set('isActive', e.target.checked)} />
                <span className="text-sm font-medium">Active (visible to students)</span>
              </label>
              {editing.course && (() => {
                const c = courses.find((x) => x._id === editing.course);
                const cnt = c?.studentsEnrolled || 0;
                return (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-start gap-2">
                    <Bell size={14} className="mt-0.5 shrink-0" />
                    <div>
                      <b>{cnt > 0 ? `${cnt} enrolled student${cnt !== 1 ? 's' : ''}` : 'All enrolled students'}</b> of <i>{c?.title}</i> will get an in-app notification with the join link the moment you {editing._id ? 'update' : 'schedule'} this class.
                    </div>
                  </div>
                );
              })()}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center">
                  <Save size={16} /> {editing._id ? 'Update' : 'Schedule'}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" /></span>
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="card p-8 text-center text-slate-400">
            No upcoming classes scheduled. <button onClick={() => setEditing({ ...empty })} className="text-brand-700 font-semibold">Schedule one →</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((lc) => (
              <ClassCard key={lc._id} lc={lc} onEdit={() => setEditing({ ...lc, scheduledAt: lc.scheduledAt })} onDelete={() => del(lc._id)} />
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="font-bold text-lg text-slate-900 mb-4 text-slate-400">Past ({past.length})</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {past.slice(0, 6).map((lc) => (
              <ClassCard key={lc._id} lc={lc} onEdit={() => setEditing({ ...lc })} onDelete={() => del(lc._id)} past />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ClassCard({ lc, onEdit, onDelete, past }) {
  return (
    <div className={`card overflow-hidden flex flex-col ${past ? 'border-slate-100' : 'border-rose-100'}`}>
      <div className={`p-4 ${past ? 'bg-slate-50' : 'bg-gradient-to-br from-rose-50 to-pink-50'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg grid place-items-center text-white shrink-0 ${past ? 'bg-slate-400' : 'bg-gradient-to-br from-rose-500 to-pink-500'}`}>
              <Video size={14} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-slate-900 leading-tight truncate max-w-[180px]">{lc.title}</div>
              {lc.courseName && <div className="text-[10px] text-slate-500 truncate">{lc.courseName}</div>}
            </div>
          </div>
          {!past && (
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${lc.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {lc.isActive ? 'Active' : 'Hidden'}
            </span>
          )}
        </div>
      </div>
      <div className="p-4 flex-1 space-y-2">
        {lc.description && <p className="text-xs text-slate-500 line-clamp-2">{lc.description}</p>}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock size={12} className="text-slate-400" />
          {new Date(lc.scheduledAt).toLocaleString('en-AE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          <span className="text-slate-300">·</span>{lc.durationMins} min
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <span className="font-medium">By:</span> {lc.instructor}
        </div>
      </div>
      <div className="px-4 pb-4 flex gap-2">
        {lc.useInternalRoom ? (
          <RouterLink to={`/live/${lc._id}`} className="btn-primary flex-1 justify-center text-xs py-1.5">
            <Video size={12} /> {lc.status === 'live' ? 'Rejoin Live' : 'Open Room'}
          </RouterLink>
        ) : (
          <a href={lc.meetLink} target="_blank" rel="noreferrer" className="btn-outline flex-1 justify-center text-xs py-1.5">
            <ExternalLink size={12} /> Join
          </a>
        )}
        <button onClick={onEdit} className="p-2 rounded-lg hover:bg-brand-50 text-brand-600"><Edit size={14} /></button>
        <button onClick={onDelete} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}
