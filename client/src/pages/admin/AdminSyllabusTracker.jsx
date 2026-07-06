import { useState, useEffect } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Layers, 
  ChevronDown, 
  ChevronRight, 
  Settings, 
  Edit3, 
  Save, 
  X,
  Check,
  ClipboardList
} from 'lucide-react';

export default function AdminSyllabusTracker() {
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Toggle open items in the tree view
  const [openSubjects, setOpenSubjects] = useState({});
  const [openChapters, setOpenChapters] = useState({});
  const [openTopics, setOpenTopics] = useState({});

  // Input states for adding new elements
  const [newSubName, setNewSubName] = useState('');
  const [newSubCategories, setNewSubCategories] = useState([]);
  const [newChapName, setNewChapName] = useState({}); // subjectId -> name
  const [newTopicName, setNewTopicName] = useState({}); // chapterId -> name
  
  // Modal / Form states for Sub-topic
  const [showSubModal, setShowSubModal] = useState(false);
  const [activeIdsForSub, setActiveIdsForSub] = useState(null); // { subjectId, chapterId, topicId, subTopicId? }
  const [subName, setSubName] = useState('');
  const [hasVideo, setHasVideo] = useState(true);
  const [hasNotes, setHasNotes] = useState(true);
  const [hasDpp, setHasDpp] = useState(true);
  const [hasDppVideo, setHasDppVideo] = useState(true);
  const [hasMockTest, setHasMockTest] = useState(true);
  const [hasPyq, setHasPyq] = useState(true);

  // Subject Edit modal states
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectCategories, setEditSubjectCategories] = useState([]);

  useEffect(() => {
    fetchSyllabus();
    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ace-track/syllabus');
      setSyllabus(res.data);
    } catch (error) {
      toast.error('Failed to load syllabus');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    try {
      await api.post('/ace-track/syllabus/subject', { 
        name: newSubName, 
        categories: newSubCategories 
      });
      toast.success('Subject added successfully! 🧪');
      setNewSubName('');
      setNewSubCategories([]);
      fetchSyllabus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add subject');
    }
  };

  const handleOpenEditSubjectModal = (subject) => {
    setEditSubjectId(subject._id);
    setEditSubjectName(subject.name);
    setEditSubjectCategories(subject.categories || []);
    setShowEditSubjectModal(true);
  };

  const handleSaveEditSubject = async (e) => {
    e.preventDefault();
    if (!editSubjectName.trim()) return;
    try {
      await api.put(`/ace-track/syllabus/subject/${editSubjectId}`, {
        name: editSubjectName,
        categories: editSubjectCategories
      });
      toast.success('Subject updated successfully! 🧪');
      setShowEditSubjectModal(false);
      setEditSubjectId(null);
      fetchSyllabus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update subject');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete subject and all nested chapters/topics?')) return;
    try {
      await api.delete(`/ace-track/syllabus/subject/${id}`);
      toast.success('Subject removed');
      fetchSyllabus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove subject');
    }
  };

  const handleCreateChapter = async (subjectId) => {
    const name = newChapName[subjectId];
    if (!name || !name.trim()) return;
    try {
      await api.post(`/ace-track/syllabus/subject/${subjectId}/chapter`, { name });
      toast.success('Chapter added! 📚');
      setNewChapName(prev => ({ ...prev, [subjectId]: '' }));
      fetchSyllabus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add chapter');
    }
  };

  const handleDeleteChapter = async (subjectId, chapterId) => {
    if (!window.confirm('Delete chapter and all nested topics/subtopics?')) return;
    try {
      await api.delete(`/ace-track/syllabus/subject/${subjectId}/chapter/${chapterId}`);
      toast.success('Chapter deleted');
      fetchSyllabus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete chapter');
    }
  };

  const handleCreateTopic = async (subjectId, chapterId) => {
    const name = newTopicName[chapterId];
    if (!name || !name.trim()) return;
    try {
      await api.post(`/ace-track/syllabus/subject/${subjectId}/chapter/${chapterId}/topic`, { name });
      toast.success('Topic added! 📝');
      setNewTopicName(prev => ({ ...prev, [chapterId]: '' }));
      fetchSyllabus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add topic');
    }
  };

  const handleDeleteTopic = async (subjectId, chapterId, topicId) => {
    if (!window.confirm('Delete topic and all nested subtopics?')) return;
    try {
      await api.delete(`/ace-track/syllabus/subject/${subjectId}/chapter/${chapterId}/topic/${topicId}`);
      toast.success('Topic deleted');
      fetchSyllabus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete topic');
    }
  };

  const handleOpenSubModal = (subjectId, chapterId, topicId, subTopic = null) => {
    if (subTopic) {
      setActiveIdsForSub({ subjectId, chapterId, topicId, subTopicId: subTopic._id });
      setSubName(subTopic.name);
      setHasVideo(subTopic.hasVideo);
      setHasNotes(subTopic.hasNotes);
      setHasDpp(subTopic.hasDpp);
      setHasDppVideo(subTopic.hasDppVideo);
      setHasMockTest(subTopic.hasMockTest);
      setHasPyq(subTopic.hasPyq !== undefined ? subTopic.hasPyq : true);
    } else {
      setActiveIdsForSub({ subjectId, chapterId, topicId });
      setSubName('');
      setHasVideo(true);
      setHasNotes(true);
      setHasDpp(true);
      setHasDppVideo(true);
      setHasMockTest(true);
      setHasPyq(true);
    }
    setShowSubModal(true);
  };

  const handleSaveSubTopic = async (e) => {
    e.preventDefault();
    if (!subName.trim()) return;
    try {
      const { subjectId, chapterId, topicId, subTopicId } = activeIdsForSub;
      
      await api.post(`/ace-track/syllabus/subject/${subjectId}/chapter/${chapterId}/topic/${topicId}/subtopic`, {
        name: subName,
        hasVideo,
        hasNotes,
        hasDpp,
        hasDppVideo,
        hasMockTest,
        hasPyq,
        subTopicId
      });

      toast.success(subTopicId ? 'Subtopic updated!' : 'Subtopic created! 🎉');
      setShowSubModal(false);
      setActiveIdsForSub(null);
      fetchSyllabus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save subtopic');
    }
  };

  const handleDeleteSubTopic = async (subjectId, chapterId, topicId, subTopicId) => {
    if (!window.confirm('Delete this subtopic?')) return;
    try {
      await api.delete(`/ace-track/syllabus/subject/${subjectId}/chapter/${chapterId}/topic/${topicId}/subtopic/${subTopicId}`);
      toast.success('Subtopic deleted');
      fetchSyllabus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete subtopic');
    }
  };

  const toggleSubjectOpen = (id) => {
    setOpenSubjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleChapterOpen = (id) => {
    setOpenChapters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTopicOpen = (id) => {
    setOpenTopics(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading syllabus manager...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-indigo-600 w-8 h-8" />
          <div>
            <h1 className="text-sm font-black text-slate-800">Admin Syllabus Manager</h1>
            <p className="text-[11px] text-slate-400">Configure Chemistry subjects, chapters, and checklists</p>
          </div>
        </div>
      </div>

      {/* Add New Subject Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <form onSubmit={handleCreateSubject} className="max-w-2xl space-y-4">
          <div className="flex gap-3 max-w-md">
            <input
              type="text"
              required
              placeholder="Add new Subject (e.g. Inorganic Chemistry)..."
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <Plus size={14} className="stroke-[3px]" />
              <span>Add Subject</span>
            </button>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Exams/Categories:</span>
              <div className="flex flex-wrap gap-3">
                {categories.map(cat => (
                  <label key={cat._id} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSubCategories.includes(cat.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewSubCategories(prev => [...prev, cat.name]);
                        } else {
                          setNewSubCategories(prev => prev.filter(c => c !== cat.name));
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Syllabus Tree view list */}
      <div className="space-y-4">
        {syllabus.map(subject => {
          const isSubOpen = !!openSubjects[subject._id];
          return (
            <div key={subject._id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              {/* Subject Title Bar */}
              <div className="bg-slate-50 border-b border-slate-200/80 p-4 flex items-center justify-between gap-4">
                <button
                  onClick={() => toggleSubjectOpen(subject._id)}
                  className="flex items-center gap-2.5 text-left hover:opacity-85 font-black text-slate-800 text-xs flex-1 cursor-pointer"
                >
                  {isSubOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span>{subject.name}</span>
                  <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {subject.chapters.length} Chapters
                  </span>
                  {subject.categories && subject.categories.map((cat, idx) => (
                    <span key={idx} className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {cat}
                    </span>
                  ))}
                </button>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditSubjectModal(subject)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                    title="Edit Subject"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(subject._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Subject"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Subject Chapters container */}
              {isSubOpen && (
                <div className="p-4 space-y-4 border-b border-slate-100">
                  {/* Create chapter form */}
                  <div className="flex gap-2 max-w-sm pb-2">
                    <input
                      type="text"
                      placeholder="New Chapter name..."
                      value={newChapName[subject._id] || ''}
                      onChange={(e) => setNewChapName(prev => ({ ...prev, [subject._id]: e.target.value }))}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleCreateChapter(subject._id)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      Add Chapter
                    </button>
                  </div>

                  {subject.chapters.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-1 pl-2">No chapters inside this subject.</p>
                  ) : (
                    <div className="space-y-3.5 pl-4 border-l border-slate-200">
                      {subject.chapters.map(chapter => {
                        const isChapOpen = !!openChapters[chapter._id];
                        return (
                          <div key={chapter._id} className="space-y-2">
                            {/* Chapter title header */}
                            <div className="flex items-center justify-between gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/40">
                              <button
                                onClick={() => toggleChapterOpen(chapter._id)}
                                className="flex items-center gap-2 text-left text-xs font-bold text-slate-700 cursor-pointer"
                              >
                                {isChapOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <span>📚 {chapter.name}</span>
                              </button>
                              
                              <button
                                onClick={() => handleDeleteChapter(subject._id, chapter._id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            {/* Chapter Topics Container */}
                            {isChapOpen && (
                              <div className="pl-6 space-y-3.5 pb-2">
                                {/* Create Topic form */}
                                <div className="flex gap-2 max-w-sm pb-1">
                                  <input
                                    type="text"
                                    placeholder="New Topic name..."
                                    value={newTopicName[chapter._id] || ''}
                                    onChange={(e) => setNewTopicName(prev => ({ ...prev, [chapter._id]: e.target.value }))}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none text-[11px] font-semibold text-slate-700"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleCreateTopic(subject._id, chapter._id)}
                                    className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-100 text-[11px] font-bold rounded-lg cursor-pointer"
                                  >
                                    Add Topic
                                  </button>
                                </div>

                                {chapter.topics.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic pl-1">No topics inside this chapter.</p>
                                ) : (
                                  <div className="space-y-3.5 pl-4 border-l border-slate-200/80">
                                    {chapter.topics.map(topic => {
                                      const isTopicOpen = !!openTopics[topic._id];
                                      return (
                                        <div key={topic._id} className="space-y-2">
                                          {/* Topic Header bar */}
                                          <div className="flex items-center justify-between gap-3 bg-slate-100/30 p-2 rounded-lg border border-slate-200/20">
                                            <button
                                              onClick={() => toggleTopicOpen(topic._id)}
                                              className="flex items-center gap-1.5 text-left text-[11px] font-bold text-slate-600 cursor-pointer"
                                            >
                                              {isTopicOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                              <span>📝 Topic: {topic.name}</span>
                                            </button>
                                            
                                            <button
                                              onClick={() => handleDeleteTopic(subject._id, chapter._id, topic._id)}
                                              className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50 transition cursor-pointer"
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          </div>

                                          {/* Sub-topics details */}
                                          {isTopicOpen && (
                                            <div className="pl-5 space-y-2 pb-1">
                                              {/* Add Subtopic trigger */}
                                              <button
                                                onClick={() => handleOpenSubModal(subject._id, chapter._id, topic._id)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black cursor-pointer"
                                              >
                                                <Plus size={10} className="stroke-[3px]" />
                                                <span>Add Subtopic Check</span>
                                              </button>

                                              <div className="grid gap-2">
                                                {topic.subTopics.map(subTopic => {
                                                  // Calculate what features are enabled
                                                  const actives = [
                                                    subTopic.hasVideo && '🎥 Video',
                                                    subTopic.hasNotes && '📝 Notes',
                                                    subTopic.hasDpp && '📄 DPPs',
                                                    subTopic.hasDppVideo && '🎬 DPP Video',
                                                    subTopic.hasMockTest && '🏆 Mock Test',
                                                    subTopic.hasPyq && '📚 PYQs'
                                                  ].filter(Boolean);

                                                  return (
                                                    <div 
                                                      key={subTopic._id}
                                                      className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                                                    >
                                                      <div className="space-y-1">
                                                        <div className="font-bold text-slate-700">{subTopic.name}</div>
                                                        <div className="flex flex-wrap gap-1 text-[9px]">
                                                          {actives.map((act, i) => (
                                                            <span key={i} className="bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
                                                              {act}
                                                            </span>
                                                          ))}
                                                        </div>
                                                      </div>

                                                      <div className="flex items-center gap-2">
                                                        <button
                                                          onClick={() => handleOpenSubModal(subject._id, chapter._id, topic._id, subTopic)}
                                                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                                                        >
                                                          <Edit3 size={12} />
                                                        </button>
                                                        <button
                                                          onClick={() => handleDeleteSubTopic(subject._id, chapter._id, topic._id, subTopic._id)}
                                                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                                        >
                                                          <Trash2 size={12} />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Subtopic edit/add modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl animate-fade-in space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800">
                {activeIdsForSub?.subTopicId ? 'Edit Subtopic' : 'Add New Subtopic'}
              </h3>
              <button 
                onClick={() => { setShowSubModal(false); setActiveIdsForSub(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSubTopic} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Sub-topic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nomenclature rules, Rate equations..."
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                />
              </div>

              {/* resource toggles */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Required Study Checklist Resources</label>
                
                <div className="grid gap-2 text-xs">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 cursor-pointer transition">
                    <span className="font-bold text-slate-700">🎥 Video Lecture</span>
                    <input
                      type="checkbox"
                      checked={hasVideo}
                      onChange={(e) => setHasVideo(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 cursor-pointer transition">
                    <span className="font-bold text-slate-700">📝 Study Revision Notes</span>
                    <input
                      type="checkbox"
                      checked={hasNotes}
                      onChange={(e) => setHasNotes(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 cursor-pointer transition">
                    <span className="font-bold text-slate-700">📄 Daily Practice Problems (DPP)</span>
                    <input
                      type="checkbox"
                      checked={hasDpp}
                      onChange={(e) => setHasDpp(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 cursor-pointer transition">
                    <span className="font-bold text-slate-700">🎬 DPP Video Solutions</span>
                    <input
                      type="checkbox"
                      checked={hasDppVideo}
                      onChange={(e) => setHasDppVideo(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 cursor-pointer transition">
                    <span className="font-bold text-slate-700">🏆 Mock Tests / Quizzes</span>
                    <input
                       type="checkbox"
                       checked={hasMockTest}
                       onChange={(e) => setHasMockTest(e.target.checked)}
                       className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 cursor-pointer transition">
                    <span className="font-bold text-slate-700">📚 PYQs</span>
                    <input
                       type="checkbox"
                       checked={hasPyq}
                       onChange={(e) => setHasPyq(e.target.checked)}
                       className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowSubModal(false); setActiveIdsForSub(null); }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Save Subtopic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {showEditSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl animate-fade-in space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800">Edit Subject</h3>
              <button 
                onClick={() => { setShowEditSubjectModal(false); setEditSubjectId(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physical Chemistry..."
                  value={editSubjectName}
                  onChange={(e) => setEditSubjectName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Associated Exams/Categories</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {categories.map(cat => (
                    <label key={cat._id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 cursor-pointer transition font-bold text-slate-700">
                      <span>{cat.name}</span>
                      <input
                        type="checkbox"
                        checked={editSubjectCategories.includes(cat.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditSubjectCategories(prev => [...prev, cat.name]);
                          } else {
                            setEditSubjectCategories(prev => prev.filter(c => c !== cat.name));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditSubjectModal(false); setEditSubjectId(null); }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
