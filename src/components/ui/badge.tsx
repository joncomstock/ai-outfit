interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

const variantStyles = {
  default: "bg-surface-container-high text-on-surface",
  success: "bg-tertiary/10 text-tertiary",
  warning: "bg-primary-fixed text-primary",
  error: "bg-error-container text-error",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-label-md uppercase tracking-widest font-sans ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
