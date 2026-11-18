import React from 'react';

interface FoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'lime';
  children: React.ReactNode;
}

export const FoldButton: React.FC<FoldButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  let baseClass = 'fold-button';
  if (variant === 'outline') {
    baseClass = 'fold-button-outline';
  } else if (variant === 'lime') {
    baseClass = 'fold-button !bg-lime !text-ink hover:!bg-lime-strong';
  }

  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
};
