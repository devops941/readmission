import React from 'react';

interface HighlightMarkProps {
  children: React.ReactNode;
  variant?: 'lime' | 'amber' | 'coral' | 'emerald';
  className?: string;
}

export const HighlightMark: React.FC<HighlightMarkProps> = ({
  children,
  variant = 'lime',
  className = ''
}) => {
  let markClass = 'marker-highlight';
  if (variant === 'amber') markClass = 'marker-highlight-amber';
  else if (variant === 'coral') markClass = 'marker-highlight-coral';
  else if (variant === 'emerald') markClass = 'marker-highlight-emerald';

  return <span className={`${markClass} ${className}`}>{children}</span>;
};
