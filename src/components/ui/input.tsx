import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="label-text text-on-surface-variant">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-transparent border-b border-outline-variant/20 px-0 py-2 text-body-lg text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none transition-colors duration-200 ${error ? "border-error" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-body-md text-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
