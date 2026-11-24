import { Camera, CheckCircle2, Flag, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const HANDOVER_STEPS = [
  {
    icon: MapPin,
    title: 'Meet on campus',
    description:
      'Pick a bright, familiar campus spot like the Central Library steps, Hostel 4 lobby, or Student Activity Centre during daytime hours.',
  },
  {
    icon: CheckCircle2,
    title: 'Check the item together',
    description:
      'Power on cameras, projectors, or audio gear on the spot. Verify lenses, chargers, cables, buttons, brakes, or garment zippers before paying.',
  },
  {
    icon: Camera,
    title: 'Take photos at handover',
    description:
      'Snap 2–3 quick timestamped photos of the item and any existing wear at pickup and again at return so the refundable deposit stays fair for both students.',
  },
];

const CHECKLIST = [
  'Confirm college ID or campus email before leaving the meeting spot.',
  'Agree clearly on return date, exact pickup location, and late-return rules in WhatsApp chat.',
  'Return refundable security deposit immediately once the item passes the return check.',
  'Never hand over original government IDs or bank PINs — keep deposits transparent and UPI-recorded.',
];

export function SafetyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#e63f24]">
          <ShieldCheck className="w-4 h-4" />
          <span>Campus Handover Protocol</span>
        </div>
        <h1 className="mt-2 text-3xl sm:text-5xl font-normal tracking-tight text-slate-950 dark:text-[#eceff4]">
          Safe rentals start at the library steps.
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          RentKaro connects classmates within the same college network. Follow these three habits on every pickup and return so deposits stay smooth and gear stays protected.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {HANDOVER_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#e63f24]/10 text-[#e63f24] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-400 tabular-nums">
                  0{index + 1}
                </span>
              </div>
              <h2 className="text-lg font-medium text-slate-950 dark:text-white">
                {step.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f1b] p-6 sm:p-8 mb-8">
        <h2 className="text-xl font-medium text-slate-950 dark:text-white">
          Quick handover checklist
        </h2>
        <ul className="mt-4 space-y-3">
          {CHECKLIST.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
            >
              <CheckCircle2 className="w-4 h-4 text-[#e63f24] mt-0.5 shrink-0" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b0f1b] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-slate-950 dark:text-white">
            Spot a suspicious listing or broken gear?
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Use the Report button on any item page to alert campus moderators right away.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/browse?report=1"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 hover:border-[#e63f24] transition-colors"
          >
            <Flag className="w-4 h-4 text-[#e63f24]" />
            <span>Report a Listing</span>
          </Link>
          <Link
            to="/browse"
            className="px-5 py-2.5 rounded-xl bg-[#e63f24] hover:bg-[#cc3118] text-white text-sm font-medium transition-colors"
          >
            Browse Rentals
          </Link>
        </div>
      </div>
    </main>
  );
}
