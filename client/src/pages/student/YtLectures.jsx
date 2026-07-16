import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, ExternalLink, FileText, Loader2, PlayCircle, Youtube } from 'lucide-react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';

function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([A-Za-z0-9_-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : '';
}

function DirectYouTubePreview({ lecture }) {
  const embedUrl = getYouTubeEmbedUrl(lecture.youtubeUrl);

  if (!embedUrl) {
    return (
      <div className="aspect-video rounded-2xl bg-slate-950 text-slate-300 flex flex-col items-center justify-center text-center p-4">
        <Youtube size={34} className="text-red-400 mb-2" />
        <p className="text-xs font-bold">Open this lecture on YouTube</p>
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-2xl overflow-hidden bg-black">
      <iframe
        className="w-full h-full"
        src={embedUrl}
        title={lecture.title || 'YT Lecture'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export default function YtLectures() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCourse = searchParams.get('course') || 'all';
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/enroll/me')
      .then((res) => setEnrollments(res.data || []))
      .catch(() => {
        toast.error('Failed to load YT lectures');
        setEnrollments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const coursesWithLectures = useMemo(() => {
    return enrollments
      .filter((enrollment) => !enrollment.isPaused)
      .map((enrollment) => ({
        enrollment,
        course: enrollment.course,
        lectures: (enrollment.course?.ytLectures || [])
          .filter((lecture) => lecture.isActive !== false)
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      }))
      .filter((entry) => entry.course?._id && entry.lectures.length > 0);
  }, [enrollments]);

  const visibleEntries = selectedCourse === 'all'
    ? coursesWithLectures
    : coursesWithLectures.filter((entry) => entry.course._id === selectedCourse);

  const totalLectures = coursesWithLectures.reduce((sum, entry) => sum + entry.lectures.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider mb-2">
            <Youtube size={13} /> Direct YouTube
          </div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800">YT Lectures</h1>
          <p className="text-sm text-slate-500 mt-1">Direct YouTube lectures with mapped class notes PDFs.</p>
        </div>
        <select
          value={selectedCourse}
          onChange={(e) => {
            const next = e.target.value;
            setSearchParams(next === 'all' ? {} : { course: next });
          }}
          className="input sm:max-w-xs bg-white"
        >
          <option value="all">All Courses ({totalLectures})</option>
          {coursesWithLectures.map(({ course, lectures }) => (
            <option key={course._id} value={course._id}>
              {course.title} ({lectures.length})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-brand-600">
          <Loader2 size={30} className="animate-spin" />
        </div>
      ) : totalLectures === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <Youtube size={46} className="mx-auto mb-3 text-red-300" />
          <h3 className="font-bold text-slate-700 text-lg">No YT Lectures Available</h3>
          <p className="text-sm text-slate-400 mt-1">Your enrolled courses do not have direct YT lectures yet.</p>
          <Link to="/student/courses" className="btn-primary inline-flex mt-6 text-xs">
            Go to My Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {visibleEntries.map(({ course, lectures }) => (
            <section key={course._id} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-extrabold text-slate-800 text-base sm:text-lg truncate">{course.title}</h2>
                  <p className="text-xs text-slate-400">{lectures.length} direct YT lecture{lectures.length === 1 ? '' : 's'}</p>
                </div>
                <Link
                  to={course.isPowerCourse ? `/student/power-batch/${course._id}/learn` : `/student/learn/${course._id}`}
                  className="btn-outline text-xs !py-2 shrink-0"
                >
                  Course Learn
                </Link>
              </div>

              <div className="grid lg:grid-cols-2 gap-5">
                {lectures.map((lecture) => (
                  <article key={lecture._id} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-4">
                    <DirectYouTubePreview lecture={lecture} />
                    <div>
                      <h3 className="font-bold text-slate-900 leading-snug">{lecture.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        {lecture.duration && (
                          <span className="inline-flex items-center gap-1"><Clock size={12} /> {lecture.duration}</span>
                        )}
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                          <PlayCircle size={12} /> Direct YT
                        </span>
                      </div>
                      {lecture.description && (
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed whitespace-pre-line">{lecture.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href={lecture.youtubeUrl} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs !py-2">
                        <ExternalLink size={13} /> Open YT
                      </a>
                      {lecture.notesPdfUrl && (
                        <a href={lecture.notesPdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs !py-2">
                          <FileText size={13} /> {lecture.notesTitle || 'Class Notes PDF'}
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
