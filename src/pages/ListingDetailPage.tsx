import {
  ArrowLeft,
  Calendar,
  Flag,
  MapPin,
  Package,
  Pencil,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { ReportModal } from '../components/ReportModal';
import { RequestModal } from '../components/RequestModal';
import { useAuth } from '../context/AuthContext';
import { listingsService } from '../services/listingsService';
import { usersService } from '../services/usersService';
import type { Listing, UserProfile } from '../types/rentkaro';
import { formatDisplayDate } from '../utils/dates';

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, openSignIn } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<Record<number, boolean>>({});
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [justRequested, setJustRequested] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const found = await listingsService.getById(id);
      setListing(found);
      setActivePhotoIdx(0);
      setFailedPhotos({});
      if (found) {
        const ownerData = await usersService.getById(found.ownerId);
        setOwner(ownerData);
        setBookedDates(listingsService.getBookedDatesSync(found.id));
      } else {
        setOwner(null);
        setBookedDates([]);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/3] rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="lg:col-span-5 h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-10">
          <h1 className="text-2xl font-medium text-slate-950 dark:text-white">
            Listing not found
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            This item may have been removed or the link is no longer active.
          </p>
          <Link
            to="/browse"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e63f24] text-white text-sm font-medium"
          >
            Back to Browse
          </Link>
        </div>
      </main>
    );
  }

  const isOwner = user?.id === listing.ownerId;
  const rentedToday = listingsService.isRentedTodaySync(listing.id);
  const statusLabel = listing.isPaused
    ? 'Paused'
    : rentedToday
      ? 'Rented today'
      : 'Available';

  const currentPhoto = listing.photos[activePhotoIdx];
  const currentPhotoFailed = failedPhotos[activePhotoIdx];

  const handleRequestClick = () => {
    if (!user) {
      openSignIn();
      return;
    }
    setRequestModalOpen(true);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </Link>

        <button
          type="button"
          onClick={() => setReportModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#e63f24] hover:border-[#e63f24]/40 transition-colors"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Report listing</span>
        </button>
      </div>

      {justRequested && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-emerald-900 dark:text-emerald-200">
          <span>
            Request sent! Once {owner?.firstName ?? 'the owner'} accepts, their WhatsApp number will unlock in your dashboard.
          </span>
          <Link
            to="/dashboard?tab=rentals"
            className="font-semibold text-emerald-700 dark:text-emerald-300 underline whitespace-nowrap"
          >
            View My Rentals
          </Link>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Left Column: Gallery, Description, Availability */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] overflow-hidden">
            <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-[#0f1524]">
              {currentPhoto && !currentPhotoFailed ? (
                <img
                  src={currentPhoto}
                  alt={`${listing.title} photo ${activePhotoIdx + 1}`}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setFailedPhotos((prev) => ({ ...prev, [activePhotoIdx]: true }))
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Package className="w-10 h-10" />
                  <span className="text-sm">{listing.title}</span>
                </div>
              )}
            </div>

            {listing.photos.length > 1 && (
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 overflow-x-auto">
                {listing.photos.map((photo, idx) => (
                  <button
                    key={`${photo}_${idx}`}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      idx === activePhotoIdx
                        ? 'border-[#e63f24]'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-6 space-y-4">
            <h2 className="text-lg font-medium text-slate-950 dark:text-white">
              About this item
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-slate-400">Category</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                  {listing.category}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Condition</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                  {listing.condition}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Pickup spot</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                  {listing.pickupLocation}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Available until</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatDisplayDate(listing.availableTo)}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-950 dark:text-white">
                Availability calendar
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {formatDisplayDate(listing.availableFrom)} – {formatDisplayDate(listing.availableTo)}
              </span>
            </div>
            <AvailabilityCalendar
              availableFrom={listing.availableFrom}
              availableTo={listing.availableTo}
              bookedDates={bookedDates}
            />
          </section>
        </div>

        {/* Right Column: Pricing, CTA, Owner Card */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 space-y-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-6 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{listing.category}</span>
                  <span
                    className={`font-medium ${
                      listing.isPaused
                        ? 'text-slate-500'
                        : rentedToday
                          ? 'text-[#e63f24]'
                          : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <h1 className="mt-2 text-2xl sm:text-3xl font-normal tracking-tight text-slate-950 dark:text-[#eceff4]">
                  {listing.title}
                </h1>
              </div>

              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#070a12] p-4 flex items-baseline justify-between gap-4 tabular-nums">
                <div>
                  <span className="text-3xl font-semibold text-slate-950 dark:text-white">
                    ₹{listing.pricePerDay.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    /day
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Refundable deposit
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    ₹{listing.deposit.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-[#e63f24] mt-0.5 shrink-0" />
                <span>
                  Campus handover at{' '}
                  <strong className="font-medium text-slate-900 dark:text-white">
                    {listing.pickupLocation}
                  </strong>
                </span>
              </div>

              {isOwner ? (
                <div className="space-y-2.5 pt-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    You own this listing.
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to={`/listings/${listing.id}/edit`}
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 hover:border-[#e63f24] transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit Listing</span>
                    </Link>
                    <Link
                      to="/dashboard?tab=received"
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#e63f24] hover:bg-[#cc3118] text-white text-sm font-medium transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Requests</span>
                    </Link>
                  </div>
                </div>
              ) : listing.isPaused ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-medium cursor-not-allowed"
                >
                  Paused by Owner
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestClick}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#e63f24] hover:bg-[#cc3118] text-white text-sm font-medium transition-colors shadow-sm"
                >
                  {user ? 'Request to Rent' : 'Sign in with Google to Request'}
                </button>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Owner&apos;s WhatsApp number unlocks automatically once your rental request is accepted.
              </p>
            </div>

            {/* Owner Card */}
            {owner && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-5">
                <div className="flex items-center gap-3.5">
                  {owner.photoUrl ? (
                    <img
                      src={owner.photoUrl}
                      alt={owner.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#e63f24]/15 text-[#e63f24] font-semibold flex items-center justify-center text-base shrink-0">
                      {owner.firstName.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-950 dark:text-white truncate">
                      {owner.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {owner.college}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{owner.rating.toFixed(1)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {owner.reviewCount} reviews
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Link
              to="/safety"
              className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b0f1b] p-4 hover:border-[#e63f24]/50 transition-colors"
            >
              <ShieldCheck className="w-5 h-5 text-[#e63f24] mt-0.5 shrink-0" />
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="font-medium text-slate-900 dark:text-white">
                  Campus handover rules:
                </span>{' '}
                Meet on campus, inspect the item together, and take photos at handover. Read full safety guide.
              </div>
            </Link>
          </div>
        </div>
      </motion.div>

      {requestModalOpen && (
        <RequestModal
          listing={listing}
          bookedDates={bookedDates}
          onClose={() => setRequestModalOpen(false)}
          onSuccess={() => {
            setRequestModalOpen(false);
            setBookedDates(listingsService.getBookedDatesSync(listing.id));
            setJustRequested(true);
          }}
        />
      )}

      {reportModalOpen && (
        <ReportModal
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setReportModalOpen(false)}
        />
      )}
    </main>
  );
}
