import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authSupabase as adminSupabase } from '../lib/adminSupabase';
import { formatDateOnly, shortId } from '../lib/formatters';
import { DataTable, Pagination } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { UserLink } from '../components/UserLink';
import { ExportButton } from '../components/ExportButton';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Search, X, AlertTriangle } from 'lucide-react';
import type { Column } from '../components/DataTable';

interface UserRow {
  user_id: string;
  display_name: string | null;
  country: string | null;
  timezone: string | null;
  is_admin: boolean;
  copier_paused: boolean | null;
  subscription_status: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  plan: string | null;
  sub_status: string | null;
}

const PAGE_SIZE = 50;

export function UsersPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [subStatus, setSubStatus] = useState('');
  const [data, setData] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setPage(1); }, [search, subStatus]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    (async () => {
      // Fetch profiles page
      let q = adminSupabase
        .from('user_profiles')
        .select('user_id, display_name, country, timezone, is_admin, copier_paused, subscription_status, onboarding_completed_at, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search.trim()) {
        q = q.or(`display_name.ilike.%${search.trim()}%,user_id.ilike.%${search.trim()}%`);
      }

      const { data: profiles, count, error: profileErr } = await q;
      if (cancelled) return;
      if (profileErr) { setError(profileErr.message); setLoading(false); return; }

      const userIds = (profiles ?? []).map((p: any) => p.user_id);

      // Fetch subscriptions separately
      let subs: Record<string, { plan: string | null; status: string | null }> = {};
      if (userIds.length > 0) {
        const { data: subRows } = await adminSupabase
          .from('subscriptions')
          .select('user_id, plan, status')
          .in('user_id', userIds);
        (subRows ?? []).forEach((s: any) => {
          subs[s.user_id] = { plan: s.plan, status: s.status };
        });
      }

      let mapped: UserRow[] = (profiles ?? []).map((r: any) => ({
        user_id: r.user_id,
        display_name: r.display_name,
        country: r.country,
        timezone: r.timezone,
        is_admin: r.is_admin,
        copier_paused: r.copier_paused,
        subscription_status: r.subscription_status,
        onboarding_completed_at: r.onboarding_completed_at,
        created_at: r.created_at,
        plan: subs[r.user_id]?.plan ?? null,
        sub_status: subs[r.user_id]?.status ?? null,
      }));

      // Client-side sub_status filter (count already reflects profiles, not subs)
      if (subStatus) {
        mapped = mapped.filter(r => r.sub_status === subStatus);
      }

      if (cancelled) return;
      setData(mapped);
      setTotal(count ?? 0);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [page, search, subStatus]);

  const columns: Column<UserRow>[] = [
    {
      key: 'display_name',
      label: 'User',
      render: r => <UserLink userId={r.user_id} displayName={r.display_name} />,
    },
    {
      key: 'user_id',
      label: 'User ID',
      render: r => <span className="font-mono text-xs text-slate-400">{shortId(r.user_id)}</span>,
    },
    { key: 'country', label: 'Country', render: r => r.country || '—' },
    {
      key: 'plan',
      label: 'Plan',
      render: r => r.plan ? <StatusBadge status={r.plan} /> : <span className="text-slate-400 text-xs">—</span>,
    },
    {
      key: 'sub_status',
      label: 'Sub Status',
      render: r => r.sub_status ? <StatusBadge status={r.sub_status} /> : <span className="text-slate-400 text-xs">—</span>,
    },
    {
      key: 'copier_paused',
      label: 'Copier',
      render: r => r.copier_paused
        ? <span className="badge bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300 text-xs">Paused</span>
        : <span className="text-success-600 dark:text-success-400 text-xs font-medium">Active</span>,
    },
    {
      key: 'onboarding_completed_at',
      label: 'Onboarded',
      render: r => r.onboarding_completed_at
        ? <span className="text-success-600 dark:text-success-400 text-xs">Yes</span>
        : <span className="text-slate-400 text-xs">No</span>,
    },
    {
      key: 'is_admin',
      label: 'Admin',
      render: r => r.is_admin ? <StatusBadge status="active" /> : <span className="text-slate-400 text-xs">—</span>,
    },
    { key: 'created_at', label: 'Joined', sortable: true, render: r => formatDateOnly(r.created_at) },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="page-header mb-0">
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{total.toLocaleString()} total users</p>
        </div>
        <ExportButton data={data} filename="users" />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="filter-bar rounded-xl">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by name or user ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            prefix={<Search className="w-3.5 h-3.5" />}
            suffix={search ? (
              <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
            ) : null}
          />
        </div>
        <Select
          options={[
            { value: 'active', label: 'Active' },
            { value: 'trialing', label: 'Trialing' },
            { value: 'past_due', label: 'Past Due' },
            { value: 'canceled', label: 'Canceled' },
          ]}
          value={subStatus}
          onChange={e => setSubStatus(e.target.value)}
          placeholder="All Statuses"
          className="w-40"
        />
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          rowKey={r => r.user_id}
        />
        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          totalCount={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
