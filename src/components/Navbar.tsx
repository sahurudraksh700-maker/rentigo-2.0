import { Menu, Moon, Plus, Sun, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function Navbar() {
  const { user, openSignIn, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleListItem = () => {
    setMobileOpen(false);
    if (!user) {
      openSignIn('/listings/new');
      return;
    }
    navigate('/listings/new');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap shrink-0 text-sm font-medium transition-colors ${
      isActive
        ? 'text-[#e63f24]'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-[#060810]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-slate-950 dark:text-[#eceff4] whitespace-nowrap shrink-0"
        >
          <svg viewBox="0 0 44 44" fill="none" className="w-7 h-7 shrink-0" aria-hidden="true">
            <circle cx="22" cy="22" r="9.5" fill="#e63f24" />
            <path
              d="M8 14h28M12 29h20M22 8v28"
              stroke="currentColor"
              strokeWidth="2.2"
              className="text-slate-900 dark:text-[#eceff4]"
            />
          </svg>
          <span>RentKaro</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          <NavLink to="/browse" className={navLinkClass}>
            Browse
          </NavLink>
          <NavLink to="/safety" className={navLinkClass}>
            Safety
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <button
            type="button"
            onClick={handleListItem}
            className="whitespace-nowrap shrink-0 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
          >
            List Item
          </button>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:border-[#e63f24] transition-colors whitespace-nowrap shrink-0"
              >
                <span className="w-6 h-6 rounded-full bg-[#e63f24] text-white text-xs font-semibold flex items-center justify-center">
                  {user.firstName.charAt(0)}
                </span>
                <span className="max-w-[110px] truncate">{user.firstName}</span>
              </Link>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                title="Sign out"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-[#e63f24] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openSignIn()}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e63f24] hover:bg-[#cc3118] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              Sign in with Google
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#060810] px-4 py-4 space-y-2">
          <Link
            to="/browse"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            Browse Rentals
          </Link>
          <Link
            to="/safety"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            Campus Safety
          </Link>
          <Link
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={handleListItem}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 text-left"
          >
            <Plus className="w-4 h-4" />
            <span>List an Item</span>
          </button>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {user ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    signOut();
                  }}
                  className="text-sm font-medium text-[#e63f24]"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  openSignIn();
                }}
                className="w-full py-2.5 rounded-xl bg-[#e63f24] text-white text-sm font-medium"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
