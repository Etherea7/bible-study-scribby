import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'glass';
}

export function Card({ children, className, variant = 'default' }: CardProps) {
  return (
    <div
      className={clsx(
        'card-premium',
        {
          'bg-[var(--bg-surface)]': variant === 'default',
          'bg-[var(--bg-elevated)]': variant === 'elevated',
          'bg-[var(--bg-surface)]/80 backdrop-blur-sm': variant === 'glass',
        },
        className
      )}
    >
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
    <div className={clsx('mb-4 pb-4 border-b border-[var(--border-color)]', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({ children, className, as: Component = 'h3' }: CardTitleProps) {
  return (
    <Component
      className={clsx(
        'font-semibold text-[var(--text-primary)] font-serif',
        Component === 'h2' ? 'text-xl' : 'text-lg',
        className
      )}
    >
      {children}
    </Component>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={clsx('text-[var(--text-secondary)] p-6', className)}>
      {children}
    </div>
  );
}
