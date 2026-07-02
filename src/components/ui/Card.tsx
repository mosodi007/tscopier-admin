import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className, hover, padding = 'none' }: CardProps) {
  return (
    <div className={clsx(hover ? 'card-hover' : 'card', paddingClass[padding], className)}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('px-6 py-4 border-b border-slate-200 dark:border-slate-700', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('p-6', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl', className)}>
      {children}
    </div>
  );
}
