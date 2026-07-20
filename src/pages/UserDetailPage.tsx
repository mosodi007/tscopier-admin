import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, MessageSquare, Zap, TrendingUp, FlaskConical, Mail, Send, ScrollText } from 'lucide-react';
import { authSupabase as adminSupabase } from '../lib/adminSupabase';
import { formatDate, formatDateOnly, formatCurrency, formatRelative, truncate } from '../lib/formatters';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { StatusBadge } from '../components/StatusBadge';
import { JsonViewer } from '../components/JsonViewer';
import { Button } from '../components/ui/Button';

interface UserProfile {
  user_id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  base_currency: string | null;
  is_admin: boolean;
  admin_until: string | null;
  copier_paused: boolean | null;
  onboarding_completed_at: string | null;
  referred_by_user_id: string | null;
  email_verified_at: string | null;
  subscription_status: string | null;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  plan: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  extra_accounts: number;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
}

interface TelegramAccount {
  phone_number: string | null;
  is_active: boolean;
  listener_engine: string | null;
  created_at: string;
  telegram_user_id: string | null;
  linked_at: string | null;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="w-36 shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400 pt-0.5">{label}</span>
      <span className="text-sm text-slate-900 dark:text-slate-100">{value ?? '—'}</span>
    </div>
  );
}

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [telegram, setTelegram] = useState<TelegramAccount | null>(null);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [backtestCount, setBacktestCount] = useState(0);
  const [copierLogs, setCopierLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState<string | null>(null);
  const [emailResult, setEmailResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showEmailMenu, setShowEmailMenu] = useState(false);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  async function sendSubscriptionEmail(campaign: string) {
    setEmailSending(campaign);
    setEmailResult(null);
    setShowEmailMenu(false);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-subscription-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ user_id: userId, campaign }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailResult({ type: 'error', message: data.error || 'Failed to send email' });
      } else {
        setEmailResult({ type: 'success', message: `Sent "${campaign.replace(/_/g, ' ')}" email to ${data.email}` });
      }
    } catch (err) {
      setEmailResult({ type: 'error', message: (err as Error).message });
    } finally {
      setEmailSending(null);
    }
  }

  async function sendInvoiceDueEmail() {
    setEmailSending('invoice_due');
    setEmailResult(null);
    setShowEmailMenu(false);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-invoice-due-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailResult({ type: 'error', message: data.error || 'Failed to send invoice email' });
      } else {
        const amountMsg = data.amount_due ? ` ($${data.amount_due})` : '';
        setEmailResult({ type: 'success', message: `Sent invoice due email${amountMsg} to ${data.email}` });
      }
    } catch (err) {
      setEmailResult({ type: 'error', message: (err as Error).message });
    } finally {
      setEmailSending(null);
    }
  }

  useEffect(() => {
    if (!userId) return;
    async function load() {
      const [
        { data: prof },
        { data: sub },
        { data: brok },
        { data: chans },
        { data: sigs },
        { data: trds },
        { count: btCount },
        { data: tgSession },
        { data: tgClaim },
        { data: copierLogsRaw },
      ] = await Promise.all([
        adminSupabase.from('user_profiles').select('*').eq('user_id', userId!).maybeSingle(),
        adminSupabase.from('subscriptions').select('*').eq('user_id', userId!).maybeSingle(),
        adminSupabase.from('broker_accounts').select('id, label, platform, connection_status, last_balance').eq('user_id', userId!),
        adminSupabase.from('telegram_channels').select('id, display_name, channel_username, is_active, last_live_at').eq('user_id', userId!),
        adminSupabase.from('signals').select('id, status, raw_message, created_at, telegram_channels(display_name)').eq('user_id', userId!).order('created_at', { ascending: false }).limit(20),
        adminSupabase.from('trades').select('id, symbol, direction, status, profit, opened_at').eq('user_id', userId!).order('opened_at', { ascending: false }).limit(20),
        adminSupabase.from('backtest_runs').select('*', { count: 'exact', head: true }).eq('user_id', userId!),
        adminSupabase.from('telegram_sessions').select('phone_number, is_active, listener_engine, created_at').eq('user_id', userId!).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        adminSupabase.from('telegram_account_claims').select('telegram_user_id, linked_at').eq('user_id', userId!).maybeSingle(),
        adminSupabase.from('trade_execution_logs')
          .select('id, broker_account_id, signal_id, action, status, error_message, request_payload, response_payload, created_at')
          .eq('user_id', userId!)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      setProfile(prof as UserProfile);
      setSubscription(sub as Subscription);
      setTelegram(tgSession || tgClaim ? {
        phone_number: (tgSession as any)?.phone_number ?? null,
        is_active: (tgSession as any)?.is_active ?? false,
        listener_engine: (tgSession as any)?.listener_engine ?? null,
        created_at: (tgSession as any)?.created_at ?? (tgClaim as any)?.linked_at ?? '',
        telegram_user_id: (tgClaim as any)?.telegram_user_id?.toString() ?? null,
        linked_at: (tgClaim as any)?.linked_at ?? null,
      } : null);
      setBrokers(brok ?? []);
      setChannels(chans ?? []);
      setSignals(sigs ?? []);
      setTrades(trds ?? []);
      setBacktestCount(btCount ?? 0);
      setCopierLogs(copierLogsRaw ?? []);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-6 skeleton h-32" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-slate-400 text-center py-16">User not found</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="page-title">{profile.display_name ?? profile.user_id.slice(0, 8)}</h1>
          <p className="page-subtitle font-mono text-xs">{profile.user_id}</p>
        </div>
        {profile.is_admin && <StatusBadge status="active" />}

        <div className="ml-auto relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowEmailMenu(!showEmailMenu)}
            disabled={!!emailSending}
          >
            {emailSending ? (
              <>
                <Send className="w-4 h-4 animate-pulse" /> Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" /> Send Email
              </>
            )}
          </Button>

          {showEmailMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
              <button
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700"
                onClick={() => sendSubscriptionEmail('no_subscription_nudge')}
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">No Subscription Nudge</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Remind user to activate a plan</p>
              </button>
              <button
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                onClick={() => sendSubscriptionEmail('trial_expired')}
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">Trial Expired</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Notify that trial has ended</p>
              </button>
              {subscription?.status === 'past_due' && subscription?.stripe_customer_id && (
                <button
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700"
                  onClick={() => sendInvoiceDueEmail()}
                >
                  <span className="font-medium text-amber-700 dark:text-amber-400">Invoice Due</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Send overdue invoice reminder from billing</p>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {emailResult && (
        <div className={`px-4 py-3 rounded-lg text-sm ${
          emailResult.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {emailResult.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader><h3 className="text-sm font-semibold">Profile</h3></CardHeader>
          <CardContent className="p-4">
            <InfoRow label="Display Name" value={profile.display_name} />
            <InfoRow label="First / Last" value={[profile.first_name, profile.last_name].filter(Boolean).join(' ') || null} />
            <InfoRow label="Username" value={profile.username} />
            <InfoRow label="Country" value={profile.country} />
            <InfoRow label="City" value={profile.city} />
            <InfoRow label="Timezone" value={profile.timezone} />
            <InfoRow label="Base Currency" value={profile.base_currency} />
            <InfoRow label="Copier" value={profile.copier_paused ? <span className="text-warning-600 dark:text-warning-400 font-medium">Paused</span> : <span className="text-success-600 dark:text-success-400 font-medium">Active</span>} />
            <InfoRow label="Onboarded" value={profile.onboarding_completed_at ? formatDate(profile.onboarding_completed_at) : 'Not completed'} />
            <InfoRow label="Email Verified" value={profile.email_verified_at ? formatDate(profile.email_verified_at) : 'Not verified'} />
            <InfoRow label="Admin Until" value={profile.admin_until ? formatDateOnly(profile.admin_until) : (profile.is_admin ? 'Permanent' : '—')} />
            <InfoRow label="Referred By" value={profile.referred_by_user_id ? <span className="font-mono text-xs">{profile.referred_by_user_id.slice(0, 8)}...</span> : null} />
            <InfoRow label="Joined" value={formatDate(profile.created_at)} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Subscription */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold">Subscription</h3></CardHeader>
            <CardContent className="p-4">
              {subscription ? (
                <>
                  <InfoRow label="Plan" value={<StatusBadge status={subscription.plan} />} />
                  <InfoRow label="Status" value={<StatusBadge status={subscription.status} />} />
                  <InfoRow label="Extra Accounts" value={subscription.extra_accounts} />
                  <InfoRow label="Period End" value={formatDateOnly(subscription.current_period_end)} />
                  <InfoRow label="Trial Ends" value={formatDateOnly(subscription.trial_ends_at)} />
                  <InfoRow label="Stripe Customer" value={<span className="font-mono text-xs">{subscription.stripe_customer_id ?? '—'}</span>} />
                  <InfoRow label="Stripe Sub ID" value={<span className="font-mono text-xs break-all">{subscription.stripe_subscription_id ?? '—'}</span>} />
                </>
              ) : (
                <p className="text-slate-400 text-sm">No subscription</p>
              )}
            </CardContent>
          </Card>

          {/* Telegram Account */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold">Telegram Account</h3></CardHeader>
            <CardContent className="p-4">
              {telegram ? (
                <>
                  <InfoRow label="Phone" value={telegram.phone_number ? <span className="font-mono text-xs">{telegram.phone_number}</span> : null} />
                  <InfoRow label="Session Status" value={
                    telegram.is_active
                      ? <span className="text-success-600 dark:text-success-400 font-medium">Connected</span>
                      : <span className="text-warning-600 dark:text-warning-400 font-medium">Disconnected</span>
                  } />
                  <InfoRow label="Listener Engine" value={telegram.listener_engine} />
                  <InfoRow label="Telegram ID" value={telegram.telegram_user_id ? <span className="font-mono text-xs">{telegram.telegram_user_id}</span> : null} />
                  <InfoRow label="Linked At" value={telegram.linked_at ? formatDate(telegram.linked_at) : null} />
                  <InfoRow label="Session Created" value={telegram.created_at ? formatDate(telegram.created_at) : null} />
                </>
              ) : (
                <p className="text-slate-400 text-sm">No Telegram account connected</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: Server, label: 'Broker Accounts', value: brokers.length },
          { icon: MessageSquare, label: 'Telegram Channels', value: channels.length },
          { icon: Zap, label: 'Signals (recent)', value: signals.length },
          { icon: TrendingUp, label: 'Trades (recent)', value: trades.length },
          { icon: ScrollText, label: 'Copier Logs', value: copierLogs.length },
          { icon: FlaskConical, label: 'Backtests', value: backtestCount },
        ].map(stat => (
          <div key={stat.label} className="stat-card text-center">
            <stat.icon className="w-5 h-5 mx-auto text-primary-500 mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Broker accounts */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold">Broker Accounts ({brokers.length})</h3></CardHeader>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Label</th><th>Platform</th><th>Status</th><th>Balance</th></tr></thead>
            <tbody>
              {brokers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-slate-400">No broker accounts</td></tr>
              ) : brokers.map((b: any) => (
                <tr key={b.id}>
                  <td className="font-medium">{b.label}</td>
                  <td>{b.platform}</td>
                  <td><StatusBadge status={b.connection_status} /></td>
                  <td>{formatCurrency(b.last_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Telegram channels */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold">Telegram Channels ({channels.length})</h3></CardHeader>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Name</th><th>Username</th><th>Active</th><th>Last Live</th></tr></thead>
            <tbody>
              {channels.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-slate-400">No channels</td></tr>
              ) : channels.map((c: any) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.display_name}</td>
                  <td className="text-slate-500">{c.channel_username}</td>
                  <td><StatusBadge status={c.is_active ? 'active' : 'inactive'} /></td>
                  <td className="text-xs text-slate-400">{formatDate(c.last_live_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent signals */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold">Recent Signals (last 20)</h3></CardHeader>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Status</th><th>Channel</th><th>Message</th><th>Created</th></tr></thead>
            <tbody>
              {signals.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-slate-400">No signals</td></tr>
              ) : signals.map((s: any) => (
                <tr key={s.id} className="cursor-pointer" onClick={() => setExpandedSignalId(prev => prev === s.id ? null : s.id)}>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="text-xs text-slate-500">{(s.telegram_channels as any)?.display_name ?? '—'}</td>
                  <td className="max-w-xs text-xs text-slate-500">
                    {expandedSignalId === s.id ? (
                      <pre className="whitespace-pre-wrap break-words text-xs text-slate-700 dark:text-slate-300 font-sans max-w-lg">{s.raw_message ?? '—'}</pre>
                    ) : (
                      truncate(s.raw_message, 60)
                    )}
                  </td>
                  <td className="text-xs text-slate-400">{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent trades */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold">Recent Trades (last 20)</h3></CardHeader>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Symbol</th><th>Direction</th><th>Status</th><th>P&L</th><th>Opened</th></tr></thead>
            <tbody>
              {trades.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-slate-400">No trades</td></tr>
              ) : trades.map((t: any) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.symbol}</td>
                  <td><StatusBadge status={t.direction} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className={t.profit != null ? (t.profit >= 0 ? 'text-success-600 dark:text-success-400 font-medium' : 'text-error-600 dark:text-error-400 font-medium') : ''}>
                    {formatCurrency(t.profit)}
                  </td>
                  <td className="text-xs text-slate-400">{formatDate(t.opened_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Copier Logs */}
      <Card>
        <CardHeader><h3 className="text-sm font-semibold">Copier Logs (last 30)</h3></CardHeader>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Time</th><th>Action</th><th>Status</th><th>Error</th><th>Signal ID</th></tr></thead>
            <tbody>
              {copierLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-slate-400">No copier logs</td></tr>
              ) : copierLogs.map((log: any) => (
                <tr
                  key={log.id}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  onClick={() => setExpandedLogId(prev => prev === log.id ? null : log.id)}
                >
                  <td className="text-xs text-slate-400 whitespace-nowrap">{formatRelative(log.created_at)}</td>
                  <td><span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">{log.action}</span></td>
                  <td><StatusBadge status={log.status} dot /></td>
                  <td className="text-xs text-error-500 max-w-[200px] truncate">{log.error_message ?? '—'}</td>
                  <td className="text-xs text-slate-400 font-mono">{log.signal_id ? truncate(log.signal_id, 8) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {expandedLogId && (() => {
            const log = copierLogs.find((l: any) => l.id === expandedLogId);
            if (!log) return null;
            return (
              <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Signal ID</p>
                    <p className="text-slate-700 dark:text-slate-300 font-mono">{log.signal_id ?? '—'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Broker Account</p>
                    <p className="text-slate-700 dark:text-slate-300 font-mono">{log.broker_account_id ? truncate(log.broker_account_id, 12) : '—'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Timestamp</p>
                    <p className="text-slate-700 dark:text-slate-300">{formatDate(log.created_at)}</p>
                  </div>
                </div>
                {log.error_message && (
                  <div>
                    <p className="text-xs font-semibold text-error-500 mb-1">Error Message</p>
                    <pre className="text-xs text-error-500 whitespace-pre-wrap break-all bg-white dark:bg-slate-900 p-3 rounded-lg border border-error-200 dark:border-error-800">{log.error_message}</pre>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Request Payload</p>
                    <JsonViewer data={log.request_payload} collapsed={false} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Response Payload</p>
                    <JsonViewer data={log.response_payload} collapsed={false} />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </Card>
    </div>
  );
}
