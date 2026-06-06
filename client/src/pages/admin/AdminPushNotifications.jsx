import { useState, useEffect } from 'react';
import api from '../../api/client.js';
import { Bell, Send, Loader2, Users, User, Info, X, Clock, Trash2, RefreshCw, Eye, Sparkles, History } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPushNotifications() {
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Lists state
  const [courses, setCourses] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    message: '',
    link: '',
    image: '',
    target: 'all', // 'all' or 'specific'
    targetUserIds: [],
    showBuyButton: false,
    buyCourseId: '',
    showCallButton: false,
    callPhoneNumber: '',
    isDismissable: true,
    sendLater: false,
    scheduledAt: '',
  });

  const [search, setSearch] = useState('');

  const loadCampaigns = () => {
    setLoadingCampaigns(true);
    api.get('/notifications/campaigns')
      .then(({ data }) => setCampaigns(data || []))
      .catch(() => toast.error('Failed to load campaigns list'))
      .finally(() => setLoadingCampaigns(false));
  };

  useEffect(() => {
    loadCampaigns();
    api.get('/courses?includeUnpublished=true')
      .then(({ data }) => setCourses(data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (form.target === 'specific') {
      setLoadingStudents(true);
      api.get('/admin/students')
        .then(({ data }) => {
          setStudents(data || []);
        })
        .catch(() => {
          toast.error('Failed to load students list');
        })
        .finally(() => {
          setLoadingStudents(false);
        });
    }
  }, [form.target]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const dataForm = new FormData();
      dataForm.append('file', file);
      const { data } = await api.post('/upload/screenshot', dataForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((p) => ({ ...p, image: data.url }));
      toast.success('Image uploaded successfully!');
    } catch (err) {
      toast.error('Image upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      toast.error('Title and message are required');
      return;
    }
    if (form.target === 'specific' && form.targetUserIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    if (form.sendLater && !form.scheduledAt) {
      toast.error('Please select a schedule time');
      return;
    }

    setSending(true);
    try {
      const { data } = await api.post('/notifications/send', form);
      if (form.sendLater) {
        toast.success('Notification successfully scheduled!');
      } else {
        toast.success(`Notification successfully dispatched to ${data.count || 0} students!`);
      }
      setForm({
        title: '',
        message: '',
        link: '',
        image: '',
        target: 'all',
        targetUserIds: [],
        showBuyButton: false,
        buyCourseId: '',
        showCallButton: false,
        callPhoneNumber: '',
        isDismissable: true,
        sendLater: false,
        scheduledAt: '',
      });
      setSearch('');
      loadCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (campaign) => {
    if (!confirm('Are you sure you want to resend this notification immediately?')) return;
    try {
      const { data } = await api.post(`/notifications/campaigns/${campaign._id}/resend`);
      toast.success(`Notification resent to ${data.count || 0} students!`);
      loadCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resend failed');
    }
  };

  const handleClone = (campaign) => {
    setForm({
      title: campaign.title || '',
      message: campaign.message || '',
      link: campaign.link || '',
      image: campaign.image || '',
      target: campaign.target || 'all',
      targetUserIds: campaign.targetUserIds || [],
      showBuyButton: !!campaign.showBuyButton,
      buyCourseId: campaign.buyCourseId?._id || campaign.buyCourseId || '',
      showCallButton: !!campaign.showCallButton,
      callPhoneNumber: campaign.callPhoneNumber || '',
      isDismissable: campaign.isDismissable !== false,
      sendLater: false,
      scheduledAt: '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success('Campaign details loaded into form!');
  };

  const handleDeleteCampaign = async (id) => {
    if (!confirm('Delete this campaign log? Scheduled campaigns will be cancelled, and sent ones will no longer show in history.')) return;
    try {
      await api.delete(`/notifications/campaigns/${id}`);
      toast.success('Campaign log deleted');
      loadCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const toggleStudent = (id) => {
    setForm((prev) => {
      const exists = prev.targetUserIds.includes(id);
      const targetUserIds = exists
        ? prev.targetUserIds.filter((item) => item !== id)
        : [...prev.targetUserIds, id];
      return { ...prev, targetUserIds };
    });
  };

  const filteredStudents = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Bell size={24} className="text-brand-600" /> Push Notifications
        </h1>
        <p className="text-slate-500 text-sm">Send real-time alerts and FCM push notifications to student accounts.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="space-y-4">
          <div className="card p-5 bg-white border border-slate-100 shadow-soft">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-2">
              <Info size={16} className="text-brand-600" /> How it Works
            </h3>
            <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside">
              <li>Notifications appear inside the student's notification center.</li>
              <li>If the student has granted permission, a background push notification is dispatched using Firebase Cloud Messaging (FCM).</li>
              <li>You can optionally supply a target link (e.g. <code>/courses</code>) to redirect students when clicked.</li>
              <li>Add an optional banner image to be displayed within the push notification payload.</li>
            </ul>
          </div>
        </div>

        {/* Form Column */}
        <form onSubmit={handleSubmit} className="md:col-span-2 card p-6 bg-white border border-slate-100 shadow-soft space-y-5">
          <div>
            <label className="label">Audience Target <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, target: 'all', targetUserIds: [] }))}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                  form.target === 'all'
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users size={16} /> All Students
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, target: 'specific' }))}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                  form.target === 'specific'
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User size={16} /> Select Students
              </button>
            </div>
          </div>

          {form.target === 'specific' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">
                  Select Recipients ({form.targetUserIds.length} selected)
                </span>
                <input
                  type="text"
                  placeholder="Filter student list..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input py-1.5 px-3 text-xs max-w-xs"
                />
              </div>

              {loadingStudents ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Loader2 className="animate-spin mx-auto mb-1.5" size={16} /> Loading students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No students matching search criteria.</div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 bg-white border border-slate-100 rounded-lg p-2">
                  {filteredStudents.map((student) => {
                    const isChecked = form.targetUserIds.includes(student._id);
                    return (
                      <label
                        key={student._id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition text-xs ${
                          isChecked ? 'bg-brand-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStudent(student._id)}
                            className="w-3.5 h-3.5 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
                          />
                          <div>
                            <span className="font-semibold text-slate-700">{student.name}</span>
                            <span className="text-slate-400 font-normal ml-1">({student.email})</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Notification Title <span className="text-red-500">*</span></label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Class Rescheduled!"
                className="input"
              />
            </div>

            <div>
              <label className="label">Action Redirect Link <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input
                type="text"
                value={form.link}
                onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                placeholder="e.g. /courses or /live/xxxx"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Notification Image URL <span className="text-slate-400 font-normal">(Optional)</span></label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={form.image}
                onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="input flex-1"
              />
              <label className="btn border border-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 py-2 px-3 text-xs font-semibold whitespace-nowrap self-stretch justify-center">
                {uploadingImg ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} className="rotate-[270deg]" />}
                Upload Image
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            {form.image && (
              <div className="mt-2 relative inline-block">
                <img src={form.image} alt="Notification preview" className="h-20 w-auto rounded-lg border object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, image: '' }))}
                  className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1"
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          {/* Call to Action Options */}
          <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-4">
            <span className="text-xs font-bold text-slate-700 block mb-1">Call to Action (CTA) Options</span>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showBuyButton}
                    onChange={(e) => setForm((p) => ({ ...p, showBuyButton: e.target.checked }))}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-700">Show "Buy Course" Button</span>
                </label>
                
                {form.showBuyButton && (
                  <div className="mt-1 animate-in fade-in duration-200">
                    <label className="label text-[11px] text-slate-500">Select Target Course</label>
                    <select
                      value={form.buyCourseId}
                      onChange={(e) => setForm((p) => ({ ...p, buyCourseId: e.target.value }))}
                      className="input py-1.5 px-3 text-xs"
                      required={form.showBuyButton}
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showCallButton}
                    onChange={(e) => setForm((p) => ({ ...p, showCallButton: e.target.checked }))}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-700">Show "Call" Button</span>
                </label>
                
                {form.showCallButton && (
                  <div className="mt-1 animate-in fade-in duration-200">
                    <label className="label text-[11px] text-slate-500">Phone Number (with country code)</label>
                    <input
                      type="text"
                      value={form.callPhoneNumber}
                      onChange={(e) => setForm((p) => ({ ...p, callPhoneNumber: e.target.value }))}
                      placeholder="e.g. +919876543210"
                      className="input py-1.5 px-3 text-xs"
                      required={form.showCallButton}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scheduling Options */}
          <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-4">
            <span className="text-xs font-bold text-slate-700 block mb-1">Scheduling & Dismissability</span>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Delivery Timing</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="sendTiming"
                      checked={!form.sendLater}
                      onChange={() => setForm((p) => ({ ...p, sendLater: false, scheduledAt: '' }))}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    Send Now
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="sendTiming"
                      checked={form.sendLater}
                      onChange={() => setForm((p) => ({ ...p, sendLater: true }))}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    Send Later (Schedule)
                  </label>
                </div>

                {form.sendLater && (
                  <div className="mt-2 animate-in fade-in duration-200">
                    <label className="label text-[11px] text-slate-500">Scheduled Date & Time</label>
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                      className="input py-1.5 px-3 text-xs"
                      required={form.sendLater}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={form.isDismissable}
                    onChange={(e) => setForm((p) => ({ ...p, isDismissable: e.target.checked }))}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Dismissable by student</span>
                    <span className="text-[10px] text-slate-400 font-normal">If unchecked, students cannot close this notification in the header bell until marked read.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Alert Message <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="Provide a concise text message to display on student devices..."
              className="input"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={sending}
              className="btn-primary px-6 py-2.5 text-sm font-bold shadow-md animate-none"
            >
              {sending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing...
                </>
              ) : form.sendLater ? (
                <>
                  <Clock size={16} /> Schedule Broadcast
                </>
              ) : (
                <>
                  <Send size={16} /> Broadcast Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History & Analytics */}
      <div className="card p-6 bg-white border border-slate-100 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
              <History size={20} className="text-brand-600" /> Broadcast History & Analytics
            </h2>
            <p className="text-xs text-slate-400">Track delivery status, CTR analytics, and resend campaigns.</p>
          </div>
          <button
            onClick={loadCampaigns}
            disabled={loadingCampaigns}
            className="p-2 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-50 transition"
            title="Refresh History"
          >
            <RefreshCw size={16} className={loadingCampaigns ? 'animate-spin' : ''} />
          </button>
        </div>

        {loadingCampaigns && campaigns.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <Loader2 className="animate-spin mx-auto mb-2 text-brand-500" size={24} />
            Loading history...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No notification campaigns dispatched yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] bg-slate-50/50">
                  <th className="py-3 px-4">Campaign details</th>
                  <th className="py-3 px-4">CTAs & Actions</th>
                  <th className="py-3 px-4">Status & Schedule</th>
                  <th className="py-3 px-4">Analytics (Delivery / CTR)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => {
                  const ctr = c.deliveryCount > 0 ? Math.round((c.clicks / c.deliveryCount) * 100) : 0;
                  const openRate = c.deliveryCount > 0 ? Math.round((c.readCount / c.deliveryCount) * 100) : 0;
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 space-y-1 max-w-xs">
                        <div className="font-bold text-slate-800 text-sm leading-snug">{c.title}</div>
                        <div className="text-slate-500 line-clamp-2 leading-relaxed">{c.message}</div>
                        {c.image && (
                          <div className="flex items-center gap-1 text-[10px] text-brand-600 font-semibold mt-1">
                            <Eye size={12} /> Has Banner Image
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 space-y-1">
                        {c.showBuyButton && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold text-[10px] border border-brand-100 max-w-[160px] truncate">
                            Buy: {c.buyCourseId?.title || 'Selected Course'}
                          </div>
                        )}
                        {c.showCallButton && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-100 mt-1 block w-fit">
                            Call: {c.callPhoneNumber}
                          </div>
                        )}
                        {!c.showBuyButton && !c.showCallButton && (
                          <span className="text-slate-400 text-[10px]">None</span>
                        )}
                      </td>
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            c.status === 'sent' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {c.status === 'scheduled' 
                            ? `For: ${new Date(c.scheduledAt).toLocaleString()}`
                            : `Sent: ${new Date(c.createdAt).toLocaleString()}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Dismissable: <span className="font-semibold text-slate-600">{c.isDismissable !== false ? 'Yes' : 'No'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 space-y-1.5">
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-slate-400">Audience:</span>{' '}
                            <span className="font-bold text-slate-700 uppercase">{c.target}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Delivered:</span>{' '}
                            <span className="font-bold text-slate-700">{c.deliveryCount || 0}</span>
                          </div>
                        </div>
                        {c.status === 'sent' && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[9px] text-slate-400">
                              <span>Open Rate: {openRate}% ({c.readCount || 0} read)</span>
                              <span>CTR: {ctr}% ({c.clicks || 0} clicks)</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                              <div style={{ width: `${openRate}%` }} className="h-full bg-blue-500" title={`Open Rate: ${openRate}%`} />
                              <div style={{ width: `${ctr}%` }} className="h-full bg-brand-500 border-l border-white" title={`CTR: ${ctr}%`} />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status === 'sent' && (
                            <button
                              onClick={() => handleResend(c)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Resend campaign immediately"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleClone(c)}
                            className="p-1.5 text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition"
                            title="Load / clone details to form"
                          >
                            <Sparkles size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(c._id)}
                            className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete campaign"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
