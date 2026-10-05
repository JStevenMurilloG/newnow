const dateFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });
const longFmt = new Intl.DateTimeFormat('es', { dateStyle: 'long', timeStyle: 'short' });

export function timeAgo(input: string | number | Date, now = Date.now()): string {
  const t = new Date(input).getTime();
  if (Number.isNaN(t)) return '';
  const min = Math.floor((now - t) / 60_000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return dateFmt.format(t);
}

export function fullDate(input: string): string {
  const t = new Date(input);
  return Number.isNaN(t.getTime()) ? '' : longFmt.format(t);
}

const countFmt = new Intl.NumberFormat('es');
export const formatCount = (n: number) => countFmt.format(n);
