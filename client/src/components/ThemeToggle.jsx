import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ compact = false, className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const Icon = isDark ? Sun : Moon;

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`grid h-9 w-9 place-items-center rounded-xl border border-slate-200/70 bg-white/80 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 ${className}`}
        title={label}
        aria-label={label}
      >
        <Icon size={17} strokeWidth={2.25} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle group relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200/80 bg-white/85 text-slate-600 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-700 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white ${className}`}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
    >
      <Icon size={17} strokeWidth={2.25} />
      <span className="pointer-events-none absolute -bottom-0.5 right-1 h-1.5 w-1.5 rounded-full bg-brand-500 opacity-0 transition group-hover:opacity-100 dark:bg-amber-300" />
    </button>
  );
}
