import React from 'react';
import { Leaf } from 'lucide-react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'dark', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-base gap-1.5',
    md: 'text-xl gap-2',
    lg: 'text-2xl gap-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  const subColor = variant === 'light' ? 'text-emerald-400' : 'text-emerald-700';

  return (
    <div className={`flex items-center font-bold tracking-tight ${sizeClasses[size]} ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
        <Leaf className={`${iconSizes[size]} text-emerald-100`} />
      </div>
      <span className={`${textColor} whitespace-nowrap`}>
        Agro<span className={subColor}>Chain</span>
      </span>
    </div>
  );
};
