import { useEffect, useState } from 'react';
import { authSupabase as adminSupabase } from '../lib/adminSupabase';
import { formatDate } from '../lib/formatters';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { Save, RefreshCw } from 'lucide-react';

interface AppSetting {
  key: string;
  enabled: boolean;
  message: string | null;
  link_href: string | null;
  link_label: string | null;
  updated_at: string | null;
}

export function AppSettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function loadSettings() {
    setLoading(true);
    const { data } = await adminSupabase
      .from('app_settings')
      .select('key, enabled, message, link_href, link_label, updated_at')
      .order('key');
    setSettings(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadSettings(); }, []);

  function updateField(key: string, field: keyof AppSetting, value: unknown) {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, [field]: value } : s));
  }

  async function saveSetting(setting: AppSetting) {
    setSaving(setting.key);
    setSaved(null);
    await adminSupabase
      .from('app_settings')
      .update({
        enabled: setting.enabled,
        message: setting.message,
        link_href: setting.link_href,
        link_label: setting.link_label,
        updated_at: new Date().toISOString(),
      })
      .eq('key', setting.key);
    setSaving(null);
    setSaved(setting.key);
    setTimeout(() => setSaved(null), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="page-header"><h1 className="page-title">App Settings</h1></div>
        <div className="grid grid-cols-1 gap-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="card p-6 skeleton h-48" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="page-header mb-0">
          <h1 className="page-title">App Settings</h1>
          <p className="page-subtitle">Global feature flags and messages</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadSettings}>
          <RefreshCw className="w-4 h-4" /> Reload
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settings.map(setting => (
          <Card key={setting.key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold font-mono">{setting.key}</h3>
                <Toggle
                  checked={setting.enabled}
                  onChange={val => updateField(setting.key, 'enabled', val)}
                  label={setting.enabled ? 'Enabled' : 'Disabled'}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Message</label>
                <Input
                  value={setting.message ?? ''}
                  onChange={e => updateField(setting.key, 'message', e.target.value || null)}
                  placeholder="Optional message..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Link Label</label>
                  <Input
                    value={setting.link_label ?? ''}
                    onChange={e => updateField(setting.key, 'link_label', e.target.value || null)}
                    placeholder="Button text..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Link Href</label>
                  <Input
                    value={setting.link_href ?? ''}
                    onChange={e => updateField(setting.key, 'link_href', e.target.value || null)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400">
                  Updated: {setting.updated_at ? formatDate(setting.updated_at) : 'Never'}
                </span>
                <Button
                  size="sm"
                  onClick={() => saveSetting(setting)}
                  disabled={saving === setting.key}
                >
                  {saving === setting.key ? (
                    <><RefreshCw className="w-3 h-3 animate-spin" /> Saving...</>
                  ) : saved === setting.key ? (
                    'Saved!'
                  ) : (
                    <><Save className="w-3 h-3" /> Save</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {settings.length === 0 && (
        <p className="text-slate-400 text-center py-12">No app settings found</p>
      )}
    </div>
  );
}
