// components/ui/Badge.jsx
// Status and role pills — used throughout the app

const variants = {
  // Status
  "in_progress":  "bg-blue-50 text-blue-700",
  "completed":    "bg-green-50 text-green-700",
  "not_started":  "bg-gray-100 text-gray-600",
  "archived":     "bg-gray-100 text-gray-500",

  // Roles
  "owner":  "bg-primary text-white",
  "admin":  "bg-gray-800 text-white",
  "member": "bg-gray-100 text-gray-600",

  // Generic
  "blue":   "bg-blue-50 text-blue-700",
  "green":  "bg-green-50 text-green-700",
  "amber":  "bg-amber-50 text-amber-700",
  "red":    "bg-red-50 text-red-700",
  "gray":   "bg-gray-100 text-gray-600",
  "black":  "bg-primary text-white",
  "purple": "bg-violet-50 text-violet-700",
};

const Badge = ({ children, variant = "gray", className = "" }) => {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-xs font-medium capitalize
        ${variants[variant] || variants.gray}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
