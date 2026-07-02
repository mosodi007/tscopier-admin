import { useEffect, useState } from 'react';
import { authSupabase as adminSupabase, fetchDisplayNames } from '../lib/adminSupabase';
import { formatCurrency } from '../lib/formatters';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { UserLink } from '../components/UserLink';
import { CHART_PALETTE, tooltipStyle, gridStyle, axisStyle } from '../lib/chartTheme';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

interface DailyPnL { date: string; pnl: number }
interface TopSymbol { symbol: string; count: number }
interface TopUser { user_id: string; display_name: string | null; pnl: number }

export function TradesAnalyticsPage() {
  const [dailyPnl, setDailyPnl] = useState<DailyPnL[]>([]);
  const [topSymbols, setTopSymbols] = useState<TopSymbol[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [{ data: closedTrades }, { data: symbolData }, { data: userData }] = await Promise.all([
        adminSupabase.from('trades').select('closed_at, profit').eq('status', 'closed').gte('closed_at', thirtyDaysAgo.toISOString()).not('profit', 'is', null),
        adminSupabase.from('trades').select('symbol').eq('status', 'closed').gte('closed_at', thirtyDaysAgo.toISOString()),
        adminSupabase.from('trades').select('user_id, profit').eq('status', 'closed').gte('closed_at', thirtyDaysAgo.toISOString()).not('profit', 'is', null),
      ]);

      // Daily P&L
      const pnlMap: Record<string, number> = {};
      (closedTrades ?? []).forEach((t: any) => {
        const date = t.closed_at?.slice(0, 10);
        if (date) pnlMap[date] = (pnlMap[date] ?? 0) + (t.profit ?? 0);
      });
      setDailyPnl(Object.keys(pnlMap).sort().map(date => ({ date, pnl: pnlMap[date] })));

      // Top symbols
      const symMap: Record<string, number> = {};
      (symbolData ?? []).forEach((t: any) => {
        if (t.symbol) symMap[t.symbol] = (symMap[t.symbol] ?? 0) + 1;
      });
      setTopSymbols(Object.entries(symMap).map(([symbol, count]) => ({ symbol, count })).sort((a, b) => b.count - a.count).slice(0, 15));

      // Top users by P&L
      const uniqueIds = [...new Set((userData ?? []).map((t: any) => t.user_id).filter(Boolean))];
      const displayNames = await fetchDisplayNames(uniqueIds);
      const userMap: Record<string, TopUser> = {};
      (userData ?? []).forEach((t: any) => {
        if (!t.user_id) return;
        if (!userMap[t.user_id]) {
          userMap[t.user_id] = { user_id: t.user_id, display_name: displayNames[t.user_id] ?? null, pnl: 0 };
        }
        userMap[t.user_id].pnl += t.profit ?? 0;
      });
      setTopUsers(Object.values(userMap).sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl)).slice(0, 10));

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="page-header"><h1 className="page-title">Trade Analytics</h1></div>
        <div className="grid grid-cols-1 gap-6">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-6 skeleton h-72" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Trade Analytics</h1>
        <p className="page-subtitle">Closed trade metrics, last 30 days</p>
      </div>

      <Card>
        <CardHeader><h3 className="text-sm font-semibold">Daily P&L (All Users Combined)</h3></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyPnl}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="date" {...axisStyle} tickFormatter={d => d.slice(5)} interval="preserveStartEnd" />
              <YAxis {...axisStyle} tickFormatter={v => formatCurrency(v)} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [formatCurrency(v as number), 'P&L']} />
              <ReferenceLine y={0} stroke="#334155" />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {dailyPnl.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h3 className="text-sm font-semibold">Top Symbols by Trade Count</h3></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(250, topSymbols.length * 28)}>
              <BarChart data={topSymbols} layout="vertical">
                <CartesianGrid {...gridStyle} />
                <XAxis type="number" {...axisStyle} />
                <YAxis type="category" dataKey="symbol" width={80} {...axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={CHART_PALETTE[0]} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-sm font-semibold">Top 10 Users by Realized P&L</h3></CardHeader>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>User</th><th>Total P&L</th></tr></thead>
              <tbody>
                {topUsers.length === 0 ? (
                  <tr><td colSpan={2} className="text-center py-8 text-slate-400">No data</td></tr>
                ) : topUsers.map(u => (
                  <tr key={u.user_id}>
                    <td><UserLink userId={u.user_id} displayName={u.display_name} /></td>
                    <td className={u.pnl >= 0 ? 'font-semibold text-success-600 dark:text-success-400' : 'font-semibold text-error-600 dark:text-error-400'}>
                      {formatCurrency(u.pnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
