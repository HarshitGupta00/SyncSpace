// styles/animations.js
// Shared Framer Motion variants used across modals, drawers, dropdowns.
// WHY centralized: consistent animation feel across all overlays —
// changing one value here updates every modal/drawer simultaneously.

// Modal — fade + scale up from center
export const modalVariants = {
  hidden:  { opacity: 0, scale: 0.96, y: 4 },
  visible: { opacity: 1, scale: 1,    y: 0,
             transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, scale: 0.96, y: 4,
             transition: { duration: 0.1,  ease: "easeIn" } },
};

// Overlay backdrop — fade
export const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit:    { opacity: 0, transition: { duration: 0.1  } },
};

// Right drawer — slide in from right
export const drawerVariants = {
  hidden:  { opacity: 0, x: "100%" },
  visible: { opacity: 1, x: 0,
             transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, x: "100%",
             transition: { duration: 0.15, ease: "easeIn" } },
};

// Dropdown / popover — scale in from top
export const dropdownVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: -4 },
  visible: { opacity: 1, scale: 1,    y: 0,
             transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, scale: 0.95, y: -4,
             transition: { duration: 0.08, ease: "easeIn" } },
};

// Page content — fade + slide up
export const pageVariants = {
  hidden:  { opacity: 0, y: 8  },
  visible: { opacity: 1, y: 0,
             transition: { duration: 0.2, ease: "easeOut" } },
};

// Stagger container — for lists of cards animating in sequence
export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04 } },
};

// Individual stagger child item
export const staggerItem = {
  hidden:  { opacity: 0, y: 8  },
  visible: { opacity: 1, y: 0,
             transition: { duration: 0.2, ease: "easeOut" } },
};

// Toast notification — slide in from right
export const toastVariants = {
  hidden:  { opacity: 0, x: 40, scale: 0.95 },
  visible: { opacity: 1, x: 0,  scale: 1,
             transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, x: 40, scale: 0.95,
             transition: { duration: 0.15, ease: "easeIn" } },
};
