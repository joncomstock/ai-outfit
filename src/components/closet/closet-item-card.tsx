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
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="bg-surface-container-lowest text-left group w-full transition-shadow duration-200 hover:shadow-ambient"
    >
      <div className="aspect-[3/4] relative overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.subCategory ?? item.category ?? "Clothing item"}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {item.status === "error" && (
          <div className="absolute inset-0 bg-error/10 flex items-center justify-center">
            <Badge variant="error">Analysis Failed</Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-title-md text-on-surface capitalize">
          {item.subCategory ?? item.category ?? "Unknown"}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {item.colors?.slice(0, 4).map((color, i) => (
            <span
              key={i}
              className="w-4 h-4 inline-block"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        {item.styleTags && item.styleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.styleTags.slice(0, 3).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
