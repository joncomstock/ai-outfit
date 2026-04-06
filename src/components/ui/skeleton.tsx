interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-surface-container-high animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}
