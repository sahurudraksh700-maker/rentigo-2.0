import { Package } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listingsService } from '../services/listingsService';
import type { Listing, UserProfile } from '../types/rentkaro';

interface ListingCardProps {
  listing: Listing;
  owner?: UserProfile | null;
}

export function ListingCard({ listing, owner }: ListingCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const rentedToday = listingsService.isRentedTodaySync(listing.id);
  const statusLabel = listing.isPaused
    ? 'Paused'
    : rentedToday
      ? 'Rented'
      : 'Available';

  const statusClasses = listing.isPaused
    ? 'bg-slate-900/80 text-slate-200 border-slate-700'
    : rentedToday
      ? 'bg-[#e63f24]/90 text-white border-[#e63f24]'
      : 'bg-emerald-950/85 text-emerald-200 border-emerald-700/60';

  const primaryPhoto = listing.photos[0];

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0b0f1b] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-[#0f1524]">
        {primaryPhoto && !imgFailed ? (
          <img
            src={primaryPhoto}
            alt={listing.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 text-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#101728] dark:to-[#080b14]">
            <Package className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
              {listing.title}
            </span>
          </div>
        )}
        <span
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-md border text-[11px] font-medium tracking-wide backdrop-blur-sm ${statusClasses}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-slate-900 dark:text-[#eceff4] leading-snug line-clamp-2 group-hover:text-[#e63f24] transition-colors">
            {listing.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{listing.category}</span>
            <span aria-hidden="true">·</span>
            <span>{listing.condition}</span>
            <span aria-hidden="true">·</span>
            <span>{owner?.firstName ?? 'Student'}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-baseline justify-between gap-2 tabular-nums">
          <div className="text-sm font-semibold text-slate-950 dark:text-white">
            ₹{listing.pricePerDay.toLocaleString('en-IN')}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              /day
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            ₹{listing.deposit.toLocaleString('en-IN')} deposit
          </div>
        </div>
      </div>
    </Link>
  );
}
