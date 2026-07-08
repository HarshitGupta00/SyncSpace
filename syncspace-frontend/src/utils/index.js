// utils/index.js — all small utility functions in one place

// Get initials from a name — used for avatar fallbacks
// "Harshit Verma" → "HV", "Priya" → "P"
export const getInitials = (name = "") => {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
};

// Format relative time — "2m ago", "5h ago", "3d ago"
export const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000); // seconds

  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// Format file size — "2.4 MB", "850 KB"
export const formatFileSize = (bytes) => {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1048576)     return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

// Generate a deterministic color for a user based on their ID
// Used for live cursor labels — same user always gets the same color
const CURSOR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9",
];
export const getCursorColor = (userId = "") => {
  // Sum the char codes of userId to get a consistent index
  const sum = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CURSOR_COLORS[sum % CURSOR_COLORS.length];
};

// Truncate long text with ellipsis — "Long document title that..." 
export const truncate = (str, maxLength = 40) => {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "...";
};

// Debounce — limit how often a function runs
// Used for auto-save and document indexing triggers
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// Build query string from an object
export const buildQuery = (params) => {
  return Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
};
