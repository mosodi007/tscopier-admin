import { forwardRef } from 'react';
import clsx from 'clsx';

interface BaseInputProps {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

type InputProps = BaseInputProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof BaseInputProps>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'input-base',
              prefix && 'pl-9',
              suffix && 'pr-9',
              error && 'border-error-500 focus:ring-error-500',
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-slate-400 dark:text-slate-500 pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-error-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
