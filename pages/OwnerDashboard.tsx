import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import {
  fetchOwnerStats,
  fetchActivityChart,
  fetchCostBreakdown,
  fetchSessionHealth,
  fetchRecentSessions,
  fetchUserCosts,
  type OwnerStats,
  type ActivityChart,
  type CostBreakdown,
  type SessionHealth,
  type RecentSession,
  type UserCost,
} from '../services/ownerApi';
import {
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

// --- Date range types ---
interface DateRange {
  label: string;
  startDate: string;
  endDate: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function nDaysAgoStr(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}
function yesterdayStr(): string {
  return nDaysAgoStr(1);
}

const PRESETS: DateRange[] = [
  { label: 'Today',          startDate: todayStr(),       endDate: todayStr() },
  { label: 'Yesterday',      startDate: yesterdayStr(),   endDate: yesterdayStr() },
  { label: 'Last 7 days',    startDate: nDaysAgoStr(7),   endDate: todayStr() },
  { label: 'Last 14 days',   startDate: nDaysAgoStr(14),  endDate: todayStr() },
  { label: 'Last 30 days',   startDate: nDaysAgoStr(30),  endDate: todayStr() },
  { label: 'Last 90 days',   startDate: nDaysAgoStr(90),  endDate: todayStr() },
  { label: 'Last 12 months', startDate: nDaysAgoStr(365), endDate: todayStr() },
];

const DEFAULT_RANGE = PRESETS[4];

// --- Date Range Picker ---
function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.startDate);
  const [customEnd, setCustomEnd] = useState(value.endDate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  function applyCustom() {
    if (!customStart || !customEnd) return;
    const start = customStart <= customEnd ? customStart : customEnd;
    const end = customStart <= customEnd ? customEnd : customStart;
    onChange({ label: `${start} – ${end}`, startDate: start, endDate: end });
    setOpen(false);
  }

  function selectPreset(p: DateRange) {
    onChange(p);
    setCustomStart(p.startDate);
    setCustomEnd(p.endDate);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
      >
        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="truncate max-w-[140px] sm:max-w-none">{value.label}</span>
        <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 sm:left-auto sm:right-0 sm:w-[420px] top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Presets */}
            <div className="sm:w-40 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700 py-2 flex flex-wrap sm:flex-col gap-0">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => selectPreset(p)}
                  className={`text-left px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    value.label === p.label
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {/* Custom range */}
            <div className="flex-1 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Custom range</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">From</label>
                  <input type="date" value={customStart} max={customEnd || todayStr()} onChange={e => setCustomStart(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">To</label>
                  <input type="date" value={customEnd} min={customStart} max={todayStr()} onChange={e => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={applyCustom} disabled={!customStart || !customEnd}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helpers ---
function fmt(n: number): string { return n.toLocaleString(); }
function fmtDollars(n: number): string { return `$${n.toFixed(4)}`; }
function fmtDollars2(n: number): string { return `$${n.toFixed(2)}`; }
function pct(part: number, total: number): number { return total === 0 ? 0 : Math.round((part / total) * 100); }
function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}
function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return id.slice(0, 10) + '...';
}

// --- KPI Card ---
function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-tight">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

/** Plan badge for owner user-cost table and detail modal */
function SubscriptionTierBadge({ user }: { user: UserCost }) {
  const tier = user.subscriptionTier ?? 'free';
  const paying = user.isPayingSubscriber ?? false;
  const status = user.subscriptionStatus ?? '';
  const label = tier === 'basic' ? 'Basic' : tier === 'premium' ? 'Premium' : 'Free';
  const paidButInactive =
    (tier === 'basic' || tier === 'premium') && !paying && status && status !== 'active' && status !== 'trialing';
  const color = paying
    ? tier === 'premium'
      ? 'bg-violet-200 text-violet-900 dark:bg-violet-800 dark:text-violet-100 ring-1 ring-violet-400/60 dark:ring-violet-500/50'
      : 'bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100 ring-1 ring-indigo-400/60 dark:ring-indigo-500/50'
    : tier === 'premium'
      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
      : tier === 'basic'
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  return (
    <span className="inline-flex flex-wrap items-center gap-1 mt-1">
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${color}`}
        title={status ? `Stripe: ${status}` : undefined}
      >
        {label}
      </span>
      {paidButInactive ? (
        <span className="text-[10px] text-slate-400 dark:text-slate-500 normal-case font-medium">{status}</span>
      ) : null}
    </span>
  );
}

