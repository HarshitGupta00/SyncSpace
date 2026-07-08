// components/collaboration/LiveCursor.jsx
// Renders a colored cursor label for a collaborator on the whiteboard canvas.
// For document editors, TipTap's CollaborationCursor extension handles this natively.

import { motion } from "framer-motion";

const LiveCursor = ({ x, y, name, color }) => (
  <motion.div
    className="absolute pointer-events-none z-50 flex items-center gap-0"
    animate={{ x, y }}
    transition={{ duration: 0.08, ease: "linear" }} // smooth cursor follow
    style={{ left: 0, top: 0 }}
  >
    {/* Cursor arrow */}
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
      <path d="M0 0L0 14L4 10L7 18L9 17L6 9L11 9L0 0Z" fill={color} stroke="#fff" strokeWidth="1" />
    </svg>

    {/* Name label */}
    <div
      className="text-2xs font-semibold text-white px-1.5 py-0.5 rounded whitespace-nowrap ml-0.5"
      style={{ background: color, borderRadius: "4px" }}
    >
      {name}
    </div>
  </motion.div>
);

export default LiveCursor;
