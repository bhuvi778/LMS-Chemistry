import { useState, useEffect, useMemo } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  Shield,
  Clock,
  Smartphone,
  Laptop,
  Globe,
  Search,
  Users,
  Key,
  LogOut,
  AlertCircle,
  Check
} from 'lucide-react';

export default function AdminSecurity() {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'manager'
  
  // Tab 1: Settings & Timeline States
  const [globalSettings, setGlobalSettings] = useState({ maxSessions: 5, studentSessionTimeout: 10 });
  const [loginLogs, setLoginLogs] = useState([]);
  const [stats, setStats] = useState({ appDownloads: 0 });
  const [savingSettings, setSavingSettings] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Tab 2: Session Manager States
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [revokingSession, setRevokingSession] = useState(false);

  // Fetch settings & timeline on mount
  useEffect(() => {
    if (activeTab === 'settings') {
      loadSettingsAndTimeline();
    } else {
      loadStudents();
    }
  }, [activeTab]);

  const loadSettingsAndTimeline = async () => {
    try {
      setTimelineLoading(true);
      const [settingsRes, analyticsRes, statsRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/login-analytics'),
        api.get('/admin/stats')
      ]);
      setGlobalSettings(settingsRes.data);
      setLoginLogs(analyticsRes.data.loginLogs || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load security analytics');
    } finally {
      setTimelineLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data || []);
    } catch (err) {
      toast.error('Failed to load student directory');
    }
  };

  const fetchStudentSessions = async (studentId) => {
    try {
      setDetailsLoading(true);
      const res = await api.get(`/admin/students/${studentId}`);
      setStudentDetails(res.data);
    } catch (err) {
      toast.error('Failed to load student session details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    fetchStudentSessions(student._id);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await Promise.all([
        api.put('/admin/settings', { key: 'maxSessions', value: Number(globalSettings.maxSessions) || 5 }),
        api.put('/admin/settings', { key: 'studentSessionTimeout', value: Number(globalSettings.studentSessionTimeout) || 10 })
      ]);
      toast.success('Security settings updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRevokeSingleSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to revoke this login session? The student will be immediately logged out on that device.')) return;
    setRevokingSession(true);
    try {
      await api.delete(`/admin/students/${selectedStudent._id}/sessions/${sessionId}`);
      toast.success('Session revoked successfully');
      fetchStudentSessions(selectedStudent._id);
    } catch (err) {
      toast.error('Failed to revoke session');
    } finally {
      setRevokingSession(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!window.confirm(`Are you sure you want to revoke ALL active sessions for ${selectedStudent.name}? They will be forced to log in again on all devices.`)) return;
    setRevokingSession(true);
    try {
      await api.delete(`/admin/students/${selectedStudent._id}/sessions`);
      toast.success('All sessions revoked successfully');
      fetchStudentSessions(selectedStudent._id);
    } catch (err) {
      toast.error('Failed to revoke sessions');
    } finally {
      setRevokingSession(false);
    }
  };

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return students.filter(s => 
      s.name?.toLowerCase().includes(q) || 
      s.email?.toLowerCase().includes(q) || 
      s.studentId?.toLowerCase().includes(q) ||
      s.phone?.includes(q)
    ).slice(0, 8); // limit to 8 results for clean layout
  }, [students, searchQuery]);

  return (
    <div className="space-y-6 w-full max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900">Device & Session Security</h1>
        <p className="text-slate-500 text-sm mt-1">Configure concurrent device constraints, audit login logs, and manage active sessions.</p>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
            activeTab === 'settings'
              ? 'border-indigo-600 text-indigo-600 font-black bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Session Limits & Timeline
        </button>
        <button
          onClick={() => setActiveTab('manager')}
          className={`px-5 py-3 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
            activeTab === 'manager'
              ? 'border-indigo-600 text-indigo-600 font-black bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Student Session Manager
        </button>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Settings Card */}
          <div className="card p-6 flex flex-col justify-between h-fit space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 grid place-items-center text-indigo-600 shrink-0">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Session Controls</h3>
                  <p className="text-xs text-slate-400">Device limit constraints</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Max Concurrent Devices
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGlobalSettings(prev => ({ ...prev, maxSessions: Math.max(1, (Number(prev.maxSessions) || 1) - 1) }))}
                      className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center font-bold text-slate-600 transition cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={globalSettings.maxSessions || ''}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                        setGlobalSettings(prev => ({ ...prev, maxSessions: val }));
                      }}
                      className="w-16 h-9 text-center font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setGlobalSettings(prev => ({ ...prev, maxSessions: Math.min(20, (Number(prev.maxSessions) || 1) + 1) }))}
                      className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center font-bold text-slate-600 transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Restricts a student from logging in on more than this number of devices or browsers simultaneously. Logging in on a new device automatically terminates the oldest session.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Student Inactivity Timeout (Mins)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGlobalSettings(prev => ({ ...prev, studentSessionTimeout: Math.max(1, (Number(prev.studentSessionTimeout) || 10) - 1) }))}
                      className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center font-bold text-slate-600 transition cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={globalSettings.studentSessionTimeout || ''}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(1440, parseInt(e.target.value) || 1));
                        setGlobalSettings(prev => ({ ...prev, studentSessionTimeout: val }));
                      }}
                      className="w-16 h-9 text-center font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setGlobalSettings(prev => ({ ...prev, studentSessionTimeout: Math.min(1440, (Number(prev.studentSessionTimeout) || 10) + 1) }))}
                      className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center font-bold text-slate-600 transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Automatically logs out students if they remain inactive in the student panel for this duration. Set to 10 minutes by default.
                  </p>
                </div>
                
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Total App Downloads:</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {stats.appDownloads || 0}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full text-center text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition rounded-xl py-2.5 shadow-sm cursor-pointer"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Timeline Table */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-indigo-600" size={18} />
              <div>
                <h3 className="font-bold text-slate-900">Recent Logins Timeline</h3>
                <p className="text-xs text-slate-400">Real-time audit log of student logins</p>
              </div>
            </div>

            {timelineLoading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading login analytics...</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="max-h-[400px] overflow-y-auto pr-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white z-10">
                      <tr>
                        <th className="pb-2">Student</th>
                        <th className="pb-2">Device / IP</th>
                        <th className="pb-2 text-right">Login Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50/50">
                      {loginLogs.map((log) => {
                        const isMobile = /mobile|android|ios/i.test(log.deviceInfo || '');
                        return (
                          <tr key={log._id} className="text-xs hover:bg-slate-50/50 transition">
                            <td className="py-2.5 pr-2">
                              <div className="font-bold text-slate-800">{log.studentName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{log.studentId} • {log.studentEmail}</div>
                            </td>
                            <td className="py-2.5 pr-2">
                              <div className="flex items-center gap-1 text-slate-600">
                                {isMobile ? <Smartphone size={12} className="text-slate-400" /> : <Laptop size={12} className="text-slate-400" />}
                                <span className="font-semibold">{log.deviceInfo || 'Unknown'}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Globe size={10} /> {log.ip || 'N/A'}
                              </div>
                            </td>
                            <td className="py-2.5 text-right text-slate-500 whitespace-nowrap">
                              {new Date(log.loginTime).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </td>
                          </tr>
                        );
                      })}
                      {loginLogs.length === 0 && (
                        <tr>
                          <td colSpan="3" className="py-8 text-center text-slate-400 text-sm">
                            No login logs available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {/* Search student list */}
          <div className="card p-5 space-y-4 h-fit md:col-span-1">
            <div className="flex items-center gap-2">
              <Users className="text-indigo-600" size={18} />
              <h3 className="font-bold text-slate-900">Student Directory</h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by name, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {filteredStudents.map((s) => (
                <button
                  key={s._id}
                  onClick={() => handleSelectStudent(s)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition border ${
                    selectedStudent?._id === s._id 
                      ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-200' 
                      : 'border-transparent hover:bg-slate-50 text-slate-600 font-semibold'
                  }`}
                >
                  <div className="truncate">{s.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">{s.studentId} • {s.email}</div>
                </button>
              ))}
              {searchQuery.trim() && filteredStudents.length === 0 && (
                <div className="text-center py-4 text-[11px] text-slate-400">No students match search query</div>
              )}
              {!searchQuery.trim() && (
                <div className="text-center py-8 text-[11px] text-slate-400 italic">Type to search students in directory</div>
              )}
            </div>
          </div>

          {/* Student Session Details */}
          <div className="card p-6 md:col-span-2 min-h-[300px] flex flex-col">
            {selectedStudent ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-5">
                  {/* Header info */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{selectedStudent.name}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{selectedStudent.studentId} • {selectedStudent.email} • {selectedStudent.phone || 'No Phone'}</p>
                    </div>
                    {studentDetails?.sessions?.length > 0 && (
                      <button
                        onClick={handleRevokeAllSessions}
                        disabled={revokingSession}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-bold border border-rose-100 flex items-center gap-1 cursor-pointer disabled:opacity-50 transition"
                      >
                        <LogOut size={10} /> Revoke All Sessions
                      </button>
                    )}
                  </div>

                  {/* Sessions List */}
                  {detailsLoading ? (
                    <div className="text-center py-12 text-xs text-slate-400">Loading active sessions...</div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Device Sessions ({studentDetails?.sessions?.length || 0})</h4>
                      
                      <div className="grid gap-3">
                        {studentDetails?.sessions?.map((session) => {
                          const isMobile = /mobile|android|ios/i.test(session.deviceInfo || '');
                          return (
                            <div key={session._id} className="p-3.5 rounded-xl border border-slate-200/60 bg-slate-50/40 flex items-center justify-between text-xs hover:shadow-xs transition">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                  {isMobile ? <Smartphone size={16} /> : <Laptop size={16} />}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-700">{session.deviceInfo || 'Unknown Device'}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                    <span className="flex items-center gap-0.5"><Globe size={8} /> IP: {session.ip || 'N/A'}</span>
                                    <span>•</span>
                                    <span>Logged in: {new Date(session.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleRevokeSingleSession(session._id)}
                                disabled={revokingSession}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg font-bold text-[10px] cursor-pointer disabled:opacity-50 transition border border-transparent hover:border-rose-150/50"
                              >
                                Log Out
                              </button>
                            </div>
                          );
                        })}
                        {(!studentDetails?.sessions || studentDetails.sessions.length === 0) && (
                          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                            <AlertCircle size={24} className="text-slate-300 mb-1" />
                            <p className="text-[11px] font-bold text-slate-500">No Active Sessions</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">This student is not currently logged in on any device.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center">
                <Shield size={36} className="text-slate-300 mb-2" />
                <h4 className="text-xs font-bold text-slate-600">Select a Student</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs leading-normal">Search and select a student from the directory to audit their active login sessions and force logout specific devices.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
