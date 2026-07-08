// components/layout/TopBar.jsx
import { Bell, HelpCircle, Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import useAuthStore from "../../store/useAuthStore";
import useUIStore from "../../store/useUIStore";

const TopBar = ({ title, actions }) => {
  const { user } = useAuthStore();
  const { openDrawer, drawers } = useUIStore();

  return (
    <header className="fixed top-0 left-sidebar right-0 h-topbar bg-surface border-b border-border z-20 flex items-center px-6 gap-4">

      {/* Global Search */}
      <button className="flex-1 max-w-md flex items-center gap-2.5 px-3.5 py-2 bg-app border border-border rounded-lg text-secondary text-sm hover:border-primary/30 transition-colors group">
        <Search size={14} className="flex-shrink-0" />
        <span className="flex-1 text-left">Search documents, projects, teams...</span>
        <kbd className="text-2xs bg-border text-tertiary px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notification Bell */}
        <button
          onClick={() => openDrawer("notifications")}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-secondary hover:bg-app hover:text-primary transition-colors"
        >
          <Bell size={18} />
          {/* Unread badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-red rounded-full border-2 border-surface" />
        </button>

        {/* Help */}
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-secondary hover:bg-app hover:text-primary transition-colors">
          <HelpCircle size={18} />
        </button>

        {/* Custom page actions (e.g. "+ New", "Share") */}
        {actions}

        {/* New button — primary CTA */}
        {!actions && (
          <Button size="sm" icon={Plus}>
            New
          </Button>
        )}

        {/* User avatar (rightmost) */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <Avatar user={user} size="sm" />
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-primary leading-none">{user?.name}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
