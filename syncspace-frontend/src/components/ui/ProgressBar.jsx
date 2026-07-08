// components/ui/ProgressBar.jsx
import { motion } from "framer-motion";

const ProgressBar = ({ value = 0, className = "", showLabel = false }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
    {showLabel && (
      <span className="text-xs text-secondary font-medium w-8 text-right flex-shrink-0">
        {value}%
      </span>
    )}
  </div>
);

export default ProgressBar;
