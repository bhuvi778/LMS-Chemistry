import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ compact = false, className = '' }) {
  const { theme, setTheme, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition dark:text-slate-300 dark:hover:bg-slate-800 ${className}`}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    );
  }

  return (
    <div className={`flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 theme-toggle dark:border-slate-700 dark:bg-slate-800 ${className}`}>
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-black transition ${
          theme === 'light'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
        }`}
        aria-pressed={theme === 'light'}
        title="Light mode"
      >
        <Sun size={13} /> Light
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-black transition ${
          theme === 'dark'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
        }`}
        aria-pressed={theme === 'dark'}
        title="Dark mode"
      >
        <Moon size={13} /> Dark
      </button>
    </div>
  );
}
