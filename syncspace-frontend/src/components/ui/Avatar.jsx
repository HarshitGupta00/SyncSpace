// components/ui/Avatar.jsx
import { getInitials } from "../../utils";

// Deterministic background color based on name
const BG_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

const getColorClass = (name = "") => {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return BG_COLORS[sum % BG_COLORS.length];
};

const sizes = {
  xs: "w-6 h-6 text-2xs",
  sm: "w-7 h-7 text-xs",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
  xl: "w-12 h-12 text-md",
  "2xl": "w-16 h-16 text-xl",
};

const Avatar = ({ user, size = "md", className = "", showRing = false }) => {
  const name = user?.name || "";
  const avatar = user?.avatar;
  const initials = getInitials(name);
  const colorClass = getColorClass(name);
  const sizeClass = sizes[size] || sizes.md;

  return (
    <div
      className={`
        relative inline-flex items-center justify-center rounded-full
        font-semibold flex-shrink-0 select-none overflow-hidden
        ${sizeClass}
        ${showRing ? "ring-2 ring-surface" : ""}
        ${!avatar ? colorClass : ""}
        ${className}
      `}
      title={name}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
};

// Stack of avatars with overflow count — used in project cards, editor header
export const AvatarStack = ({ users = [], max = 4, size = "sm" }) => {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <Avatar
          key={user._id || i}
          user={user}
          size={size}
          showRing
          className="-ml-2 first:ml-0"
        />
      ))}
      {overflow > 0 && (
        <div
          className={`
            -ml-2 inline-flex items-center justify-center rounded-full
            bg-app border-2 border-surface text-tertiary font-semibold
            ${sizes[size]}
          `}
        >
          <span className="text-2xs">+{overflow}</span>
        </div>
      )}
    </div>
  );
};

export default Avatar;
