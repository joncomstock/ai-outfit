import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClosetItem } from "@/db/schema/closet-items";

interface ClosetItemCardProps {
  item: ClosetItem;
  onClick?: () => void;
}

export function ClosetItemCard({ item, onClick }: ClosetItemCardProps) {
  if (item.status === "processing") {
    return (
      <div className="bg-surface-container-lowest">
        <Skeleton className="aspect-[3/4] w-full" />
        <div className="p-4">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  const displayName = item.subCategory ?? item.category ?? "Unknown";
  const season = item.seasonality?.length ? item.seasonality[0] : null;

  return (
    <button
      onClick={onClick}
      className="bg-surface-container-lowest text-left group w-full transition-shadow duration-200 hover:shadow-ambient"
    >
      <div className="aspect-[3/4] relative overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={displayName}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        {item.status === "error" && (
          <div className="absolute inset-0 bg-error/10 flex items-center justify-center">
            <Badge variant="error">Analysis Failed</Badge>
          </div>
        )}
        {/* Favorite icon on hover */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-on-surface/60 hover:text-primary transition-colors cursor-pointer">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="font-serif text-title-md text-on-surface capitalize">
          {displayName}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {item.category && (
            <span className="text-[10px] tracking-widest uppercase text-on-surface-variant font-sans">
              {item.category}
            </span>
          )}
          {season && (
            <>
              <span className="text-on-surface-variant/40 text-[10px]">
                /
              </span>
              <span className="text-[10px] tracking-widest uppercase text-on-surface-variant font-sans">
                {season}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
