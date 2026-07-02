import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Server, MessageSquare, Zap, TrendingUp,
  FlaskConical, LogOut,
  Search, UserCircle, Activity, DollarSign, Cog, Menu, X, AlertTriangle,
  Copy
} from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import { authSupabase } from '../lib/adminSupabase';
import clsx from 'clsx';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: '',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
      { label: 'Copier Logs', to: '/copier-logs', icon: Copy },
    ],
  },
  {
    title: 'Users',
    items: [
      { label: 'All Users', to: '/users', icon: Users },
    ],
  },
  {
    title: 'Brokers',
    items: [
      { label: 'All Accounts', to: '/brokers', icon: Server },
      { label: 'Connection Errors', to: '/brokers/errors', icon: AlertTriangle },
    ],
  },
  {
    title: 'Telegram',
    items: [
      { label: 'Sessions', to: '/telegram/sessions', icon: MessageSquare },
      { label: 'Channels', to: '/telegram/channels', icon: MessageSquare },
      { label: 'Signal Profiles', to: '/telegram/profiles', icon: MessageSquare },
      { label: 'Auth Pending', to: '/telegram/auth-pending', icon: MessageSquare },
    ],
  },
  {
    title: 'Signals',
    items: [
      { label: 'All Signals', to: '/signals', icon: Zap },
      { label: 'Stats & Charts', to: '/signals/stats', icon: Zap },
    ],
  },
  {
    title: 'Trades',
    items: [
      { label: 'All Trades', to: '/trades', icon: TrendingUp },
      { label: 'Open Positions', to: '/trades/open', icon: TrendingUp },
      { label: 'Execution Logs', to: '/trades/execution-logs', icon: TrendingUp },
      { label: 'Analytics', to: '/trades/analytics', icon: TrendingUp },
    ],
  },
  {
    title: 'Backtesting',
    items: [
      { label: 'All Runs', to: '/backtests', icon: FlaskConical },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { label: 'Listener Events', to: '/monitoring/listener-events', icon: Activity },
      { label: 'Worker Leases', to: '/monitoring/workers', icon: Activity },
      { label: 'Dead Letters', to: '/monitoring/dead-letters', icon: Activity },
    ],
  },
  {
    title: 'Affiliates',
    items: [
      { label: 'Affiliate Profiles', to: '/affiliates', icon: DollarSign },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Trading Presets', to: '/presets', icon: Cog },
      { label: 'App Settings', to: '/settings', icon: Cog },
    ],
  },
];

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [globalSearch, setGlobalSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const adminName = sessionStorage.getItem('admin_display_name') ?? 'Admin';

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = globalSearch.trim();
    if (q) {
      navigate(`/users?search=${encodeURIComponent(q)}`);
      setGlobalSearch('');
    }
  }

  async function handleLogout() {
    await authSupabase.auth.signOut();
    sessionStorage.removeItem('admin_authed');
    sessionStorage.removeItem('admin_user_id');
    sessionStorage.removeItem('admin_display_name');
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shrink-0 transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <img src="/tscopier-light copy.png" alt="TScopier" className="h-7 w-auto block dark:hidden" />
          <img src="/tscopier-dark copy.png" alt="TScopier" className="h-7 w-auto hidden dark:block" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-3">
          {navigation.map((group, gi) => (
            <div key={gi} className={clsx(gi > 0 && 'mt-4')}>
              {group.title && (
                <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-100',
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-slate-200'
                        )
                      }
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2 px-2 py-1 mb-2">
            <UserCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-400 truncate font-medium">{adminName}</span>
          </div>
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-error-600 dark:hover:text-error-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center gap-3 px-4 lg:px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Search users..."
                className="input-base pl-10 py-1.5 text-sm"
              />
            </div>
          </form>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
