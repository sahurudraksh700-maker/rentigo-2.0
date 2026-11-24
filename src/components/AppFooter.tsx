import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AppFooter() {
  const { user, openSignIn } = useAuth();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#060810] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <Link
            to="/"
            className="text-base font-semibold tracking-tight text-slate-950 dark:text-[#eceff4]"
          >
            RentKaro
          </Link>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t buy it. Rent it from a classmate on campus.
          </p>
        </div>

        <nav
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400"
          aria-label="Footer navigation"
        >
          <Link to="/browse" className="hover:text-[#e63f24] transition-colors">
            Browse
          </Link>
          <Link to="/safety" className="hover:text-[#e63f24] transition-colors">
            Safety
          </Link>
          <Link to="/browse?report=1" className="hover:text-[#e63f24] transition-colors">
            Report
          </Link>
          {user ? (
            <Link to="/dashboard" className="hover:text-[#e63f24] transition-colors">
              Dashboard
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openSignIn('/browse')}
              className="hover:text-[#e63f24] transition-colors"
            >
              Sign in with Google
            </button>
          )}
          <a
            href="mailto:hello@rentkaro.campus"
            className="hover:text-[#e63f24] transition-colors"
          >
            hello@rentkaro.campus
          </a>
        </nav>
      </div>
    </footer>
  );
}
