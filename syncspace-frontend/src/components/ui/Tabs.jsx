// components/ui/Tabs.jsx
// Reusable tab navigation — used in Team Workspace (All/My/Pending),
// Documents page, Whiteboard page, Editor right panel, etc.

import { motion } from "framer-motion";

const Tabs = ({ tabs, activeTab, onChange, className = "" }) => {
  return (
    <div className={`flex items-center gap-1 border-b border-border ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`
              relative px-3 py-2.5 text-sm font-medium transition-colors duration-150
              ${isActive ? "text-primary" : "text-secondary hover:text-primary"}
            `}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.count !== undefined && (
                <span className={`
                  text-2xs px-1.5 py-0.5 rounded-full font-semibold
                  ${isActive ? "bg-primary text-white" : "bg-app text-secondary"}
                `}>
                  {tab.count}
                </span>
              )}
            </span>

            {/* Active underline indicator */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
