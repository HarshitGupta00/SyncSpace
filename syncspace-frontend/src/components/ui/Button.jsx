// components/ui/Button.jsx
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const variants = {
  primary:   "bg-primary text-white hover:bg-accent-hover",
  secondary: "bg-surface text-primary border border-border hover:bg-app",
  ghost:     "text-secondary hover:bg-app hover:text-primary",
  danger:    "bg-status-red text-white hover:opacity-90",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-md gap-2",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight,
  className = "",
  onClick,
  type = "button",
  ...props
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={`
        inline-flex items-center justify-center font-semibold rounded-lg
        transition-colors duration-150 cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === "sm" ? 13 : 15} />
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="ml-auto">{iconRight}</span>
      )}
    </motion.button>
  );
};

export default Button;