// --- Progress bar ---
function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const p = pct(value, total);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">{fmt(value)} ({p}%)</span>
      </div>
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

// --- User Detail Modal ---
function UserDetailModal({
  user,
  sessions,
  onClose,
}: {
  user: UserCost;
  sessions: RecentSession[];
  onClose: () => void;
}) {
  const userSessions = sessions.filter(s => s.userId === user.userId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const services = [
    {
      label: 'Speaking Practice',
      count: user.speakingSessions,
      unit: 'sessions',
      cost: user.speakingCost,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Oral Evaluation',
      count: user.oralEvals,
      unit: 'evals',
      cost: user.oralEvalCost,
      color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    },
    {
      label: 'Written Evaluation',
      count: user.writtenEvals,
      unit: 'evals',
      cost: user.writtenEvalCost,
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Daily ritual',
      count: user.dailyRitualEvents,
      unit: 'calls',
      cost: user.dailyRitualCost,
      color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200',
    },
    {
      label: 'Guided writing',
      count: user.guidedWritingEvents,
      unit: 'calls',
      cost: user.guidedWritingCost,
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
    },
    {
      label: 'Other AI (titles, etc.)',
      count: user.otherEvents,
      unit: 'calls',
      cost: user.otherAiCost,
      color: 'bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (!ref.current?.contains(e.target as Node)) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={ref}
        className="relative bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.userEmail}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">{user.userId}</p>
            <SubscriptionTierBadge user={user} />
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Total cost pill */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Total AI cost</span>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{fmtDollars2(user.totalCost)}</span>
          </div>

          {/* Service breakdown cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {services.map(svc => (
              <div key={svc.label} className={`rounded-xl p-3 space-y-1 ${svc.color}`}>
                <p className="text-xs font-semibold leading-tight">{svc.label}</p>
                <p className="text-lg font-bold">{fmt(svc.count)}</p>
                <p className="text-xs opacity-80">{svc.unit}</p>
                <p className="text-xs font-semibold">{fmtDollars2(svc.cost)}</p>
                {svc.count > 0 && (
                  <p className="text-xs opacity-70">avg {fmtDollars2(svc.cost / svc.count)}</p>
                )}
              </div>
            ))}
          </div>

          {/* Recent speaking sessions */}
          {userSessions.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Speaking Sessions ({userSessions.length})
              </h3>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {userSessions.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{s.examType}</td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDuration(s.duration)}</td>
                        <td className="px-3 py-2"><StatusBadge status={s.status} /></td>
                        <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{fmtDollars(s.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Status badge ---
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    abandoned:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    failed:     'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
      {status}
    </span>
  );
}

export function OwnerDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const isOwner = user?.id === import.meta.env.VITE_OWNER_USER_ID;

  const [dateRange, setDateRange]   = useState<DateRange>(DEFAULT_RANGE);
  const [stats, setStats]           = useState<OwnerStats | null>(null);
  const [activity, setActivity]     = useState<ActivityChart | null>(null);
  const [costs, setCosts]           = useState<CostBreakdown | null>(null);
  const [health, setHealth]         = useState<SessionHealth | null>(null);
  const [sessions, setSessions]     = useState<RecentSession[]>([]);
  const [userCosts, setUserCosts]   = useState<UserCost[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [pageTab, setPageTab]       = useState<'overview' | 'sessions' | 'users'>('overview');
  const [sessionTab, setSessionTab] = useState<'overview' | 'tokens'>('overview');
  const [userSort, setUserSort]     = useState<{ key: keyof UserCost; dir: 'asc' | 'desc' }>({ key: 'totalCost', dir: 'desc' });
  const [selectedUser, setSelectedUser] = useState<UserCost | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const gt = async () => getToken();
    const { startDate, endDate } = dateRange;
    try {
      const [s, a, c, h, r, uc] = await Promise.all([
        fetchOwnerStats(gt, startDate, endDate),
        fetchActivityChart(gt, startDate, endDate),
        fetchCostBreakdown(gt, startDate, endDate),
        fetchSessionHealth(gt),
        fetchRecentSessions(gt, 50, startDate, endDate),
        fetchUserCosts(gt, startDate, endDate),
      ]);
      setStats(s); setActivity(a); setCosts(c);
      setHealth(h); setSessions(r); setUserCosts(uc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, getToken]);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  if (!isOwner) return <Navigate to="/dashboard" replace />;

  // --- Build chart data ---
  const activityChartData = activity
    ? activity.labels.map((date, i) => ({
        date: date.slice(5),
        Speaking: activity.speaking[i],
        Evaluations: activity.evaluations[i],
        Signups: activity.newSignups[i],
      }))
    : [];

  const costChartData = costs
    ? costs.labels.map((date, i) => ({
        date: date.slice(5),
        Speaking: costs.speaking?.[i] ?? 0,
        'Oral Eval': costs.oralEval?.[i] ?? 0,
        'Written Eval': costs.writtenEval?.[i] ?? 0,
        'Daily ritual': costs.dailyRitual?.[i] ?? 0,
        'Guided writing': costs.guidedWriting?.[i] ?? 0,
        'Other AI': costs.otherAi?.[i] ?? 0,
      }))
    : [];

  const taskUsage = stats
    ? [
        { name: 'Speaking',    count: stats.activity.speakingSessions },
        { name: 'Evaluations', count: stats.activity.evaluations },
        { name: 'Writing',     count: stats.activity.writingFeedback },
        { name: 'Mock Exams',  count: stats.activity.mockExams },
      ].sort((a, b) => b.count - a.count)
    : [];
  const maxTaskCount = taskUsage.length > 0 ? taskUsage[0].count : 1;

  const subTotal  = stats ? stats.subscriptions.free + stats.subscriptions.basic + stats.subscriptions.premium : 0;
  const costTotal = stats ? stats.cost.total : 0;
  const costItems = stats
    ? [
        { label: 'Speaking (Live)', amount: stats.cost.speaking ?? 0,       color: 'bg-indigo-500' },
        { label: 'Oral Eval',       amount: stats.cost.oralEval ?? 0,      color: 'bg-violet-500' },
        { label: 'Written Eval',    amount: stats.cost.writtenEval ?? 0,   color: 'bg-fuchsia-500' },
        { label: 'Daily ritual',    amount: stats.cost.dailyRitual ?? 0,   color: 'bg-teal-500' },
        { label: 'Guided writing',  amount: stats.cost.guidedWriting ?? 0, color: 'bg-amber-500' },
        { label: 'Other AI',        amount: stats.cost.otherAi ?? 0,       color: 'bg-stone-500' },
      ]
    : [];
  const healthTotal = health ? health.completed + health.abandoned + health.failed : 0;

  // --- Users tab helpers ---
  const sortedUsers = [...userCosts].sort((a, b) => {
    const av = a[userSort.key] as number;
    const bv = b[userSort.key] as number;
    return userSort.dir === 'desc' ? bv - av : av - bv;
  });
  function SortTh({ col, label, className = '' }: { col: keyof UserCost; label: string; className?: string }) {
    const active = userSort.key === col;
    return (
      <th
        className={`px-3 sm:px-6 py-3 text-right cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 min-w-[56px] ${className}`}
        onClick={() => setUserSort(prev => ({ key: col, dir: prev.key === col && prev.dir === 'desc' ? 'asc' : 'desc' }))}
      >
        <span className="inline-flex items-center justify-end gap-1">
          {label}
          {active && <span className="text-indigo-500 text-xs">{userSort.dir === 'desc' ? '↓' : '↑'}</span>}
        </span>
      </th>
    );
  }
  const userTotals = sortedUsers.reduce(
    (acc, u) => ({
      speakingSessions: acc.speakingSessions + u.speakingSessions,
      speakingCost:     acc.speakingCost     + u.speakingCost,
      oralEvals:        acc.oralEvals        + u.oralEvals,
      oralEvalCost:     acc.oralEvalCost     + u.oralEvalCost,
      writtenEvals:     acc.writtenEvals     + u.writtenEvals,
      writtenEvalCost:  acc.writtenEvalCost  + u.writtenEvalCost,
      dailyRitualCost:  acc.dailyRitualCost  + u.dailyRitualCost,
      guidedWritingCost: acc.guidedWritingCost + u.guidedWritingCost,
      otherEvents:      acc.otherEvents      + u.otherEvents,
      otherAiCost:      acc.otherAiCost      + u.otherAiCost,
      totalCost:        acc.totalCost        + u.totalCost,
    }),
    {
      speakingSessions: 0,
      speakingCost: 0,
      oralEvals: 0,
      oralEvalCost: 0,
      writtenEvals: 0,
      writtenEvalCost: 0,
      dailyRitualCost: 0,
      guidedWritingCost: 0,
      otherEvents: 0,
      otherAiCost: 0,
      totalCost: 0,
    }
  );

  return (
    <DashboardLayout>
      <main className="max-w-7xl mx-auto p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6">

        {/* ── Top bar ── */}
        <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 shrink-0">Owner Dashboard</h1>
            <div className="flex gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {(['overview', 'sessions', 'users'] as const).map(tab => (
                <button key={tab} onClick={() => setPageTab(tab)}
                  className={`px-2 sm:px-3 py-1 text-xs font-bold rounded capitalize transition-colors ${
                    pageTab === tab
                      ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end sm:justify-start">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 text-rose-700 dark:text-rose-300 text-sm">
            {error}
            <button onClick={load} className="ml-3 underline font-medium">Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        )}

        {!loading && stats && (
          <>
            {/* ── KPI Cards — always visible ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              <KpiCard label="Total Users"      value={fmt(stats.users.total)}  sub={`${fmt(stats.users.d2c)} D2C / ${fmt(stats.users.org)} Org`} />
              <KpiCard label="Active Subs"      value={fmt(stats.subscriptions.basic + stats.subscriptions.premium)} />
              <KpiCard label="Basic"            value={fmt(stats.subscriptions.basic)} />
              <KpiCard label="Premium"          value={fmt(stats.subscriptions.premium)} />
              <KpiCard label="Speaking"         value={fmt(stats.activity.speakingSessions)} />
              <KpiCard label="AI Cost"          value={fmtDollars2(stats.cost.total)} sub={dateRange.label} />
            </div>

            {/* ══ OVERVIEW TAB ══ */}
            {pageTab === 'overview' && <>

              {/* Activity Chart */}
              {activity && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Activity — {dateRange.label}</h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={activityChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={28} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="Speaking"    stroke="#6366f1" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Evaluations" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      <Bar dataKey="Signups" fill="#34d399" opacity={0.6} barSize={10} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Usage + Subscriptions */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Usage by Task Type</h2>
                  <div className="space-y-3">
                    {taskUsage.map(t => (
                      <div key={t.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-300">{t.name}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{fmt(t.count)}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct(t.count, maxTaskCount)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Subscription Breakdown</h2>
                  <div className="space-y-3">
                    <ProgressBar label="Free"    value={stats.subscriptions.free}    total={subTotal} color="bg-slate-400" />
                    <ProgressBar label="Basic"   value={stats.subscriptions.basic}   total={subTotal} color="bg-indigo-500" />
                    <ProgressBar label="Premium" value={stats.subscriptions.premium} total={subTotal} color="bg-violet-500" />
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    <p>Canceled: {fmt(stats.subscriptions.canceled)}</p>
                  </div>
                </div>
              </div>

              {/* AI Cost Breakdown */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">AI Cost Breakdown</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {costItems.map(item => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                          <span className="text-slate-500 dark:text-slate-400">{fmtDollars2(item.amount)} ({pct(item.amount, costTotal)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct(item.amount, costTotal)}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-bold text-slate-700 dark:text-slate-200">
                      <span>Total</span><span>{fmtDollars2(costTotal)}</span>
                    </div>
                  </div>
                  {costs && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Cost Trend — {dateRange.label}</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={costChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={v => `$${v}`} width={32} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }} formatter={(v: number) => fmtDollars(v)} />
                          <Legend wrapperStyle={{ fontSize: 9 }} iconSize={8} />
                          <Line type="monotone" dataKey="Speaking"    stroke="#6366f1" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="Oral Eval"   stroke="#8b5cf6" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="Written Eval" stroke="#d946ef" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="Daily ritual" stroke="#14b8a6" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="Guided writing" stroke="#f59e0b" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="Other AI" stroke="#78716c" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Health */}
              {health && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">
                    Speaking Session Health <span className="text-slate-400 dark:text-slate-500 font-normal">(current month)</span>
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <ProgressBar label="Completed" value={health.completed} total={healthTotal} color="bg-emerald-500" />
                      <ProgressBar label="Abandoned"  value={health.abandoned}  total={healthTotal} color="bg-amber-500" />
                      <ProgressBar label="Failed"     value={health.failed}     total={healthTotal} color="bg-rose-500" />
                    </div>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'Avg Duration',          value: fmtDuration(health.avgDurationSeconds) },
                        { label: 'Avg Tokens / Session',  value: fmt(health.avgTokensPerSession) },
                        { label: 'Total Cost (this month)',value: fmtDollars2(health.totalCostThisMonth) },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">{r.label}</span>
                          <span className="text-slate-700 dark:text-slate-200 font-medium">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>}

            {/* ══ SESSIONS TAB ══ */}
            {pageTab === 'sessions' && <>

              {/* AI Model Reference */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">AI Model Reference</h2>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <table className="w-full text-xs min-w-[480px]">
                    <thead>
                      <tr className="text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
                        <th className="pb-2 pr-3">Model</th>
                        <th className="pb-2 pr-3">Feature</th>
                        <th className="pb-2 pr-3 hidden sm:table-cell">Where</th>
                        <th className="pb-2 pr-3 hidden sm:table-cell">In $/1M</th>
                        <th className="pb-2 pr-3 hidden sm:table-cell">Out $/1M</th>
                        <th className="pb-2">Tracked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {[
                        { model: 'gemini-3.1-flash-live-preview', feature: 'Oral exam live session',              where: 'Browser WS',   inPrice: '$3.00 (audio)',  outPrice: '$12.00 (audio)', tracked: true  },
                        { model: 'gemini-2.5-flash',              feature: 'Oral eval + transcription',          where: 'Server worker', inPrice: '$1.00 (audio)', outPrice: '$2.50',          tracked: true  },
                        { model: 'gemini-2.5-flash',              feature: 'Written expression eval',           where: 'Server worker', inPrice: '$0.30',          outPrice: '$2.50',          tracked: true  },
                        { model: 'gemini-2.5-flash',              feature: 'Daily ritual deck generation',      where: 'Server',        inPrice: '$0.30',          outPrice: '$2.50',          tracked: false },
                        { model: 'gemini-2.5-flash',              feature: 'Guided writing feedback',           where: 'Browser',       inPrice: '$0.30',          outPrice: '$2.50',          tracked: false },
                        { model: 'gemini-2.5-flash',              feature: 'Assignment title generation',       where: 'Server',        inPrice: '$0.30',          outPrice: '$2.50',          tracked: false },
                        { model: 'gemini-2.5-flash',              feature: 'Reading/Listening Q generation',   where: 'CLI',           inPrice: '$0.30',          outPrice: '$2.50',          tracked: false },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="py-2 pr-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap max-w-[120px] sm:max-w-none truncate">{row.model}</td>
                          <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{row.feature}</td>
                          <td className="py-2 pr-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell whitespace-nowrap">{row.where}</td>
                          <td className="py-2 pr-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell whitespace-nowrap">{row.inPrice}</td>
                          <td className="py-2 pr-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell whitespace-nowrap">{row.outPrice}</td>
                          <td className="py-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${row.tracked ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                              {row.tracked ? 'tracked' : 'not'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Speaking Sessions Table */}
              {sessions.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-4 md:px-6 md:py-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Speaking Sessions</h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">gemini-3.1-flash-live-preview · audio in $3/1M · audio out $12/1M · {dateRange.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:hidden">{dateRange.label}</p>
                    </div>
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1 self-start">
                      {(['overview', 'tokens'] as const).map(tab => (
                        <button key={tab} onClick={() => setSessionTab(tab)}
                          className={`px-3 py-1 text-xs font-semibold rounded capitalize transition-colors ${
                            sessionTab === tab
                              ? 'bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-100 shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {sessionTab === 'overview' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[420px]">
                        <thead>
                          <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
                            <th className="px-4 sm:px-6 py-3">User</th>
                            <th className="px-4 sm:px-6 py-3 hidden md:table-cell">Started</th>
                            <th className="px-4 sm:px-6 py-3 hidden sm:table-cell">Type</th>
                            <th className="px-4 sm:px-6 py-3">Duration</th>
                            <th className="px-4 sm:px-6 py-3">Status</th>
                            <th className="px-4 sm:px-6 py-3 text-right">Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {sessions.map((s, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                              <td className="px-4 sm:px-6 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 max-w-[120px] sm:max-w-[200px] truncate">{s.userEmail || truncateId(s.userId)}</td>
                              <td className="px-4 sm:px-6 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap hidden md:table-cell">{new Date(s.startedAt).toLocaleString()}</td>
                              <td className="px-4 sm:px-6 py-3 text-slate-600 dark:text-slate-300 text-xs hidden sm:table-cell">{s.examType}</td>
                              <td className="px-4 sm:px-6 py-3 text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">{fmtDuration(s.duration)}</td>
                              <td className="px-4 sm:px-6 py-3"><StatusBadge status={s.status} /></td>
                              <td className="px-4 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">{fmtDollars(s.cost)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <>
                      {/* Mobile: card list */}
                      <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                        {sessions.map((s, i) => {
                          const inCost  = s.billedPromptTokens * 0.000003;
                          const outCost = s.completionTokens * 0.000012;
                          return (
                            <div key={i} className="p-4 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs text-slate-600 dark:text-slate-300 truncate">{s.userEmail || truncateId(s.userId)}</span>
                                <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 shrink-0">{fmtDollars(s.cost)}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                <span>Turns: <span className="text-slate-700 dark:text-slate-300">{fmt(s.turns)}</span></span>
                                <span>In tokens: <span className="text-slate-700 dark:text-slate-300">{fmt(s.billedPromptTokens)}</span></span>
                                <span>Out tokens: <span className="text-slate-700 dark:text-slate-300">{fmt(s.completionTokens)}</span></span>
                                <span>In cost: <span className="text-slate-700 dark:text-slate-300">{fmtDollars(inCost)}</span></span>
                                <span>Out cost: <span className="text-slate-700 dark:text-slate-300">{fmtDollars(outCost)}</span></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Desktop: table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
                              <th className="px-4 sm:px-6 py-3">User</th>
                              <th className="px-4 sm:px-6 py-3">Type</th>
                              <th className="px-4 sm:px-6 py-3 text-right">Turns</th>
                              <th className="px-4 sm:px-6 py-3 text-right">Billed In Tokens</th>
                              <th className="px-4 sm:px-6 py-3 text-right">Out Tokens</th>
                              <th className="px-4 sm:px-6 py-3 text-right">In Cost</th>
                              <th className="px-4 sm:px-6 py-3 text-right">Out Cost</th>
                              <th className="px-4 sm:px-6 py-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {sessions.map((s, i) => {
                              const inCost  = s.billedPromptTokens * 0.000003;
                              const outCost = s.completionTokens * 0.000012;
                              return (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                  <td className="px-4 sm:px-6 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 max-w-[160px] truncate">{s.userEmail || truncateId(s.userId)}</td>
                                  <td className="px-4 sm:px-6 py-3 text-slate-600 dark:text-slate-300 text-xs">{s.examType}</td>
                                  <td className="px-4 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300">{fmt(s.turns)}</td>
                                  <td className="px-4 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300">{fmt(s.billedPromptTokens)}</td>
                                  <td className="px-4 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300">{fmt(s.completionTokens)}</td>
                                  <td className="px-4 sm:px-6 py-3 text-right text-slate-500 dark:text-slate-400 text-xs">{fmtDollars(inCost)}</td>
                                  <td className="px-4 sm:px-6 py-3 text-right text-slate-500 dark:text-slate-400 text-xs">{fmtDollars(outCost)}</td>
                                  <td className="px-4 sm:px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">{fmtDollars(s.cost)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 text-xs font-bold text-slate-600 dark:text-slate-300">
                              <td className="px-4 sm:px-6 py-2" colSpan={2}>Totals ({sessions.length})</td>
                              <td className="px-4 sm:px-6 py-2 text-right">{fmt(sessions.reduce((a, s) => a + s.turns, 0))}</td>
                              <td className="px-4 sm:px-6 py-2 text-right">{fmt(sessions.reduce((a, s) => a + s.billedPromptTokens, 0))}</td>
                              <td className="px-4 sm:px-6 py-2 text-right">{fmt(sessions.reduce((a, s) => a + s.completionTokens, 0))}</td>
                              <td className="px-4 sm:px-6 py-2 text-right">{fmtDollars(sessions.reduce((a, s) => a + s.billedPromptTokens * 0.000003, 0))}</td>
                              <td className="px-4 sm:px-6 py-2 text-right">{fmtDollars(sessions.reduce((a, s) => a + s.completionTokens * 0.000012, 0))}</td>
                              <td className="px-4 sm:px-6 py-2 text-right">{fmtDollars(sessions.reduce((a, s) => a + s.cost, 0))}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>}

            {/* ══ USERS TAB ══ */}
            {pageTab === 'users' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 md:px-6 md:py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Cost per User</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {sortedUsers.length} users · {dateRange.label} · tap column to sort · paid Basic (indigo) / Premium (violet) rows are highlighted
                  </p>
                </div>
                <div className="overflow-x-auto">
                  {sortedUsers.length === 0 ? (
                    <p className="px-6 py-8 text-sm text-slate-400 dark:text-slate-500">No activity in this date range.</p>
                  ) : (
                    <table className="w-full text-sm min-w-[320px]">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
                          <th className="px-3 sm:px-6 py-3">User</th>
                          <SortTh col="speakingSessions" label="Sessions" />
                          <SortTh col="speakingCost"     label="Speak $"  className="hidden sm:table-cell" />
                          <SortTh col="oralEvals"        label="Oral"     className="hidden md:table-cell" />
                          <SortTh col="oralEvalCost"     label="Oral $"   className="hidden md:table-cell" />
                          <SortTh col="writtenEvals"     label="Written"  className="hidden md:table-cell" />
                          <SortTh col="writtenEvalCost"  label="Written $" className="hidden md:table-cell" />
                          <SortTh col="dailyRitualCost"  label="Ritual $" className="hidden xl:table-cell" />
                          <SortTh col="guidedWritingCost" label="Guide $" className="hidden xl:table-cell" />
                          <SortTh col="otherAiCost"      label="Misc $" className="hidden xl:table-cell" />
                          <SortTh col="totalCost"        label="Total $" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {sortedUsers.map((u, i) => (
                          <tr
                            key={i}
                            className={`cursor-pointer border-l-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                              u.isPayingSubscriber
                                ? u.subscriptionTier === 'premium'
                                  ? 'border-l-violet-500 bg-violet-50/40 dark:bg-violet-950/20'
                                  : 'border-l-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                                : 'border-l-transparent'
                            }`}
                            onClick={() => setSelectedUser(u)}
                          >
                            <td className="px-3 sm:px-6 py-3 min-w-0 max-w-[140px] sm:max-w-[220px]">
                              <div className="font-mono text-xs text-slate-600 dark:text-slate-300 truncate">{u.userEmail}</div>
                              <SubscriptionTierBadge user={u} />
                            </td>
                            <td className="px-3 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300">{fmt(u.speakingSessions)}</td>
                            <td className="px-3 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300 hidden sm:table-cell">{fmtDollars(u.speakingCost)}</td>
                            <td className="px-3 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300 hidden md:table-cell">{fmt(u.oralEvals)}</td>
                            <td className="px-3 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300 hidden md:table-cell">{fmtDollars(u.oralEvalCost)}</td>
                            <td className="px-3 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300 hidden md:table-cell">{fmt(u.writtenEvals)}</td>
                            <td className="px-3 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300 hidden md:table-cell">{fmtDollars(u.writtenEvalCost)}</td>
                            <td className="px-3 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300 hidden xl:table-cell">{fmtDollars(u.dailyRitualCost)}</td>
                            <td className="px-3 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300 hidden xl:table-cell">{fmtDollars(u.guidedWritingCost)}</td>
                            <td className="px-3 sm:px-6 py-3 text-right text-slate-600 dark:text-slate-300 hidden xl:table-cell">{fmtDollars(u.otherAiCost)}</td>
                            <td className="px-3 sm:px-6 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">{fmtDollars(u.totalCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 text-xs font-bold text-slate-600 dark:text-slate-300">
                          <td className="px-3 sm:px-6 py-2">Totals ({sortedUsers.length})</td>
                          <td className="px-3 sm:px-6 py-2 text-right">{fmt(userTotals.speakingSessions)}</td>
                          <td className="px-3 sm:px-6 py-2 text-right hidden sm:table-cell">{fmtDollars(userTotals.speakingCost)}</td>
                          <td className="px-3 sm:px-6 py-2 text-right hidden md:table-cell">{fmt(userTotals.oralEvals)}</td>
                          <td className="px-3 sm:px-6 py-2 text-right hidden md:table-cell">{fmtDollars(userTotals.oralEvalCost)}</td>
                          <td className="px-3 sm:px-6 py-2 text-right hidden md:table-cell">{fmt(userTotals.writtenEvals)}</td>
                          <td className="px-3 sm:px-6 py-2 text-right hidden md:table-cell">{fmtDollars(userTotals.writtenEvalCost)}</td>
                          <td className="px-3 sm:px-6 py-2 text-right hidden xl:table-cell">{fmtDollars(userTotals.dailyRitualCost)}</td>
                          <td className="px-3 sm:px-6 py-2 text-right hidden xl:table-cell">{fmtDollars(userTotals.guidedWritingCost)}</td>
                          <td className="px-3 sm:px-6 py-2 text-right hidden xl:table-cell">{fmtDollars(userTotals.otherAiCost)}</td>
                          <td className="px-3 sm:px-6 py-2 text-right">{fmtDollars(userTotals.totalCost)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          sessions={sessions}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </DashboardLayout>
  );
}
