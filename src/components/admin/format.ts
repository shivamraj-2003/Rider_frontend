// Small display helpers shared across the admin screens.

export const money = (n: number | null | undefined): string =>
  `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;

export const compactMoney = (n: number | null | undefined): string => {
  const v = n ?? 0;
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${Math.round(v)}`;
};

export const shortDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export const dateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const relativeTime = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

export const titleCase = (s: string): string =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Chart colour for a booking status (donut slices, bars).
export const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    completed: '#1F9D55',
    in_progress: '#1B4470',
    assigned: '#3B6EA5',
    arrived: '#5A8BC0',
    requested: '#E8792B',
    cancelled_by_customer: '#D14343',
    cancelled_by_rider: '#B23838',
    no_riders_found: '#8A98A6',
  };
  return map[status] ?? '#8A98A6';
};
