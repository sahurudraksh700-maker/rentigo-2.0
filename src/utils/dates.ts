export function parseIsoDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayIsoDate(): string {
  return formatIsoDate(new Date());
}

export function countInclusiveDays(startDate: string, endDate: string): number {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / 86400000) + 1;
}

export function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function expandDateRange(startDate: string, endDate: string): string[] {
  const out: string[] = [];
  const cur = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  let guard = 0;
  while (cur <= end && guard < 180) {
    out.push(formatIsoDate(cur));
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return out;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseIsoDate(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
