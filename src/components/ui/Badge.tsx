import clsx from 'clsx';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'muted';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300',
  success: 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300',
  error: 'bg-error-100 text-error-800 dark:bg-error-900/40 dark:text-error-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  muted: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
};

const dotClass: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  info: 'bg-blue-500',
  muted: 'bg-slate-400',
};

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span className={clsx('badge', variantClass[variant], className)}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotClass[variant])} />}
      {children}
    </span>
  );
}
