// components/ui/Input.jsx
import { forwardRef } from "react";

const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  iconRight,
  className = "",
  containerClassName = "",
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-sm font-medium text-primary">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary">
            <Icon size={15} />
          </span>
        )}

        <input
          ref={ref}
          className={`
            w-full py-2.5 bg-surface border rounded-lg text-sm text-primary
            placeholder:text-tertiary transition-all duration-150
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-status-red focus:border-status-red focus:ring-status-red/10" : "border-border"}
            ${Icon ? "pl-9" : "pl-3"}
            ${iconRight ? "pr-9" : "pr-3"}
            ${className}
          `}
          {...props}
        />

        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary">
            {iconRight}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-status-red">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-tertiary">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";
export default Input;
