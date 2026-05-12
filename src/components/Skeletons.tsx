import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="surface-card rounded-xl p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function RowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <div className="grid gap-3 px-4 py-3 border-b border-border" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-4" />)}
    </div>
  );
}
