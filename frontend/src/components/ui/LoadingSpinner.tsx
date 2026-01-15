import { clsx } from 'clsx';
import { BookOpen } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-[var(--border-color)] border-t-[var(--color-observation)]',
        {
          'h-4 w-4': size === 'sm',
          'h-8 w-8': size === 'md',
          'h-12 w-12': size === 'lg',
        },
        className
      )}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Generating study guide...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-main)]/80 backdrop-blur-sm">
      <div className="card-premium p-8 flex flex-col items-center gap-5 max-w-sm mx-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 animate-pulse-subtle">
            <div className="w-16 h-16 rounded-full bg-[var(--color-observation)]/10" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-[var(--color-observation)] animate-pulse-subtle" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-[var(--text-primary)] font-medium font-serif">{message}</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">This may take a moment</p>
        </div>
      </div>
    </div>
  );
}
