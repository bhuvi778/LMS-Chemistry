import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { Calendar, PlayCircle, Trophy, Zap, Clock, ChevronRight, Award, Compass } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PowerCoursesDashboard() {
  const [enrolled, setEnrolled] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrollsRes, coursesRes] = await Promise.all([
          api.get('/enroll/me'),
          api.get('/courses?isPowerCourse=true')
        ]);

        const enrollments = enrollsRes.data || [];
        const powerEnrollments = enrollments.filter(e => e.course?.isPowerCourse);
        setEnrolled(powerEnrollments);

        const allPowerCourses = coursesRes.data || [];
        const enrolledCourseIds = new Set(powerEnrollments.map(e => e.course?._id));
        const unenrolledPowerCourses = allPowerCourses.filter(c => !enrolledCourseIds.has(c._id));
        setAvailable(unenrolledPowerCourses);
      } catch (err) {
        toast.error('Failed to load power challenges');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTypeBadge = (type) => {
    switch (type) {
      case 'micro':
        return <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Micro Challenge</span>;
      case 'mini':
        return <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Mini Challenge</span>;
      case 'crash':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Crash Course</span>;
      default:
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Target Challenge</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm mt-3 font-semibold">Loading your dashboard...</p>
      </div>
    );
  }

  // Compute stats
  const totalCompletedDays = enrolled.reduce((acc, curr) => acc + (curr.completedDays?.length || 0), 0);
  const activeChallengesCount = enrolled.filter(e => (e.progress || 0) < 100).length;
  const completedChallengesCount = enrolled.filter(e => (e.progress || 0) === 100).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Stats Panel */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-slate-800/80 text-brand-400 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">
              <Zap size={12} className="animate-pulse" /> Calendar Progression Mode
            </div>
            <h1 className="text-3xl font-black font-display tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              My Power Challenges
            </h1>
            <p className="text-slate-400 text-sm max-w-lg">
              Unlock daily syllabus targets step-by-step. Consistently finish videos, notes, quizzes, and tasks to conquer the challenges.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-6 shrink-0 bg-slate-800/40 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-black text-brand-400">{activeChallengesCount}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active</div>
            </div>
            <div className="text-center border-x border-slate-800 px-3 md:px-6">
              <div className="text-xl md:text-2xl font-black text-emerald-400">{totalCompletedDays}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Days Done</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-black text-yellow-400">{completedChallengesCount}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Conquered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Active Challenges */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Trophy className="text-yellow-500" size={20} /> Enrolled Challenges
        </h2>

        {enrolled.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-3xl p-8 text-center bg-white space-y-4">
            <Calendar className="text-slate-350 mx-auto" size={40} />
            <div>
              <p className="text-slate-700 font-bold">No active challenges enrolled</p>
              <p className="text-slate-400 text-xs mt-1">Explore and enroll in our structured daily planner challenges below to start learning.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolled.map((enroll) => {
              const course = enroll.course || {};
              const progressPercent = Math.round(enroll.progress || 0);
              const completedCount = enroll.completedDays?.length || 0;
              const duration = course.powerCourseDuration || 7;
              
              return (
                <div key={enroll._id} className="group relative bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-500/5 to-transparent rounded-bl-full pointer-events-none" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      {getTypeBadge(course.powerCourseType)}
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-bold">
                        <Clock size={12} /> {duration} Days
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base leading-tight group-hover:text-brand-650 transition">
                        {course.title}
                      </h3>
                      <p className="text-slate-400 text-xs line-clamp-2 mt-1">
                        {course.subtitle || 'Learn structured syllabus targets daily.'}
                      </p>
                    </div>

                    {/* Progress slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-brand-650">{progressPercent}% ({completedCount}/{duration} Days)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-indigo-650 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 border-t border-slate-100 pt-4">
                    <Link
                      to={`/student/power-courses/${course._id}/learn`}
                      className="flex-1 btn-primary py-2.5 justify-center text-xs font-extrabold"
                    >
                      <PlayCircle size={14} /> Resume Target
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Power Challenges */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Compass className="text-brand-500" size={20} /> Explore Power Challenges
        </h2>

        {available.length === 0 ? (
          <div className="text-slate-400 text-xs italic">No other power challenges available at this time.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {available.map((course) => (
              <div key={course._id} className="group bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-350 flex flex-col justify-between">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden shrink-0">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                      <Calendar size={32} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    {getTypeBadge(course.powerCourseType)}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-brand-650 transition line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                      {course.subtitle || 'Unleash calendar-based progression mapping.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-slate-850">₹{course.price || 0}</span>
                      {course.mrp && course.mrp > course.price ? (
                        <span className="text-xs text-slate-400 font-bold line-through">₹{course.mrp}</span>
                      ) : null}
                    </div>

                    <span className="flex items-center gap-1 text-[11px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      <Clock size={11} /> {course.powerCourseDuration || 7} Days
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/student/power-courses/${course._id}`)}
                    className="w-full btn-outline justify-center text-xs py-2 font-bold"
                  >
                    View details <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
