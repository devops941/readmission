import React from 'react';

interface PrintedFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PrintedField: React.FC<PrintedFieldProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink-2">
          {label}
        </label>
      )}
      <input className={`printed-field ${error ? '!border-risk-up' : ''} ${className}`} {...props} />
      {error && <span className="text-[11px] font-mono text-risk-up">{error}</span>}
    </div>
  );
};
