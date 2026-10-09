// Simple pulse-animated placeholder blocks, used while data is loading
// instead of a plain "Loading..." line — makes the layout feel alive and
// previews the shape of what's about to appear.
export const SkeletonBlock = ({ className = '' }) => (
  <div className={`skeleton-shimmer rounded-xl bg-slate-200/70 dark:bg-white/5 ${className}`} />
);

export const ProjectCardSkeleton = () => (
  <div className="card space-y-3 p-5">
    <div className="flex items-center justify-between">
      <SkeletonBlock className="h-2.5 w-2.5 rounded-full" />
      <SkeletonBlock className="h-4 w-4" />
    </div>
    <SkeletonBlock className="h-5 w-2/3" />
    <SkeletonBlock className="h-3 w-full" />
    <SkeletonBlock className="h-1.5 w-full rounded-full" />
  </div>
);

export const StatCardSkeleton = () => (
  <div className="card flex items-center gap-4 p-4">
    <SkeletonBlock className="h-11 w-11 rounded-xl" />
    <div className="flex-1 space-y-2">
      <SkeletonBlock className="h-5 w-10" />
      <SkeletonBlock className="h-3 w-16" />
    </div>
  </div>
);

export const TaskCardSkeleton = () => (
  <div className="card space-y-2.5 p-3.5">
    <SkeletonBlock className="h-4 w-4/5" />
    <SkeletonBlock className="h-3 w-full" />
    <SkeletonBlock className="h-3 w-1/3" />
  </div>
);
