import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { Trophy } from 'lucide-react';

export default function Results() {
  const [toppers, setToppers] = useState([]);
  const [exam, setExam] = useState('ALL');
  useEffect(() => {
    api.get('/content/topper').then((r) => setToppers(r.data));
  }, []);
  const exams = ['ALL', ...new Set(toppers.map((t) => t.exam).filter(Boolean))];
  const list = exam === 'ALL' ? toppers : toppers.filter((t) => t.exam === exam);

  return (
    <div>
      <section className="bg-gradient-soft py-14">
        <div className="container-x">
          <span className="chip bg-amber-50 text-amber-700 mb-3">
            <Trophy size={14} /> Our Results
          </span>
          <h1 className="font-display text-4xl font-extrabold">
            Our <span className="gradient-text">Top Rankers</span>
          </h1>
          <p className="text-slate-600 mt-2">
            Celebrating every student who turned effort into excellence.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
            {exams.map((e) => (
              <button
                key={e}
                onClick={() => setExam(e)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                  exam === e
                    ? 'bg-gradient-brand text-white shadow-soft'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {list.map((t) => (
              <div key={t._id} className="card overflow-hidden">
                <div className="relative h-48 bg-gradient-brand">
                  {t.image && (
                    <img src={t.image} alt={t.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-3 left-3 chip bg-white/95 text-amber-700">
                    <Trophy size={12} /> {t.rank}
                  </div>
                  <div className="absolute bottom-3 right-3 chip bg-slate-900/80 text-white">
                    {t.exam} {t.year}
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-bold text-lg">{t.title}</div>
                  <p className="text-sm text-slate-500 mt-1">{t.description}</p>
                </div>
              </div>
            ))}
            {list.length === 0 && (
              <div className="col-span-full text-center text-slate-500 py-14">
                No results in this category yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
