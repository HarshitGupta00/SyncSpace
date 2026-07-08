// components/ui/Skeleton.jsx
// Shimmer loading placeholders — shown while data is being fetched
// WHY skeletons over spinners: skeletons show the shape of upcoming content,
// reducing perceived loading time and layout shift.

const Skeleton = ({ className = "" }) => (
  <div
    className={`
      bg-gradient-to-r from-border via-app to-border
      bg-[length:200%_100%] animate-shimmer rounded-md
      ${className}
    `}
  />
);

// Pre-built skeletons for common patterns
export const StatCardSkeleton = () => (
  <div className="card flex flex-col gap-3">
    <Skeleton className="w-8 h-8 rounded-lg" />
    <Skeleton className="w-20 h-4" />
    <Skeleton className="w-16 h-8" />
    <Skeleton className="w-24 h-3" />
  </div>
);

export const DocumentRowSkeleton = () => (
  <div className="flex items-center gap-3 py-3 px-4">
    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
    <div className="flex-1 flex flex-col gap-1.5">
      <Skeleton className="w-48 h-4" />
      <Skeleton className="w-32 h-3" />
    </div>
    <Skeleton className="w-20 h-4" />
    <Skeleton className="w-16 h-4" />
  </div>
);

export const ProjectCardSkeleton = () => (
  <div className="card flex flex-col gap-4">
    <div className="flex items-start gap-3">
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-48 h-3" />
      </div>
    </div>
    <Skeleton className="w-full h-1.5 rounded-full" />
    <div className="flex items-center justify-between">
      <Skeleton className="w-16 h-6 rounded-full" />
      <Skeleton className="w-20 h-3" />
    </div>
  </div>
);

export const PageSkeleton = () => (
  <div className="p-8 flex flex-col gap-6">
    <div className="flex flex-col gap-2">
      <Skeleton className="w-48 h-8" />
      <Skeleton className="w-72 h-4" />
    </div>
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
    <div className="flex flex-col gap-2">
      {[...Array(5)].map((_, i) => <DocumentRowSkeleton key={i} />)}
    </div>
  </div>
);

export default Skeleton;
