import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Atom,
  Award,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  HelpCircle,
  Layers3,
  Loader2,
  RotateCcw,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

const GENERAL_TOPIC = 'General Practice';

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, '').trim().toLowerCase();

const topicNameFor = (question) => question.topic?.trim() || GENERAL_TOPIC;

const isCorrectOption = (question, option, optionIndex) => {
  const answer = String(question.correctAnswer || '').trim();
  const answerAsLetter = answer.toUpperCase();

  if (/^[A-Z]$/.test(answerAsLetter)) {
    return answerAsLetter.charCodeAt(0) - 65 === optionIndex;
  }

  if (/^\d+$/.test(answer)) {
    const answerNumber = Number(answer);
    return answerNumber === 0 ? optionIndex === 0 : answerNumber - 1 === optionIndex;
  }

  return stripHtml(answer) === stripHtml(option);
};

const difficultyClass = (difficulty) => {
  if (difficulty === 'Easy') return 'bg-emerald-100 text-emerald-700';
  if (difficulty === 'Hard') return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
};

function LoadingState({ label }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
      <Loader2 className="animate-spin text-brand-600" size={32} />
      <p className="text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
        <HelpCircle size={28} />
      </div>
      <h3 className="font-display text-lg font-bold text-slate-700">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
    </div>
  );
}

