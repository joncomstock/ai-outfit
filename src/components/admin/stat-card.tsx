interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
}

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="bg-surface-container-lowest p-6 ghost-border">
      <p className="label-text text-on-surface-variant tracking-widest mb-2">
        {label}
      </p>
      <p className="font-serif text-display-sm text-on-surface">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {detail && (
        <p className="text-body-md text-on-surface-variant mt-1">{detail}</p>
      )}
    </div>
  );
}
