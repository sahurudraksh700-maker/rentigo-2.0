import { Calendar, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { requestsService } from '../services/requestsService';
import type { Listing } from '../types/rentkaro';
import { countInclusiveDays, datesOverlap, todayIsoDate } from '../utils/dates';

interface RequestModalProps {
  listing: Listing;
  bookedDates: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function RequestModal({
  listing,
  bookedDates,
  onClose,
  onSuccess,
}: RequestModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const minDate =
    todayIsoDate() > listing.availableFrom ? todayIsoDate() : listing.availableFrom;

  const [startDate, setStartDate] = useState(minDate);
  const [endDate, setEndDate] = useState(minDate);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const calculation = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) {
      return { valid: false, days: 0, rentalCost: 0, total: 0 };
    }
    const days = countInclusiveDays(startDate, endDate);
    const rentalCost = days * listing.pricePerDay;
    return {
      valid: true,
      days,
      rentalCost,
      total: rentalCost + listing.deposit,
    };
  }, [endDate, listing.deposit, listing.pricePerDay, startDate]);

  const conflictDate = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return null;
    return bookedDates.find((d) => datesOverlap(startDate, endDate, d, d)) ?? null;
  }, [bookedDates, endDate, startDate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (!startDate || !endDate) {
      setError('Please pick both a start date and an end date.');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot be before start date.');
      return;
    }
    if (startDate < listing.availableFrom || endDate > listing.availableTo) {
      setError(
        `Dates must be between ${listing.availableFrom} and ${listing.availableTo}.`,
      );
      return;
    }
    if (conflictDate) {
      setError(
        `Selected range includes ${conflictDate}, which is already booked. Pick open dates.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await requestsService.create({
        listingId: listing.id,
        renterId: user.id,
        startDate,
        endDate,
        message,
      });
      showToast('Rental request sent to owner', 'success');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rk-request-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b101d] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#e63f24]" />
            <h2 id="rk-request-title" className="text-base font-medium">
              Request to Rent
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close request modal"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {listing.title}
          </div>

          {error && (
            <div className="rounded-xl border border-[#e63f24]/30 bg-[#e63f24]/10 px-3.5 py-2.5 text-sm text-[#e63f24]">
              {error}
            </div>
          )}

          {conflictDate && !error && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-300">
              Heads up: {conflictDate} is already booked. Choose non-overlapping dates.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                min={minDate}
                max={listing.availableTo}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (endDate < val) setEndDate(val);
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070a12] px-3.5 py-2.5 text-sm outline-none focus:border-[#e63f24]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || minDate}
                max={listing.availableTo}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070a12] px-3.5 py-2.5 text-sm outline-none focus:border-[#e63f24]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Message to Owner (Optional)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi! I'd love to pick this up at ${listing.pickupLocation}.`}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070a12] px-3.5 py-2.5 text-sm outline-none focus:border-[#e63f24]"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070a12] p-4 space-y-2 text-sm tabular-nums">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>
                ₹{listing.pricePerDay.toLocaleString('en-IN')} × {calculation.days} day
                {calculation.days === 1 ? '' : 's'}
              </span>
              <span>₹{calculation.rentalCost.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Refundable security deposit</span>
              <span>₹{listing.deposit.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-semibold text-slate-950 dark:text-white">
              <span>Total at campus handover</span>
              <span>₹{calculation.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !calculation.valid || Boolean(conflictDate)}
              className="px-5 py-2.5 rounded-xl bg-[#e63f24] hover:bg-[#cc3118] text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Rental Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
