import {
  Check,
  Copy,
  MessageCircle,
  PauseCircle,
  Pencil,
  Phone,
  PlayCircle,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listingsService } from '../services/listingsService';
import { requestsService } from '../services/requestsService';
import { usersService } from '../services/usersService';
import type { Listing, RentalRequest, RequestStatus, UserProfile } from '../types/rentkaro';
import { formatDisplayDate } from '../utils/dates';

type DashboardTab = 'listings' | 'received' | 'rentals';

function StatusText({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    Pending: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
    Accepted:
      'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    Returned: 'text-slate-600 dark:text-slate-300 bg-slate-500/10 border-slate-500/30',
    Declined: 'text-[#e63f24] bg-[#e63f24]/10 border-[#e63f24]/30',
    Cancelled: 'text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function DashboardPage() {
  const { user, openSignIn, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as DashboardTab) || 'listings';
  const [tab, setTab] = useState<DashboardTab>(
    ['listings', 'received', 'rentals'].includes(initialTab) ? initialTab : 'listings',
  );

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<RentalRequest[]>([]);
  const [myRentals, setMyRentals] = useState<RentalRequest[]>([]);
  const [listingsMap, setListingsMap] = useState<Record<string, Listing>>({});
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileCollege, setProfileCollege] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [allListings, allUsers, received, rentals] = await Promise.all([
        listingsService.listAll(),
        usersService.listUsers(),
        requestsService.listByOwner(user.id),
        requestsService.listByRenter(user.id),
      ]);

      const lMap: Record<string, Listing> = {};
      for (const l of allListings) lMap[l.id] = l;
      const uMap: Record<string, UserProfile> = {};
      for (const u of allUsers) uMap[u.id] = u;

      setListingsMap(lMap);
      setUsersMap(uMap);
      setMyListings(allListings.filter((l) => l.ownerId === user.id));
      setReceivedRequests(received);
      setMyRentals(rentals);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const paramTab = searchParams.get('tab') as DashboardTab | null;
    if (paramTab && ['listings', 'received', 'rentals'].includes(paramTab)) {
      setTab(paramTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileCollege(user.college);
      setProfilePhone(user.phone);
    }
  }, [user]);

  const switchTab = (next: DashboardTab) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  if (!user) {
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-8 text-center">
          <h1 className="text-2xl font-normal text-slate-950 dark:text-white">
            Your Campus Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Sign in with Google to manage your posted items, incoming requests, and active rentals.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openSignIn('/dashboard')}
              className="px-5 py-2.5 rounded-xl bg-[#e63f24] hover:bg-[#cc3118] text-white text-sm font-medium transition-colors"
            >
              Sign in with Google
            </button>
            <Link
              to="/browse"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Browse items
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileCollege.trim() || !profilePhone.trim()) {
      showToast('Please complete all profile fields.', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        name: profileName.trim(),
        college: profileCollege.trim(),
        phone: profilePhone.trim(),
      });
      setEditingProfile(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTogglePause = async (listingId: string) => {
    try {
      const updated = await listingsService.togglePause(listingId, user.id);
      showToast(updated.isPaused ? 'Listing paused' : 'Listing resumed', 'info');
      await loadDashboard();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update.', 'error');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      await listingsService.remove(listingId, user.id);
      setConfirmDeleteId(null);
      showToast('Listing removed', 'info');
      await loadDashboard();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete.', 'error');
    }
  };

  const handleRequestAction = async (
    requestId: string,
    nextStatus: RequestStatus,
  ) => {
    try {
      await requestsService.updateStatus(requestId, user.id, nextStatus);
      const msgs: Record<RequestStatus, string> = {
        Pending: 'Updated',
        Accepted: 'Request accepted! Your WhatsApp number is now shared with the renter.',
        Returned: 'Marked as returned. Deposit settled!',
        Declined: 'Request declined.',
        Cancelled: 'Request cancelled.',
      };
      showToast(msgs[nextStatus], nextStatus === 'Accepted' || nextStatus === 'Returned' ? 'success' : 'info');
      await loadDashboard();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed.', 'error');
    }
  };

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      showToast(`Copied ${phone}`, 'success');
    } catch {
      showToast(phone, 'info');
    }
  };

  const formatWaNumber = (phone: string) => phone.replace(/[^0-9]/g, '');

  const pendingIncomingCount = receivedRequests.filter(
    (r) => r.status === 'Pending',
  ).length;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Profile Header */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#e63f24] text-white text-xl font-semibold flex items-center justify-center shrink-0">
              {user.firstName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-normal text-slate-950 dark:text-white">
                {user.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{user.college}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{user.phone}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200 tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {user.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setEditingProfile((v) => !v)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#e63f24] transition-colors"
            >
              {editingProfile ? 'Cancel Edit' : 'Edit Profile'}
            </button>
            <Link
              to="/listings/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e63f24] hover:bg-[#cc3118] text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>List an Item</span>
            </Link>
          </div>
        </div>

        {editingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a12] px-3 py-2 text-sm outline-none focus:border-[#e63f24]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                College / Campus
              </label>
              <input
                type="text"
                value={profileCollege}
                onChange={(e) => setProfileCollege(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a12] px-3 py-2 text-sm outline-none focus:border-[#e63f24]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                WhatsApp / Phone
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a12] px-3 py-2 text-sm outline-none focus:border-[#e63f24]"
                  required
                />
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 rounded-xl bg-[#e63f24] text-white text-xs font-medium shrink-0"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => switchTab('listings')}
          className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors tabular-nums ${
            tab === 'listings'
              ? 'border-[#e63f24] text-[#e63f24]'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          My Listings ({myListings.length})
        </button>
        <button
          type="button"
          onClick={() => switchTab('received')}
          className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors tabular-nums ${
            tab === 'received'
              ? 'border-[#e63f24] text-[#e63f24]'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          Requests Received ({receivedRequests.length})
          {pendingIncomingCount > 0 ? ` · ${pendingIncomingCount} pending` : ''}
        </button>
        <button
          type="button"
          onClick={() => switchTab('rentals')}
          className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors tabular-nums ${
            tab === 'rentals'
              ? 'border-[#e63f24] text-[#e63f24]'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          My Rentals ({myRentals.length})
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800/70"
            />
          ))}
        </div>
      ) : tab === 'listings' ? (
        myListings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-10 text-center">
            <h2 className="text-lg font-medium text-slate-950 dark:text-white">
              You haven&apos;t listed any items yet
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Got a tripod, blazer, scientific calculator, or cycle sitting idle in your hostel room?
            </p>
            <Link
              to="/listings/new"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e63f24] text-white text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>List Your First Item</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myListings.map((item) => {
              const rentedToday = listingsService.isRentedTodaySync(item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Link
                      to={`/listing/${item.id}`}
                      className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0"
                    >
                      <img
                        src={item.photos[0]}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        to={`/listing/${item.id}`}
                        className="text-base font-medium text-slate-950 dark:text-white hover:text-[#e63f24] truncate block"
                      >
                        {item.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        <span>₹{item.pricePerDay}/day</span>
                        <span aria-hidden="true">·</span>
                        <span>₹{item.deposit} deposit</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.pickupLocation}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            item.isPaused
                              ? 'text-slate-500'
                              : rentedToday
                                ? 'text-[#e63f24] font-medium'
                                : 'text-emerald-600 dark:text-emerald-400 font-medium'
                          }
                        >
                          {item.isPaused ? 'Paused' : rentedToday ? 'Rented' : 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link
                      to={`/listings/${item.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#e63f24] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleTogglePause(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#e63f24] transition-colors"
                    >
                      {item.isPaused ? (
                        <>
                          <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Resume</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Pause</span>
                        </>
                      )}
                    </button>
                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(item.id)}
                          className="px-3 py-2 rounded-xl bg-[#e63f24] text-white text-xs font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-2 text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-[#e63f24] hover:bg-[#e63f24]/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : tab === 'received' ? (
        receivedRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-10 text-center">
            <h2 className="text-lg font-medium text-slate-950 dark:text-white">
              No incoming requests yet
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              When a classmate requests one of your listed items, you can accept or decline it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {receivedRequests.map((req) => {
              const item = listingsMap[req.listingId];
              const renter = usersMap[req.renterId];
              return (
                <div
                  key={req.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {item?.photos[0] && (
                        <Link
                          to={`/listing/${item.id}`}
                          className="w-16 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0"
                        >
                          <img
                            src={item.photos[0]}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </Link>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/listing/${req.listingId}`}
                            className="text-base font-medium text-slate-950 dark:text-white hover:text-[#e63f24]"
                          >
                            {item?.title ?? 'Listing removed'}
                          </Link>
                          <StatusText status={req.status} />
                        </div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                          Requested by{' '}
                          <span className="font-medium text-slate-900 dark:text-slate-200">
                            {renter?.name ?? 'Student'}
                          </span>{' '}
                          ({renter?.college ?? 'Campus'}) · {formatDisplayDate(req.startDate)} –{' '}
                          {formatDisplayDate(req.endDate)} ({req.days} day
                          {req.days === 1 ? '' : 's'})
                        </div>
                        {req.message && (
                          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#070a12] rounded-xl px-3.5 py-2 border border-slate-100 dark:border-slate-800">
                            &ldquo;{req.message}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 tabular-nums">
                      <div className="text-base font-semibold text-slate-950 dark:text-white">
                        ₹{req.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        incl. ₹{req.depositSnapshot.toLocaleString('en-IN')} deposit
                      </div>
                    </div>
                  </div>

                  {req.status === 'Pending' && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleRequestAction(req.id, 'Declined')}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-[#e63f24] hover:text-[#e63f24] transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestAction(req.id, 'Accepted')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e63f24] hover:bg-[#cc3118] text-white text-xs font-medium transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Request</span>
                      </button>
                    </div>
                  )}

                  {req.status === 'Accepted' && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          Renter WhatsApp:{' '}
                          <strong className="font-medium text-slate-900 dark:text-white tabular-nums">
                            {renter?.phone ?? 'Not provided'}
                          </strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRequestAction(req.id, 'Returned')}
                        className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        Mark Item Returned
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : myRentals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-10 text-center">
          <h2 className="text-lg font-medium text-slate-950 dark:text-white">
            No rental requests yet
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Browse cameras, projectors, cycles, or formal wear from classmates on campus.
          </p>
          <Link
            to="/browse"
            className="mt-5 inline-flex px-5 py-2.5 rounded-xl bg-[#e63f24] text-white text-sm font-medium"
          >
            Browse Rentals
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myRentals.map((req) => {
            const item = listingsMap[req.listingId];
            const owner = usersMap[req.ownerId];
            return (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {item?.photos[0] && (
                      <Link
                        to={`/listing/${item.id}`}
                        className="w-16 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0"
                      >
                        <img
                          src={item.photos[0]}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/listing/${req.listingId}`}
                          className="text-base font-medium text-slate-950 dark:text-white hover:text-[#e63f24]"
                        >
                          {item?.title ?? 'Listing removed'}
                        </Link>
                        <StatusText status={req.status} />
                      </div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                        Owner: {owner?.name ?? 'Student'} ({owner?.college ?? 'Campus'}) ·{' '}
                        {formatDisplayDate(req.startDate)} – {formatDisplayDate(req.endDate)} (
                        {req.days} day{req.days === 1 ? '' : 's'})
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {req.status === 'Pending' && 'Pending → Accepted → Returned'}
                        {req.status === 'Accepted' && 'Accepted — Ready for campus handover'}
                        {req.status === 'Returned' && 'Completed · Returned & deposit settled'}
                        {req.status === 'Declined' && 'Declined by owner'}
                        {req.status === 'Cancelled' && 'Cancelled by you'}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 tabular-nums">
                    <div className="text-base font-semibold text-slate-950 dark:text-white">
                      ₹{req.totalAmount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      incl. ₹{req.depositSnapshot.toLocaleString('en-IN')} deposit
                    </div>
                  </div>
                </div>

                {req.status === 'Pending' && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRequestAction(req.id, 'Cancelled')}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-[#e63f24] hover:text-[#e63f24] transition-colors"
                    >
                      Cancel Request
                    </button>
                  </div>
                )}

                {req.status === 'Accepted' && owner && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-sm text-emerald-950 dark:text-emerald-200">
                      <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Owner WhatsApp / Phone:{' '}
                        <strong className="font-semibold tabular-nums">
                          {owner.phone}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyPhone(owner.phone)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0b101d] border border-emerald-500/30 text-xs font-medium text-emerald-800 dark:text-emerald-200"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                      <a
                        href={`https://wa.me/${formatWaNumber(owner.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
