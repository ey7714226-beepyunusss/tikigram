import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn('w-6 h-6 animate-spin text-primary', className)} />;
}

export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <LoadingSpinner />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-2 w-16 bg-muted rounded" />
        </div>
      </div>
      <div className="aspect-square w-full bg-muted rounded-xl" />
      <div className="h-3 w-3/4 bg-muted rounded" />
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="aspect-square bg-muted animate-pulse" />
      ))}
    </div>
  );
}
