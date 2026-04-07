import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "editorial-gradient text-on-primary label-text px-8 py-3 hover:opacity-90 transition-opacity duration-150",
  secondary:
    "bg-transparent ghost-border text-on-surface label-text px-8 py-3 hover:bg-surface-container-low transition-colors duration-150",
  tertiary:
    "bg-transparent text-primary underline underline-offset-4 decoration-1 label-text px-2 py-1 hover:opacity-80 transition-opacity duration-150",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-sans min-h-[44px] ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
