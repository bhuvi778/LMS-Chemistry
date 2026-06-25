import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  CheckCircle,
  HelpCircle,
  Coins,
  BookOpen
} from 'lucide-react';
import LogoLoader from '../../components/LogoLoader.jsx';

export default function MyPlanner() {
  const { setUser } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState('current'); // 'previous', 'current', 'upcoming'
  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Plan gating states
  const [enrollments, setEnrollments] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      setLoadingAccess(true);
      const res = await api.get('/enroll/me');
      const enrolls = res.data || [];
      setEnrollments(enrolls);

      const eligible = enrolls.some(e => e.paymentStatus === 'paid' && (e.planType === 'pro' || e.planType === 'infinity'));
      setHasAccess(eligible);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAccess(false);
    }
  };

  // New Goal Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [goalType, setGoalType] = useState('custom'); // 'custom' or 'syllabus'
  const [customTitle, setCustomTitle] = useState('');
  const [syllabusList, setSyllabusList] = useState([]);
  const [selectedSub, setSelectedSub] = useState('');
  const [selectedChap, setSelectedChap] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubTopic, setSelectedSubTopic] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('video');
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);

  useEffect(() => {
    const daysOfWeek = getWeekDays(selectedWeek);
    setDays(daysOfWeek);
    // Auto-select first day of the week, or keep selectedDate if it's within the week
    const hasSelectedDateInDays = daysOfWeek.some(
      d => d.toDateString() === selectedDate.toDateString()
    );
    if (!hasSelectedDateInDays) {
      setSelectedDate(daysOfWeek[0]);
    }
  }, [selectedWeek]);

  useEffect(() => {
    if (days.length > 0) {
      fetchGoalsForWeek();
    }
  }, [days]);

  const getWeekDays = (weekType) => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon, etc.
    const daysToMon = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() + daysToMon);

    const startOfTargetWeek = new Date(startOfCurrentWeek);
    if (weekType === 'previous') {
      startOfTargetWeek.setDate(startOfCurrentWeek.getDate() - 7);
    } else if (weekType === 'upcoming') {
      startOfTargetWeek.setDate(startOfCurrentWeek.getDate() + 7);
    }

    const res = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfTargetWeek);
      day.setDate(startOfTargetWeek.getDate() + i);
      res.push(day);
    }
    return res;
  };

  const fetchGoalsForWeek = async () => {
    try {
      setLoading(true);
      const start = days[0].toISOString().split('T')[0];
      const end = days[6].toISOString().split('T')[0];
      const res = await api.get(`/ace-track/planner?startDate=${start}&endDate=${end}`);
      setGoals(res.data);
    } catch (error) {
      toast.error('Failed to load planner goals');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyllabus = async () => {
    try {
      const res = await api.get('/ace-track/syllabus');
      setSyllabusList(res.data);
      if (res.data.length > 0) {
        setSelectedSub(res.data[0]._id);
      }
    } catch (error) {
      toast.error('Failed to load syllabus items');
    }
  };

  const handleOpenAddModal = () => {
    loadSyllabus();
    setShowAddModal(true);
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      let title = customTitle;
      if (goalType === 'syllabus') {
        const sub = syllabusList.find(s => s._id === selectedSub);
        const chap = sub?.chapters.find(c => c._id === selectedChap);
        const topic = chap?.topics.find(t => t._id === selectedTopic);
        const subTopic = topic?.subTopics.find(st => st._id === selectedSubTopic);
        
        const activityLabel = {
          video: 'Video Lecture 🎥',
          notes: 'Revision Notes 📝',
          dpp: 'DPP Questions 📄',
          dppVideo: 'DPP Video Solution 🎬',
          mockTest: 'Mock Test 🏆'
        }[selectedActivity];

        if (!subTopic) {
          toast.error('Please select a valid subtopic');
          return;
        }

        title = `Complete ${sub.name} - ${chap.name} (${subTopic.name}): ${activityLabel}`;
      }

      if (!title.trim()) {
        toast.error('Please enter a goal title');
        return;
      }

      const formattedDate = selectedDate.toISOString().split('T')[0];

      await api.post('/ace-track/planner', {
        date: formattedDate,
        title,
        associatedSubTopic: goalType === 'syllabus' ? selectedSubTopic : '',
        associatedActivity: goalType === 'syllabus' ? selectedActivity : ''
      });

      toast.success('Goal added successfully! 📅');
      setCustomTitle('');
      setShowAddModal(false);
      fetchGoalsForWeek();
    } catch (error) {
      toast.error('Failed to save goal');
      console.error(error);
    }
  };

  const handleToggleComplete = async (goalId, currentVal) => {
    try {
      const newVal = !currentVal;
      
      // Optimistic state update
      setGoals(prev => prev.map(g => g._id === goalId ? { ...g, isCompleted: newVal } : g));

      const res = await api.put(`/ace-track/planner/${goalId}/complete`, { isCompleted: newVal });
      
      if (res.data.coinsAdded > 0) {
        // Trigger coin animation
        setShowCoinAnimation(true);
        setTimeout(() => setShowCoinAnimation(false), 2000);

        // Update user state context
        setUser(prev => prev ? { ...prev, coins: res.data.totalCoins } : null);
        toast.success('Goal completed! +1 Ace Coin Added! 🪙✨');
      } else {
        toast.success(newVal ? 'Goal marked completed!' : 'Goal marked incomplete');
      }

      // Refresh data
      fetchGoalsForWeek();
    } catch (error) {
      toast.error('Failed to update goal');
      fetchGoalsForWeek();
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await api.delete(`/ace-track/planner/${goalId}`);
      toast.success('Goal deleted');
      fetchGoalsForWeek();
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  };

  // Filter goals for the currently selected day
  const dailyGoals = goals.filter(
    g => new Date(g.date).toDateString() === selectedDate.toDateString()
  );

  // Get active subject, chapter, topic, subtopic list for dropdowns
  const activeSubData = syllabusList.find(s => s._id === selectedSub);
  const chaptersList = activeSubData?.chapters || [];
  const activeChapData = chaptersList.find(c => c._id === selectedChap);
  const topicsList = activeChapData?.topics || [];
  const activeTopicData = topicsList.find(t => t._id === selectedTopic);
  const subTopicsList = activeTopicData?.subTopics || [];

  if (loadingAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LogoLoader size={60} text="Checking access permissions..." />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 px-4">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden border border-slate-800/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner text-indigo-400">
              <Calendar size={38} className="animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                Premium Feature
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Unlock My Planner</h1>
              <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
                Schedule your learning, set daily goals, and stay consistent! The **My Planner** tool is available exclusively for **Pro** and **Infinity** plan subscribers.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 max-w-md mx-auto text-left space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 text-base">✓</span>
                <span className="text-slate-200 font-bold text-slate-300">Set daily customized learning tasks</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 text-base">✓</span>
                <span className="text-slate-200 font-bold text-slate-300">Integrate checklists directly from your Syllabus Tracker</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 text-base">✓</span>
                <span className="text-slate-200 font-bold text-slate-300">Earn +1 Ace Coin for every daily goal completed</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/student/courses"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-brand text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition duration-200 text-center"
              >
                Upgrade Plan / Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-5xl relative">
      {/* Coin Animation Popup Overlay */}
      {showCoinAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center bg-indigo-900/90 text-white rounded-2xl p-6 border border-yellow-400 shadow-2xl animate-bounce">
            <Coins className="text-yellow-400 w-16 h-16 animate-spin" />
            <div className="text-lg font-black mt-2 text-yellow-300">+1 Ace Coin!</div>
            <div className="text-xs text-indigo-200">Daily planner goal completed!</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <h1 className="text-sm font-black text-slate-800">My Planner</h1>
            <p className="text-[11px] text-slate-400">Plan your day-to-day lessons and earn rewards</p>
          </div>
        </div>
        <button
          onClick={() => {
            toast('Add items from Syllabus Tracker or write custom tasks. Completing tasks earns coins!', { icon: 'ℹ️' });
          }}
          className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition cursor-pointer self-start sm:self-auto"
        >
          How Planner Works
        </button>
      </div>

      {/* Week Selector Tab Bar */}
      <div className="bg-slate-100/80 p-1 rounded-2xl flex max-w-md border border-slate-200/50">
        {['previous', 'current', 'upcoming'].map((week) => (
          <button
            key={week}
            onClick={() => setSelectedWeek(week)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition duration-200 capitalize cursor-pointer ${
              selectedWeek === week
                ? 'bg-white text-slate-800 shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {week === 'current' ? 'Current Week' : week === 'previous' ? 'Previous Week' : 'Upcoming Week'}
          </button>
        ))}
      </div>

      {/* Calendar Strips Horizontal Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
          {selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const isSelected = day.toDateString() === selectedDate.toDateString();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayName = day.toLocaleDateString('en-IN', { weekday: 'short' });
            const dayNum = day.toLocaleDateString('en-IN', { day: '2-digit' });
            
            // Check if there are goals for this day
            const hasGoals = goals.some(g => new Date(g.date).toDateString() === day.toDateString());
            const allDone = hasGoals && goals
              .filter(g => new Date(g.date).toDateString() === day.toDateString())
              .every(g => g.isCompleted);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center p-3 rounded-2xl transition duration-200 cursor-pointer ${
                  isSelected 
                    ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/10 scale-[1.02]' 
                    : isToday
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 font-extrabold'
                      : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 mb-1">{dayName}</span>
                <span className="text-sm font-black">{dayNum}</span>
                
                {/* Goal indicator dots */}
                {hasGoals && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                    isSelected
                      ? 'bg-white'
                      : allDone 
                        ? 'bg-emerald-500' 
                        : 'bg-indigo-500'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Goal Listing Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Goals for {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </h2>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 transition cursor-pointer"
          >
            <Plus size={14} className="stroke-[3px]" />
            <span>Add Goal</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading daily tasks...</div>
        ) : dailyGoals.length === 0 ? (
          <div className="bg-white border border-slate-200/60 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center">
            <span className="text-4xl mb-2">🏝️</span>
            <h3 className="text-xs font-bold text-slate-600">No Goals Scheduled</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Take it easy or schedule some syllabus topics to cover!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dailyGoals.map(goal => (
              <div 
                key={goal._id}
                className={`bg-white border rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs hover:shadow-xs transition duration-200 ${
                  goal.isCompleted ? 'border-slate-100 bg-slate-50/40 opacity-75' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleComplete(goal._id, goal.isCompleted)}
                    className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition cursor-pointer ${
                      goal.isCompleted 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-slate-300 hover:border-indigo-500 text-transparent'
                    }`}
                  >
                    <CheckCircle size={14} className="stroke-[3px]" />
                  </button>
                  <div className="min-w-0 space-y-0.5">
                    <p className={`text-xs font-bold text-slate-700 leading-normal ${
                      goal.isCompleted ? 'line-through text-slate-400' : ''
                    }`}>
                      {goal.title}
                    </p>
                    {goal.isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Completed +1 Ace Coin Added 🪙
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteGoal(goal._id)}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition cursor-pointer shrink-0"
                  title="Remove Goal"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-slate-200 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 shrink-0">
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Schedule New Goal</h3>
                <p className="text-[11px] text-slate-400">Schedule for {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAddGoal} className="flex-1 overflow-y-auto py-4 space-y-5 no-scrollbar">
              {/* Goal Type Selector */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setGoalType('custom')}
                  className={`py-2 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    goalType === 'custom'
                      ? 'bg-white text-slate-800 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Custom Goal
                </button>
                <button
                  type="button"
                  onClick={() => setGoalType('syllabus')}
                  className={`py-2 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    goalType === 'syllabus'
                      ? 'bg-white text-slate-800 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  From Syllabus
                </button>
              </div>

              {goalType === 'custom' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Goal Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Read Chapter 5 NCERT organic notes..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Subject Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Subject</label>
                    <select
                      value={selectedSub}
                      onChange={(e) => {
                        setSelectedSub(e.target.value);
                        setSelectedChap('');
                        setSelectedTopic('');
                        setSelectedSubTopic('');
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold"
                    >
                      <option value="">Select Subject</option>
                      {syllabusList.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Chapter Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Chapter</label>
                    <select
                      value={selectedChap}
                      onChange={(e) => {
                        setSelectedChap(e.target.value);
                        setSelectedTopic('');
                        setSelectedSubTopic('');
                      }}
                      disabled={!selectedSub}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold"
                    >
                      <option value="">Select Chapter</option>
                      {chaptersList.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Topic Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Topic</label>
                    <select
                      value={selectedTopic}
                      onChange={(e) => {
                        setSelectedTopic(e.target.value);
                        setSelectedSubTopic('');
                      }}
                      disabled={!selectedChap}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold"
                    >
                      <option value="">Select Topic</option>
                      {topicsList.map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Topic Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Subtopic</label>
                    <select
                      value={selectedSubTopic}
                      onChange={(e) => setSelectedSubTopic(e.target.value)}
                      disabled={!selectedTopic}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold"
                    >
                      <option value="">Select Subtopic</option>
                      {subTopicsList.map(st => (
                        <option key={st._id} value={st._id}>{st.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Activity Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Activity Type</label>
                    <select
                      value={selectedActivity}
                      onChange={(e) => setSelectedActivity(e.target.value)}
                      disabled={!selectedSubTopic}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold"
                    >
                      <option value="video">🎥 Video Lecture</option>
                      <option value="notes">📝 Revision Notes</option>
                      <option value="dpp">📄 DPP Questions</option>
                      <option value="dppVideo">🎬 DPP Video Solution</option>
                      <option value="mockTest">🏆 Mock Test</option>
                    </select>
                  </div>
                </div>
              )}
            </form>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddGoal}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
