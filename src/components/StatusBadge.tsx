import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'pending';

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/15 text-red-400 border-red-500/30',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  default: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

export function StatusBadge({
  variant = 'default',
  children,
  className,
  pulse = false,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        pulse && 'animate-pulse',
        className
      )}
    >
      {pulse && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            variant === 'danger' && 'bg-red-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'success' && 'bg-emerald-400',
            variant === 'info' && 'bg-blue-400',
            variant === 'pending' && 'bg-amber-400',
            variant === 'default' && 'bg-slate-400'
          )}
        />
      )}
      {children}
    </span>
  );
}
