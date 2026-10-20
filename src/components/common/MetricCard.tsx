import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-emerald-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold tabular-nums ${
              trend.isPositive ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
