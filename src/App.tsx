import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { AppFooter } from './components/AppFooter';
import { GoogleSignInModal } from './components/GoogleSignInModal';
import { KageLandingWrapper } from './components/KageLandingWrapper';
import { Navbar } from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { BrowsePage } from './pages/BrowsePage';
import { DashboardPage } from './pages/DashboardPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { ListingFormPage } from './pages/ListingFormPage';
import { SafetyPage } from './pages/SafetyPage';

function NotFoundPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-10">
        <h1 className="text-2xl font-normal text-slate-950 dark:text-white">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Head back to the campus catalog to find cameras, projectors, cycles, or formal wear.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/browse"
            className="px-5 py-2.5 rounded-xl bg-[#e63f24] text-white text-sm font-medium"
          >
            Browse Rentals
          </Link>
          <Link
            to="/"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}

function AppShell() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#060810] text-slate-900 dark:text-[#eceff4] transition-colors">
      {!isLanding && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<KageLandingWrapper />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/listings/new" element={<ListingFormPage />} />
          <Route path="/listings/:id/edit" element={<ListingFormPage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      {!isLanding && <AppFooter />}
      <GoogleSignInModal />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
