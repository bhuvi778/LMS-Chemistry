import { useState, useEffect } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import { 
  Users, 
  Calendar, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Star,
  FileText,
  AlertCircle,
  X,
  Phone,
  Mail,
  Plus,
  Trash2,
  Edit,
  Layers,
  PlusCircle,
  Check
} from 'lucide-react';

const DEFAULT_LIMITS = {
  mentorshipMonthlyLimit: 2,
  doubtMonthlyLimit: 4,
  doubtWeeklyLimit: 1,
};

const formatTimeForSlot = (value) => {
  if (!value) return '';
  const [hourRaw, minute = '00'] = value.split(':');
  let hour = Number(hourRaw);
  if (!Number.isFinite(hour)) return '';
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute.padStart(2, '0')} ${period}`;
};

const timeToMinutes = (value) => {
  if (!value) return null;
  const [hour, minute = '0'] = value.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

const displayTimeToInput = (value = '') => {
  const match = String(value).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return '';
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  if (!period && hour > 23) return '';
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const parseSlotToTimes = (slot = '') => {
  const parts = String(slot).split(/\s*(?:-|to|To|TO)\s*/).filter(Boolean);
  return {
    start: displayTimeToInput(parts[0] || ''),
    end: displayTimeToInput(parts[1] || ''),
  };
};

const buildTimeSlot = (start, end) => `${formatTimeForSlot(start)} - ${formatTimeForSlot(end)}`;

export default function AdminSession() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending', 'Scheduled', 'Completed', 'Cancelled', 'Settings'

  // Availability Settings States
  const [settingsList, setSettingsList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingSettingId, setEditingSettingId] = useState(null);
  const [targetType, setTargetType] = useState('global');
  const [targetId, setTargetId] = useState('global');
  const [enabled, setEnabled] = useState(true);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [mentorshipMonthlyLimit, setSessionMonthlyLimit] = useState(DEFAULT_LIMITS.mentorshipMonthlyLimit);
  const [doubtMonthlyLimit, setDoubtMonthlyLimit] = useState(DEFAULT_LIMITS.doubtMonthlyLimit);
  const [doubtWeeklyLimit, setDoubtWeeklyLimit] = useState(DEFAULT_LIMITS.doubtWeeklyLimit);
  const [dateInput, setDateInput] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('10:00');
  const [slotEndTime, setSlotEndTime] = useState('11:00');

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Schedule form states
  const [mentorName, setMentorName] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [scheduleStartTime, setScheduleStartTime] = useState('10:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('11:00');
  const [createLiveClass, setCreateLiveClass] = useState(false);

  // Admin-create session for a specific student
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [createForm, setCreateForm] = useState({
    sessionType: 'mentorship',
    subject: '',
    description: '',
    preferredDate: '',
    preferredTimeSlot: '',
  });
  const [createBusy, setCreateBusy] = useState(false);

  // Complete session form states
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [studyPlan, setStudyPlan] = useState('');

  const fetchSettingsData = async () => {
    try {
      setSettingsLoading(true);
      const [settingsRes, coursesRes, categoriesRes] = await Promise.all([
        api.get('/ace-track/mentorship/settings/all'),
        api.get('/courses?includeUnpublished=true').catch(() => api.get('/courses')),
        api.get('/categories').catch(() => ({ data: [] }))
      ]);
      setSettingsList(settingsRes.data);
      setCourses(coursesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load availability settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Settings') {
      fetchSettingsData();
    }
  }, [activeTab]);

  const handleEditSetting = (setting) => {
    setEditingSettingId(setting._id);
    setTargetType(setting.targetType);
    setTargetId(setting.targetId);
    setEnabled(setting.enabled);
    setAvailableDates(setting.availableDates || []);
    setAvailableSlots(setting.availableSlots || []);
    setSessionMonthlyLimit(setting.mentorshipMonthlyLimit ?? DEFAULT_LIMITS.mentorshipMonthlyLimit);
    setDoubtMonthlyLimit(setting.doubtMonthlyLimit ?? DEFAULT_LIMITS.doubtMonthlyLimit);
    setDoubtWeeklyLimit(setting.doubtWeeklyLimit ?? DEFAULT_LIMITS.doubtWeeklyLimit);
    setDateInput('');
    setSlotStartTime('10:00');
    setSlotEndTime('11:00');
    setShowSettingsModal(true);
  };

  const handleAddSetting = () => {
    setEditingSettingId(null);
    setTargetType('course');
    setTargetId(courses[0]?._id || '');
    setEnabled(true);
    setAvailableDates([]);
    setAvailableSlots([]);
    setSessionMonthlyLimit(DEFAULT_LIMITS.mentorshipMonthlyLimit);
    setDoubtMonthlyLimit(DEFAULT_LIMITS.doubtMonthlyLimit);
    setDoubtWeeklyLimit(DEFAULT_LIMITS.doubtWeeklyLimit);
    setDateInput('');
    setSlotStartTime('10:00');
    setSlotEndTime('11:00');
    setShowSettingsModal(true);
  };

  const handleTargetTypeChange = (type) => {
    setTargetType(type);
    if (type === 'course') {
      setTargetId(courses[0]?._id || '');
    } else if (type === 'category') {
      setTargetId(categories[0]?.name || '');
    } else {
      setTargetId('global');
    }
  };

  const handleSaveSetting = async (e) => {
    e.preventDefault();
    if (targetType !== 'global' && !targetId) {
      toast.error('Please select a target course or category');
      return;
    }
    try {
      await api.put('/ace-track/mentorship/settings', {
        targetType,
        targetId,
        enabled,
        availableDates,
        availableSlots,
        mentorshipMonthlyLimit: Number(mentorshipMonthlyLimit) || 0,
        doubtMonthlyLimit: Number(doubtMonthlyLimit) || 0,
        doubtWeeklyLimit: Number(doubtWeeklyLimit) || 0
      });
      toast.success('Session availability settings saved successfully! 💾');
      setShowSettingsModal(false);
      fetchSettingsData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    }
  };

  const handleDeleteSetting = async (id, targetName) => {
    if (!window.confirm(`Are you sure you want to delete the custom override for "${targetName}"? It will fall back to using Global default settings.`)) return;
    try {
      await api.delete(`/ace-track/mentorship/settings/${id}`);
      toast.success('Custom override deleted successfully. Switched back to Global default.');
      fetchSettingsData();
    } catch (err) {
      toast.error('Failed to delete custom override');
    }
  };

  const handleAddDate = () => {
    if (!dateInput) return;
    if (availableDates.includes(dateInput)) {
      toast.error('Date already added');
      return;
    }
    setAvailableDates(prev => [...prev, dateInput].sort());
    setDateInput('');
  };

  const handleAddSlot = () => {
    if (!slotStartTime || !slotEndTime) {
      toast.error('Please select both start and end time');
      return;
    }
    if (timeToMinutes(slotEndTime) <= timeToMinutes(slotStartTime)) {
      toast.error('End time must be after start time');
      return;
    }
    const slot = buildTimeSlot(slotStartTime, slotEndTime);
    if (availableSlots.includes(slot)) {
      toast.error('Time slot already added');
      return;
    }
    setAvailableSlots(prev => [...prev, slot]);
  };

  const handleRemoveDate = (date) => {
    setAvailableDates(prev => prev.filter(d => d !== date));
  };

  const handleRemoveSlot = (slot) => {
    setAvailableSlots(prev => prev.filter(s => s !== slot));
  };

  const getSettingTargetName = (setting) => {
    if (setting.targetType === 'global') return 'Global Default';
    if (setting.targetType === 'course') {
      const matched = courses.find(c => c._id === setting.targetId);
      return matched ? `Course: ${matched.title}` : `Course ID: ${setting.targetId}`;
    }
    if (setting.targetType === 'category') {
      return `Category: ${setting.targetId}`;
    }
    return 'Unknown';
  };

  useEffect(() => {
    fetchBookings();
    api.get('/admin/students?limit=500').then(r => setStudents(r.data?.students || r.data || [])).catch(() => {});
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ace-track/mentorship');
      setBookings(res.data);
    } catch (error) {
      toast.error('Failed to load 1:1 session requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSchedule = (booking) => {
    setSelectedBooking(booking);
    setMentorName(booking.mentorName || 'Admin Mentor');
    const existingLink = booking.meetingLink || '';
    const hasInternalLiveLink = existingLink.startsWith('/live/');
    setMeetingLink(hasInternalLiveLink ? '' : existingLink);
    setCreateLiveClass(!!booking.liveClass || hasInternalLiveLink);
    setSessionDate(new Date(booking.preferredDate).toISOString().split('T')[0]);
    const parsedSlot = parseSlotToTimes(booking.preferredTimeSlot);
    setScheduleStartTime(parsedSlot.start || '10:00');
    setScheduleEndTime(parsedSlot.end || '11:00');
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!mentorName || !sessionDate || !scheduleStartTime || !scheduleEndTime) {
      toast.error('Please enter mentor name, date and time slot');
      return;
    }
    if (timeToMinutes(scheduleEndTime) <= timeToMinutes(scheduleStartTime)) {
      toast.error('End time must be after start time');
      return;
    }
    const finalSessionSlot = buildTimeSlot(scheduleStartTime, scheduleEndTime);

    try {
      await api.put(`/ace-track/mentorship/${selectedBooking._id}`, {
        status: 'Scheduled',
        mentorName,
        meetingLink,
        createLiveClass,
        preferredDate: sessionDate,
        preferredTimeSlot: finalSessionSlot
      });

      toast.success('Session scheduled! 📅');
      setShowScheduleModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule session');
    }
  };

  const handleOpenComplete = (booking) => {
    setSelectedBooking(booking);
    setSessionNotes(booking.sessionNotes || '');
    setStudyPlan(booking.studyPlan || '');
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/ace-track/mentorship/${selectedBooking._id}`, {
        status: 'Completed',
        sessionNotes,
        studyPlan
      });

      toast.success('Session finalized and marked Completed! 🎉');
      setShowCompleteModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to complete session');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to change status to ${status}?`)) return;
    try {
      await api.put(`/ace-track/mentorship/${id}`, { status });
      toast.success(`Session status updated to ${status}`);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAdminCreateSession = async (e) => {
    e.preventDefault();
    if (!selectedStudent) { toast.error('Please select a student'); return; }
    if (!createForm.subject.trim() || !createForm.preferredDate || !createForm.preferredTimeSlot.trim()) {
      toast.error('Please fill subject, date and time slot');
      return;
    }
    setCreateBusy(true);
    try {
      await api.post('/ace-track/mentorship/admin-create', {
        studentId: selectedStudent._id,
        ...createForm,
      });
      toast.success('Session created for student! 🎉');
      setShowCreateModal(false);
      setSelectedStudent(null);
      setStudentSearch('');
      setCreateForm({ sessionType: 'mentorship', subject: '', description: '', preferredDate: '', preferredTimeSlot: '' });
      fetchBookings();
    } catch (err) {
      // Fallback: use requestMentorship on behalf of student via PUT
      toast.error(err.response?.data?.message || 'Failed to create session');
    } finally {
      setCreateBusy(false);
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Are you sure you want to delete this session booking session request? This action cannot be undone.')) return;
    try {
      await api.delete(`/ace-track/mentorship/${id}`);
      toast.success('Session booking deleted successfully');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete booking');
    }
  };

  const filteredBookings = bookings.filter(b => b.status === activeTab);

  return (
    <div className="space-y-8 w-full max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Users className="text-indigo-600 w-8 h-8" />
          <div>
            <h1 className="text-sm font-black text-slate-800">1:1 Session Requests Manager</h1>
            <p className="text-[11px] text-slate-400">Schedule mentor slots, write notes, and review ratings</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
        >
          <Plus size={14} /> Create Session for Student
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin border-b border-slate-200">
        {['Pending', 'Scheduled', 'Completed', 'Cancelled', 'Settings'].map(status => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`px-5 py-3 rounded-t-xl text-xs font-bold shrink-0 transition-all cursor-pointer border-b-2 ${
              activeTab === status
                ? 'border-indigo-600 text-indigo-600 font-black bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {status === 'Pending' && 'Pending Requests'}
            {status === 'Scheduled' && 'Scheduled Sessions'}
            {status === 'Completed' && 'Completed Sessions'}
            {status === 'Cancelled' && 'Cancelled Sessions'}
            {status === 'Settings' && 'Availability Settings'}
            
            {status !== 'Settings' && (
              <span className="ml-2 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md text-[10px]">
                {bookings.filter(b => b.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List / Settings */}
      {activeTab === 'Settings' ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-xs font-black text-slate-850">1:1 Session Slots Configuration</h3>
              <p className="text-[10px] text-slate-400">Set active booking dates & slots globally, or override them per course/category.</p>
            </div>
            <button
              onClick={handleAddSetting}
              className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition sm:w-auto"
            >
              <Plus size={14} /> Add Custom Override
            </button>
          </div>

          {settingsLoading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading settings...</div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="divide-y divide-slate-100 sm:hidden">
                {settingsList.map((setting) => {
                  const targetName = getSettingTargetName(setting);
                  return (
                    <div key={setting._id} className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-black text-slate-850 text-sm leading-snug">
                            {targetName}
                          </div>
                          {setting.targetType === 'global' && (
                            <span className="mt-1 inline-flex px-1.5 py-0.5 bg-indigo-50 text-[9px] text-indigo-600 rounded font-black border border-indigo-100/50">Default</span>
                          )}
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          setting.enabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {setting.enabled ? 'Open' : 'Closed'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">Session Limit</div>
                          <div className="mt-1 font-bold text-slate-700">{setting.mentorshipMonthlyLimit ?? DEFAULT_LIMITS.mentorshipMonthlyLimit}/month</div>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">Doubt Limit</div>
                          <div className="mt-1 font-bold text-slate-700">{setting.doubtMonthlyLimit ?? DEFAULT_LIMITS.doubtMonthlyLimit}/month, {setting.doubtWeeklyLimit ?? DEFAULT_LIMITS.doubtWeeklyLimit}/week</div>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">Dates</div>
                          <div className="mt-1 font-bold text-slate-700">{setting.availableDates?.length || 0} configured</div>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">Slots</div>
                          <div className="mt-1 font-bold text-slate-700">{setting.availableSlots?.length || 0} configured</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSetting(setting)}
                          className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition"
                        >
                          Edit
                        </button>
                        {setting.targetType !== 'global' && (
                          <button
                            onClick={() => handleDeleteSetting(setting._id, targetName)}
                            className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs cursor-pointer transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {settingsList.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No 1:1 session settings configured yet.
                  </div>
                )}
              </div>

              <table className="hidden w-full text-left border-collapse sm:table">
                <thead className="bg-slate-50 border-b border-slate-150/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Target Scope</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Session Limits</th>
                    <th className="p-4">Available Dates</th>
                    <th className="p-4">Available Slots</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {settingsList.map((setting) => {
                    const targetName = getSettingTargetName(setting);
                    return (
                      <tr key={setting._id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-bold text-slate-800">
                          {targetName}
                          {setting.targetType === 'global' && (
                            <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 text-[9px] text-indigo-600 rounded font-black border border-indigo-100/50">Default</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            setting.enabled 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {setting.enabled ? 'Bookings Open' : 'Bookings Closed'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-medium leading-relaxed">
                          <div>Session: {setting.mentorshipMonthlyLimit ?? DEFAULT_LIMITS.mentorshipMonthlyLimit}/month</div>
                          <div>Doubt: {setting.doubtMonthlyLimit ?? DEFAULT_LIMITS.doubtMonthlyLimit}/month, {setting.doubtWeeklyLimit ?? DEFAULT_LIMITS.doubtWeeklyLimit}/week</div>
                        </td>
                        <td className="p-4 text-slate-500 font-medium">
                          {setting.availableDates?.length || 0} dates configured
                        </td>
                        <td className="p-4 text-slate-500 font-medium">
                          {setting.availableSlots?.length || 0} slots configured
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleEditSetting(setting)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition"
                            title="Edit Availability"
                          >
                            Edit
                          </button>
                          {setting.targetType !== 'global' && (
                            <button
                              onClick={() => handleDeleteSetting(setting._id, targetName)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold cursor-pointer transition"
                              title="Delete Override"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {settingsList.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No 1:1 session settings configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading requests...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center">
              <Users className="text-slate-300 w-12 h-12 mb-3" />
              <h3 className="text-xs font-bold text-slate-600">No Sessions Found</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">There are no 1:1 sessions in this tab.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredBookings.map(booking => {
              const studentName = booking.student?.name || 'Anonymous Student';
              const studentEmail = booking.student?.email || '';
              const studentId = booking.student?.studentId || '';
              const studentPhone = booking.student?.phone || '';
              const sessionLabel = booking.sessionType === 'doubt' ? '1:1 Doubt' : '1:1 Session';
              const preferredDateStr = new Date(booking.preferredDate).toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div key={booking._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 hover:shadow-xs transition duration-200">
                  {/* Header: Student Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 text-sm font-black flex items-center justify-center shadow-inner">
                        {studentName[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-800">{studentName}</h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 mt-0.5 font-medium">
                          <span>ID: {studentId}</span>
                          <span className="flex items-center gap-1"><Mail size={10} /> {studentEmail}</span>
                          {studentPhone && <span className="flex items-center gap-1"><Phone size={10} /> {studentPhone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold font-mono">
                      Requested: {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  {/* Booking content: Focus Topic */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase tracking-wider">
                        {sessionLabel}
                      </span>
                      <div className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Subject & Details</div>
                    </div>
                    <div className="text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-150/40">
                      Topic: {booking.subject}
                    </div>
                    <p className="text-xs text-slate-600 pl-1 leading-relaxed">{booking.description}</p>
                  </div>

                  {/* Date and Time slots requested */}
                  <div className="grid sm:grid-cols-2 gap-4 border-t border-b border-slate-150/30 py-3 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Requested Date</span>
                      <span className="font-semibold text-slate-700">{preferredDateStr}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Requested Time Slot</span>
                      <span className="font-semibold text-slate-700">{booking.preferredTimeSlot}</span>
                    </div>
                  </div>

                  {/* Actions / Admin feedback notes */}
                  {booking.status === 'Pending' && (
                    <div className="flex flex-wrap gap-2 items-center pt-2">
                      <button
                        onClick={() => handleOpenSchedule(booking)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
                      >
                        Schedule Slot
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(booking._id, 'Cancelled')}
                        className="px-4 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition"
                      >
                        Cancel Request
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking._id)}
                        className="px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ml-auto"
                      >
                        <Trash2 size={13} /> Delete Request
                      </button>
                    </div>
                  )}

                  {booking.status === 'Scheduled' && (
                    <div className="space-y-4 pt-2">
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="font-bold text-indigo-900">Scheduled Details:</div>
                        <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                          <div><span className="font-bold">Mentor Name:</span> {booking.mentorName}</div>
                          <div><span className="font-bold">Meeting Link:</span> {booking.meetingLink ? <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-bold inline-flex items-center gap-0.5">Join Call <ExternalLink size={10} /></a> : 'None Added'}</div>
                          {booking.liveClass && (
                            <div className="sm:col-span-2"><span className="font-bold">Live Class:</span> Created in Live Classes panel</div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        <button
                          onClick={() => handleOpenComplete(booking)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
                        >
                          Mark Completed (Add Notes)
                        </button>
                        <button
                          onClick={() => handleOpenSchedule(booking)}
                          className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition"
                        >
                          Reschedule / Edit Link
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking._id, 'Cancelled')}
                          className="px-4 py-2.5 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold cursor-pointer transition"
                        >
                          Cancel Session
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking._id)}
                          className="px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ml-auto"
                        >
                          <Trash2 size={13} /> Delete Session
                        </button>
                      </div>
                    </div>
                  )}

                  {booking.status === 'Completed' && (
                    <div className="space-y-4 border-t border-slate-100 pt-3 text-xs">
                      <div className="grid sm:grid-cols-2 gap-4">
                        {booking.sessionNotes && (
                          <div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Your Session Notes/Feedback</span>
                            <p className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 text-slate-600 whitespace-pre-line leading-relaxed">
                              {booking.sessionNotes}
                            </p>
                          </div>
                        )}
                        {booking.studyPlan && (
                          <div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Uploaded Study Plan / Materials</span>
                            <p className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 text-slate-600 whitespace-pre-line leading-relaxed">
                              {booking.studyPlan}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Ratings left by student & Delete Button */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100/50">
                        {booking.rating ? (
                          <div className="flex items-center gap-2 bg-amber-50/50 border border-amber-100/60 p-3 rounded-xl flex-1">
                            <span className="font-bold text-slate-600">Student Rating:</span>
                            <div className="flex items-center text-amber-400">
                              {[...Array(booking.rating)].map((_, i) => (
                                <Star key={i} size={13} fill="currentColor" />
                              ))}
                              {[...Array(5 - booking.rating)].map((_, i) => (
                                <Star key={i} size={13} />
                              ))}
                            </div>
                            {booking.studentFeedback && (
                              <span className="text-slate-500 italic ml-2">"{booking.studentFeedback}"</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg inline-block">
                            Awaiting Student Rating/Review
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteBooking(booking._id)}
                          className="px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ml-auto"
                        >
                          <Trash2 size={13} /> Delete Session
                        </button>
                      </div>
                    </div>
                  )}

                  {booking.status === 'Cancelled' && (
                    <div className="flex justify-end pt-2 border-t border-slate-100/50">
                      <button
                        onClick={() => handleDeleteBooking(booking._id)}
                        className="px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5"
                      >
                        <Trash2 size={13} /> Delete Session
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Schedule / Reschedule Modal */}
      {showScheduleModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl animate-fade-in space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800">Schedule {selectedBooking.sessionType === 'doubt' ? '1:1 Doubt' : 'Session'} Call</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Add a Meet/Zoom link, or optionally create an in-app live room.</p>
              </div>
              <button 
                onClick={() => { setShowScheduleModal(false); setSelectedBooking(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Assign Mentor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Satish Roy..."
                  value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Meeting Link (Zoom / Google Meet)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  disabled={createLiveClass}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                />
                {createLiveClass && (
                  <p className="text-[10px] font-semibold text-indigo-500">An in-app room link will be generated after saving.</p>
                )}
              </div>

              <label className="flex items-start gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createLiveClass}
                  onChange={(e) => {
                    setCreateLiveClass(e.target.checked);
                    if (e.target.checked) setMeetingLink('');
                  }}
                  className="mt-0.5 rounded border-indigo-200 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  <span className="block font-black text-slate-800">Create in-app live room</span>
                  <span className="mt-0.5 block text-[10px] font-semibold text-slate-500">
                    Use this only when you want the session to appear in Live Classes and generate an Ace2Examz room link.
                  </span>
                </span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Confirmed Date</label>
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">From Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleStartTime}
                    onChange={(e) => setScheduleStartTime(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">To Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleEndTime}
                    onChange={(e) => setScheduleEndTime(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Final Slot</label>
                  <div className="w-full px-4 py-2 rounded-xl border border-indigo-100 bg-indigo-50 text-xs font-black text-indigo-700 min-h-[38px] flex items-center">
                    {scheduleStartTime && scheduleEndTime ? buildTimeSlot(scheduleStartTime, scheduleEndTime) : 'Select time'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowScheduleModal(false); setSelectedBooking(null); }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete session & write notes Modal */}
      {showCompleteModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl animate-fade-in space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800">Finalize & Complete Session</h3>
              <button 
                onClick={() => { setShowCompleteModal(false); setSelectedBooking(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Mentor Notes & Feedback (For Student)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Summarize discussion, highlight student's weak/strong points, write feedback..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 resize-none leading-normal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Recommended Study Plan / Resource URL</label>
                <textarea
                  rows={3}
                  placeholder="Paste PDF link, study notes URL, or write a custom bulleted study plan..."
                  value={studyPlan}
                  onChange={(e) => setStudyPlan(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 resize-none leading-normal"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCompleteModal(false); setSelectedBooking(null); }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  Complete Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-slate-200 shadow-2xl animate-fade-in space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800">
                {editingSettingId ? 'Edit 1:1 Session Availability' : 'Create Custom Availability Override'}
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSetting} className="space-y-4">
              {/* Target Selector */}
              {editingSettingId ? (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150/55">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-0.5">Configured Target Scope</span>
                  <span className="text-xs font-bold text-slate-700">
                    {targetType === 'global' ? 'Global Default Settings' : targetType === 'course' ? `Course Override: ${courses.find(c => c._id === targetId)?.title || targetId}` : `Category Override: ${targetId}`}
                  </span>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Target Scope Level</label>
                    <select
                      value={targetType}
                      onChange={(e) => handleTargetTypeChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700 bg-white"
                    >
                      <option value="course">Specific Course Override</option>
                      <option value="category">Specific Category Override</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Select Target Item</label>
                    {targetType === 'course' ? (
                      <select
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700 bg-white"
                      >
                        {courses.map(c => (
                          <option key={c._id} value={c._id}>{c.title}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700 bg-white"
                      >
                        {categories.map(cat => (
                          <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Enabled Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-150/50">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Open for Bookings</span>
                  <span className="text-[10px] text-slate-400 leading-normal">If disabled, students will see session as closed/unavailable for this scope.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnabled(!enabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 cursor-pointer ${enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white transition-transform absolute ${enabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">1:1 Session / Month</label>
                  <input
                    type="number"
                    min="0"
                    value={mentorshipMonthlyLimit}
                    onChange={(e) => setSessionMonthlyLimit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Doubt / Month</label>
                  <input
                    type="number"
                    min="0"
                    value={doubtMonthlyLimit}
                    onChange={(e) => setDoubtMonthlyLimit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Doubt / Week</label>
                  <input
                    type="number"
                    min="0"
                    value={doubtWeeklyLimit}
                    onChange={(e) => setDoubtWeeklyLimit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Dates Input Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Available Dates</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddDate}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer transition"
                  >
                    + Add Date
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2 min-h-[60px] max-h-[100px] overflow-y-auto p-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                  {availableDates.map(date => (
                    <span key={date} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-lg font-bold border border-indigo-100">
                      {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      <button type="button" onClick={() => handleRemoveDate(date)} className="text-indigo-400 hover:text-indigo-600 font-bold ml-1 text-sm select-none">×</button>
                    </span>
                  ))}
                  {availableDates.length === 0 && (
                    <span className="text-[10px] text-slate-400 italic p-1">No dates added yet</span>
                  )}
                </div>
              </div>

              {/* Time Slots Input Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Available Time Slots</label>
                <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">From</span>
                    <input
                      type="time"
                      value={slotStartTime}
                      onChange={(e) => setSlotStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">To</span>
                    <input
                      type="time"
                      value={slotEndTime}
                      onChange={(e) => setSlotEndTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="col-span-2 sm:col-span-1 sm:self-end px-4 py-2.5 bg-slate-950 hover:bg-slate-850 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer transition"
                  >
                    + Add Slot
                  </button>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-150 px-3 py-2 text-[11px] font-bold text-slate-500">
                  Preview: <span className="text-indigo-700">{slotStartTime && slotEndTime ? buildTimeSlot(slotStartTime, slotEndTime) : 'Select from and to time'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2 min-h-[60px] max-h-[100px] overflow-y-auto p-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                  {availableSlots.map(slot => (
                    <span key={slot} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-bold border border-emerald-100">
                      {slot}
                      <button type="button" onClick={() => handleRemoveSlot(slot)} className="text-emerald-400 hover:text-emerald-600 font-bold ml-1 text-sm select-none">×</button>
                    </span>
                  ))}
                  {availableSlots.length === 0 && (
                    <span className="text-[10px] text-slate-400 italic p-1">No slots added yet</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Session for Student Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-slate-200 shadow-2xl animate-fade-in space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800">Create 1:1 Session for Student</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Select a student and fill session details on their behalf.</p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setSelectedStudent(null); setStudentSearch(''); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Student Search */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                Search & Select Student
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={studentSearch}
                onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudent(null); }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-xs font-semibold text-slate-700"
              />
              {studentSearch.trim().length >= 2 && (
                <div className="border border-slate-200 rounded-xl max-h-44 overflow-y-auto bg-slate-50 divide-y divide-slate-100">
                  {students
                    .filter(s =>
                      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.email?.toLowerCase().includes(studentSearch.toLowerCase())
                    )
                    .slice(0, 20)
                    .map(s => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => { setSelectedStudent(s); setStudentSearch(s.name); }}
                        className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition flex items-center gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0">
                          {(s.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{s.name}</div>
                          <div className="text-[10px] text-slate-400">{s.email}</div>
                        </div>
                        {selectedStudent?._id === s._id && (
                          <Check size={14} className="ml-auto text-indigo-600" />
                        )}
                      </button>
                    ))}
                  {students.filter(s =>
                    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    s.email?.toLowerCase().includes(studentSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No students found</p>
                  )}
                </div>
              )}
              {selectedStudent && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-800 text-sm font-black flex items-center justify-center shrink-0">
                    {(selectedStudent.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-indigo-900">{selectedStudent.name}</div>
                    <div className="text-[10px] text-indigo-600">{selectedStudent.email}</div>
                  </div>
                  <button type="button" onClick={() => { setSelectedStudent(null); setStudentSearch(''); }} className="text-indigo-400 hover:text-indigo-600">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleAdminCreateSession} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Session Type</label>
                  <select
                    value={createForm.sessionType}
                    onChange={e => setCreateForm(f => ({ ...f, sessionType: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                  >
                    <option value="mentorship">1:1 Mentorship</option>
                    <option value="doubt">1:1 Doubt Session</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.preferredDate}
                    onChange={e => setCreateForm(f => ({ ...f, preferredDate: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Preferred Time Slot</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10:00 AM - 11:00 AM"
                  value={createForm.preferredTimeSlot}
                  onChange={e => setCreateForm(f => ({ ...f, preferredTimeSlot: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Subject / Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Chemistry — Mechanisms"
                  value={createForm.subject}
                  onChange={e => setCreateForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Specific doubts or topics to cover..."
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setSelectedStudent(null); setStudentSearch(''); }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBusy || !selectedStudent}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
                >
                  {createBusy ? 'Creating…' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
