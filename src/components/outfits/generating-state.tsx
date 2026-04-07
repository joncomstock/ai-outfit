export function GeneratingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      <div className="w-64 h-0.5 bg-surface-container-high overflow-hidden">
        <div className="h-full editorial-gradient animate-pulse w-1/2" />
      </div>
      <div className="text-center">
        <p className="font-serif text-headline-sm text-on-surface italic mb-2">Composing your look...</p>
        <p className="text-body-md text-on-surface-variant">Our AI stylist is curating the perfect combination from your wardrobe.</p>
      </div>
    </div>
  );
}
