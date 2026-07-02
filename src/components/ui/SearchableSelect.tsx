import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import clsx from 'clsx';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function SearchableSelect({ options, value, onChange, placeholder = 'Select...', label, className }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={clsx('relative', className)} ref={containerRef}>
      {label && <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="input-base flex items-center justify-between gap-2 cursor-pointer text-left"
      >
        <span className={selected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={clsx('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full card shadow-card-lg max-h-60 overflow-hidden flex flex-col animate-fade-in">
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="input-base pl-7 py-1.5 text-xs"
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            {placeholder && (
              <button
                onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                className="w-full px-3 py-2 text-sm text-left text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                {placeholder}
              </button>
            )}
            {filtered.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                className="w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                {opt.label}
                {opt.value === value && <Check className="w-3.5 h-3.5 text-primary-600" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-400">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
