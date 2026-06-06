import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages = [];
  const push = (p) => pages.push(p);
  const win = 1;
  push(1);
  if (page - win > 2) push('…');
  for (let i = Math.max(2, page - win); i <= Math.min(totalPages - 1, page + win); i++) push(i);
  if (page + win < totalPages - 1) push('…');
  if (totalPages > 1) push(totalPages);

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 px-2">
      <div className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{start}-{end}</span> of{' '}
        <span className="font-semibold text-slate-700">{total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-9 h-9 rounded-lg border border-slate-200 bg-white grid place-items-center hover:bg-brand-50 hover:border-brand-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="w-9 h-9 grid place-items-center text-slate-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`min-w-9 h-9 px-3 rounded-lg text-sm font-semibold transition ${
                p === page
                  ? 'bg-gradient-brand text-white shadow-soft'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-brand-50 hover:border-brand-300'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-9 h-9 rounded-lg border border-slate-200 bg-white grid place-items-center hover:bg-brand-50 hover:border-brand-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function usePaged(list, page, pageSize = 10) {
  if (!Array.isArray(list)) return [];
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}
