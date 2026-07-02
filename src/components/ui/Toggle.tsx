import clsx from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, label, disabled, size = 'md' }: ToggleProps) {
  const trackClass = size === 'sm' ? 'w-8 h-4' : 'w-10 h-5';
  const thumbClass = size === 'sm' ? 'w-3 h-3 translate-x-0.5' : 'w-4 h-4 translate-x-0.5';
  const thumbOnClass = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

  return (
    <label className={clsx('flex items-center gap-2 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          trackClass,
          checked ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
        )}
      >
        <span
          className={clsx(
            'inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
            thumbClass,
            checked && thumbOnClass
          )}
        />
      </button>
      {label && <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>}
    </label>
  );
}
