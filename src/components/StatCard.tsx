import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon?: ReactNode;
  color?: 'teal' | 'amber' | 'red' | 'blue';
  suffix?: string;
  description?: string;
}

const colorMap = {
  teal: {
    bg: 'bg-teal-500/10',
    icon: 'text-teal-400',
    border: 'border-teal-500/20',
    value: 'text-teal-300',
  },
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-400',
    border: 'border-amber-500/20',
    value: 'text-amber-300',
  },
  red: {
    bg: 'bg-red-500/10',
    icon: 'text-red-400',
    border: 'border-red-500/20',
    value: 'text-red-300',
  },
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    border: 'border-blue-500/20',
    value: 'text-blue-300',
  },
};

export function StatCard({
  title,
  value,
  change,
  icon,
  color = 'teal',
  suffix,
  description,
}: StatCardProps) {
  const colors = colorMap[color];
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={cn(
        'bg-slate-800/50 backdrop-blur rounded-xl border p-6 transition-all duration-300 hover:bg-slate-800 hover:border-slate-700 hover:shadow-lg hover:-translate-y-0.5',
        colors.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={cn('text-3xl font-bold tracking-tight', colors.value)}>
              {value}
            </span>
            {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
          </div>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-red-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive ? 'text-red-400' : 'text-emerald-400'
                )}
              >
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500">较上月</span>
            </div>
          )}
          {description && <p className="mt-2 text-xs text-slate-500">{description}</p>}
        </div>
        {icon && (
          <div className={cn('p-3 rounded-xl', colors.bg)}>
            <div className={colors.icon}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}
