import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface JsonViewerProps {
  data: unknown;
  collapsed?: boolean;
  label?: string;
  className?: string;
}

export function JsonViewer({ data, collapsed = true, label, className }: JsonViewerProps) {
  const [open, setOpen] = useState(!collapsed);

  if (data === null || data === undefined) {
    return <span className="text-slate-400 text-xs italic">null</span>;
  }

  const json = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const preview = typeof data === 'object'
    ? `{ ${Object.keys(data as object).slice(0, 3).join(', ')}${Object.keys(data as object).length > 3 ? '...' : ''} }`
    : String(data).slice(0, 60);

  return (
    <div className={clsx('font-mono text-xs', className)}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {label ?? (open ? 'Collapse' : preview)}
      </button>
      {open && (
        <pre className="mt-2 p-3 bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-lg overflow-x-auto max-h-64 text-xs leading-relaxed border border-slate-700 animate-fade-in">
          {json}
        </pre>
      )}
    </div>
  );
}