export default function NtaAbhyasPanel() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [difficulty, setDifficulty] = useState('all');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(`nta_abhyas_answers_${user?._id || 'guest'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(
      `nta_abhyas_answers_${user?._id || 'guest'}`,
      JSON.stringify(answers)
    );
  }, [answers, user]);

  useEffect(() => {
    const loadSubjects = async () => {
      setLoading(true);
      try {
        const response = await api.get('/ncert/nta-abhyas/subjects');
        setSubjects(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error(error.message || 'Failed to load NTA Abhyas subjects');
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  const topics = useMemo(() => {
    const grouped = new Map();
    questions.forEach((question) => {
      const name = topicNameFor(question);
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name).push(question);
    });
    return Array.from(grouped, ([name, topicQuestions]) => ({
      name,
      questionCount: topicQuestions.length
    }));
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (!selectedTopic) return [];
    return questions.filter((question) => {
      const matchesTopic = topicNameFor(question) === selectedTopic.name;
      const matchesDifficulty = difficulty === 'all' || question.difficulty === difficulty;
      return matchesTopic && matchesDifficulty;
    });
  }, [difficulty, questions, selectedTopic]);

  const activeQuestion = filteredQuestions[currentIdx];

  const selectSubject = async (subject) => {
    setSelectedSubject(subject);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setChapters([]);
    setQuestions([]);
    setLoading(true);
    try {
      const response = await api.get(
        `/ncert/nta-abhyas/chapters/${encodeURIComponent(subject.examCategory)}`
      );
      setChapters(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load NTA Abhyas chapters');
    } finally {
      setLoading(false);
    }
  };

  const selectChapter = async (chapter) => {
    setSelectedChapter(chapter);
    setSelectedTopic(null);
    setQuestions([]);
    setDifficulty('all');
    setCurrentIdx(0);
    setLoading(true);
    try {
      const response = await api.get('/ncert/nta-abhyas/questions', {
        params: {
          examCategory: selectedSubject.examCategory,
          chapter: chapter.name
        }
      });
      setQuestions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load NTA Abhyas topics');
    } finally {
      setLoading(false);
    }
  };

  const selectTopic = (topic) => {
    setSelectedTopic(topic);
    setDifficulty('all');
    setCurrentIdx(0);
  };

  const goBack = () => {
    if (selectedTopic) {
      setSelectedTopic(null);
      setDifficulty('all');
      setCurrentIdx(0);
      return;
    }
    if (selectedChapter) {
      setSelectedChapter(null);
      setQuestions([]);
      return;
    }
    setSelectedSubject(null);
    setChapters([]);
  };

  const submitAnswer = (option, optionIndex) => {
    if (!activeQuestion || answers[activeQuestion._id]) return;
    setAnswers((previous) => ({
      ...previous,
      [activeQuestion._id]: {
        selectedIndex: optionIndex,
        selected: option,
        isCorrect: isCorrectOption(activeQuestion, option, optionIndex)
      }
    }));
  };

  const resetTopicProgress = () => {
    if (!window.confirm('Reset progress for all questions in this topic?')) return;
    const updated = { ...answers };
    questions
      .filter((question) => topicNameFor(question) === selectedTopic.name)
      .forEach((question) => delete updated[question._id]);
    setAnswers(updated);
    setCurrentIdx(0);
    toast.success('Topic progress reset');
  };

  const solvedCount = questions.filter((question) => answers[question._id]).length;

  if (loading) {
    return <LoadingState label="Loading NTA Abhyas data..." />;
  }

  if (!selectedSubject) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-black text-slate-800">Choose a Subject</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select your NTA Abhyas chemistry stream to view its chapters and topics.
          </p>
        </div>

        {subjects.length === 0 ? (
          <EmptyState
            title="No Subjects Found"
            description="No active NTA Abhyas subject data is available yet."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <motion.button
                key={subject._id}
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => selectSubject(subject)}
                className="group overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-sm transition hover:shadow-lg"
              >
                <div className="h-1.5 bg-gradient-to-r from-violet-500 to-brand-500" />
                <div className="p-6">
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                      <Atom size={25} />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      {subject.examCategory}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-black text-slate-800 transition group-hover:text-brand-700">
                    {subject.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">NTA official practice questions</p>
                  <div className="mt-5 flex gap-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                    <span>{subject.totalChapters} Chapters</span>
                    <span>{subject.totalQuestions} Questions</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!selectedChapter) {
    return (
      <div className="space-y-6">
        <button onClick={goBack} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-650">
          <ArrowLeft size={16} /> Back to Subjects
        </button>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-brand-600">{selectedSubject.name}</p>
          <h2 className="mt-1 font-display text-xl font-black text-slate-800">Choose a Chapter</h2>
        </div>

        {chapters.length === 0 ? (
          <EmptyState title="No Chapters Found" description="This subject does not have active chapters yet." />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {chapters.map((chapter) => (
              <motion.button
                key={`${chapter.chapterNumber}-${chapter.name}`}
                whileHover={{ y: -4 }}
                onClick={() => selectChapter(chapter)}
                className="group rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <BookOpen size={22} />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                    Class {chapter.classLevel}
                  </span>
                </div>
                <p className="mt-5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Chapter {chapter.chapterNumber || '—'}
                </p>
                <h3 className="mt-1 font-display text-base font-black text-slate-800 group-hover:text-brand-700">
                  {chapter.name}
                </h3>
                <p className="mt-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                  {chapter.questionCount} Questions
                </p>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!selectedTopic) {
    return (
      <div className="space-y-6">
        <button onClick={goBack} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-650">
          <ArrowLeft size={16} /> Back to Chapters
        </button>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-brand-600">
              {selectedSubject.name} · Chapter {selectedChapter.chapterNumber || '—'}
            </p>
            <h2 className="mt-1 font-display text-xl font-black text-slate-800">{selectedChapter.name} Topics</h2>
          </div>
          <span className="text-xs font-bold text-slate-500">{solvedCount}/{questions.length} solved</span>
        </div>

        {topics.length === 0 ? (
          <EmptyState title="No Topics Found" description="No active questions are available in this chapter yet." />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <motion.button
                key={topic.name}
                whileHover={{ y: -3 }}
                onClick={() => selectTopic(topic)}
                className="group rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                    <Layers3 size={21} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-black text-slate-800 group-hover:text-brand-700">
                      {topic.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{topic.questionCount} Questions</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <button onClick={goBack} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-650">
          <ArrowLeft size={16} /> Back to Topics
        </button>
        <button
          onClick={resetTopicProgress}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
        >
          <RotateCcw size={13} /> Reset Topic Progress
        </button>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600">
              {selectedSubject.name} · {selectedChapter.name}
            </p>
            <h2 className="mt-1 font-display text-lg font-black text-slate-800">{selectedTopic.name}</h2>
          </div>
          <select
            value={difficulty}
            onChange={(event) => {
              setDifficulty(event.target.value);
              setCurrentIdx(0);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {!activeQuestion ? (
        <EmptyState title="No Questions Found" description="Try selecting another difficulty level." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-extrabold uppercase text-brand-700">
                Q {currentIdx + 1} of {filteredQuestions.length}
              </span>
              <span className={`rounded-lg px-2 py-1 text-[10px] font-extrabold uppercase ${difficultyClass(activeQuestion.difficulty)}`}>
                {activeQuestion.difficulty || 'Medium'}
              </span>
            </div>
            {activeQuestion.paperNumber && (
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Paper {activeQuestion.paperNumber}</span>
            )}
          </div>

          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${((currentIdx + 1) / filteredQuestions.length) * 100}%` }}
            />
          </div>

          <div className="space-y-6 p-6 md:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <FlaskConical size={14} /> {topicNameFor(activeQuestion)}
            </div>
            {activeQuestion.imageUrl && (
              <img src={activeQuestion.imageUrl} alt="Question" className="max-h-80 max-w-full rounded-2xl object-contain" />
            )}
            <div
              className="text-base font-semibold leading-relaxed text-slate-800"
              dangerouslySetInnerHTML={{ __html: activeQuestion.question }}
            />

            <div className="grid grid-cols-1 gap-3">
              {activeQuestion.options?.map((option, optionIndex) => {
                const answer = answers[activeQuestion._id];
                const selected = answer?.selectedIndex === optionIndex;
                const correct = isCorrectOption(activeQuestion, option, optionIndex);
                let optionClass = 'border-slate-200 text-slate-700 hover:border-brand-400 hover:bg-brand-50/30';
                if (answer && correct) optionClass = 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/10';
                else if (answer && selected) optionClass = 'border-rose-300 bg-rose-50 text-rose-800 ring-2 ring-rose-500/10';
                else if (answer) optionClass = 'border-slate-100 bg-slate-50/40 text-slate-400';

                return (
                  <button
                    key={optionIndex}
                    disabled={Boolean(answer)}
                    onClick={() => submitAnswer(option, optionIndex)}
                    className={`flex w-full items-start justify-between gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition ${optionClass}`}
                  >
                    <span className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: option }} />
                    </span>
                    {answer && correct && <Check className="shrink-0 text-emerald-600" size={17} />}
                    {answer && selected && !correct && <X className="shrink-0 text-rose-600" size={17} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-5">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((index) => Math.max(0, index - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              disabled={currentIdx === filteredQuestions.length - 1}
              onClick={() => setCurrentIdx((index) => Math.min(filteredQuestions.length - 1, index + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {activeQuestion && answers[activeQuestion._id] && (activeQuestion.solution || activeQuestion.hint) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6"
          >
            <div className="flex items-center gap-2 font-black text-emerald-800">
              <Award size={18} /> Solution
            </div>
            <div
              className="text-sm font-medium leading-relaxed text-slate-700"
              dangerouslySetInnerHTML={{ __html: activeQuestion.solution || activeQuestion.hint }}
            />
            {activeQuestion.solutionImageUrl && (
              <img src={activeQuestion.solutionImageUrl} alt="Solution" className="max-h-80 max-w-full rounded-2xl object-contain" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
