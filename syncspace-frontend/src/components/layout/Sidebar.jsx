// components/layout/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FolderOpen, Users, FileText, Layout,
  Sparkles, Inbox, Trash2, Star, ChevronDown,
  Settings, LogOut, Plus
} from "lucide-react";
import Avatar from "../ui/Avatar";
import useAuthStore from "../../store/useAuthStore";
import useWorkspaceStore from "../../store/useWorkspaceStore";
import useUIStore from "../../store/useUIStore";
import { dropdownVariants } from "../../styles/animations";
import { useState } from "react";

const NAV_ITEMS = [
  { icon: Home,      label: "Home",        to: "/dashboard"   },
  { icon: FolderOpen,label: "Projects",    to: "/projects"    },
  { icon: Users,     label: "Teams",       to: "/teams"       },
  { icon: FileText,  label: "Documents",   to: "/documents"   },
  { icon: Layout,    label: "Whiteboards", to: "/whiteboards" },
  { icon: Sparkles,  label: "AI Assistant",to: "/ai"          },
];

const FAVORITES = [
  { label: "Product Roadmap" },
  { label: "Marketing Plan"  },
  { label: "Design System"   },
];

const Sidebar = () => {
  const { user, teams, logout } = useAuthStore();
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const { openModal } = useUIStore();
  const navigate = useNavigate();

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = activeWorkspace?.name || "Personal Space";
  const displayInitials = activeWorkspace
    ? activeWorkspace.name.slice(0, 2).toUpperCase()
    : user?.name?.slice(0, 2).toUpperCase() || "ME";

  return (
    <aside className="fixed top-0 left-0 h-screen w-sidebar bg-surface border-r border-border flex flex-col z-30">

      {/* ── Logo ── */}
      <div className="px-4 py-4 flex items-center gap-2.5 border-b border-border flex-shrink-0">
        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">S</span>
        </div>
        <span className="font-bold text-primary text-md tracking-tight">SyncSpace</span>
      </div>

      {/* ── Workspace Switcher ── */}
      <div className="px-3 py-2 border-b border-border flex-shrink-0 relative">
        <button
          onClick={() => setWorkspaceOpen((p) => !p)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-app transition-colors"
        >
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xs font-bold">{displayInitials}</span>
          </div>
          <span className="text-sm font-semibold text-primary flex-1 text-left truncate">
            {displayName}
          </span>
          <ChevronDown size={14} className={`text-tertiary flex-shrink-0 transition-transform duration-150 ${workspaceOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Workspace dropdown */}
        <AnimatePresence>
          {workspaceOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden" animate="visible" exit="exit"
              className="absolute top-full left-3 right-3 mt-1 bg-surface border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden"
            >
              {/* Personal Space */}
              <button
                onClick={() => { setActiveWorkspace(null); setWorkspaceOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-app transition-colors text-left"
              >
                <div className="w-6 h-6 bg-app rounded-md border border-border flex items-center justify-center">
                  <span className="text-2xs font-bold text-secondary">{user?.name?.slice(0,2).toUpperCase()}</span>
                </div>
                <span className="text-sm text-primary">Personal Space</span>
              </button>

              {/* Teams */}
              {teams.map((team) => (
                <button
                  key={team._id}
                  onClick={() => { setActiveWorkspace(team); setWorkspaceOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-app transition-colors text-left"
                >
                  <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                    <span className="text-2xs font-bold text-white">{team.name.slice(0,2).toUpperCase()}</span>
                  </div>
                  <span className="text-sm text-primary truncate">{team.name}</span>
                </button>
              ))}

              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => { openModal("createTeam"); setWorkspaceOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-app transition-colors text-left text-secondary"
                >
                  <Plus size={14} />
                  <span className="text-sm">Create team</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav Items ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-150 cursor-pointer
              ${isActive
                ? "bg-app text-primary font-semibold"
                : "text-secondary hover:bg-app hover:text-primary"
              }
            `}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? "text-primary" : "text-tertiary"} />
                {label}
                {label === "Inbox" && (
                  <span className="ml-auto text-2xs bg-primary text-white rounded-full px-1.5 py-0.5 font-semibold">3</span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Favorites section */}
        <div className="mt-4 mb-1">
          <p className="px-3 text-2xs font-semibold text-tertiary uppercase tracking-wider">Favorites</p>
        </div>
        {FAVORITES.map((fav) => (
          <button
            key={fav.label}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-secondary hover:bg-app hover:text-primary transition-colors w-full text-left"
          >
            <Star size={14} className="text-tertiary flex-shrink-0" />
            <span className="truncate">{fav.label}</span>
          </button>
        ))}
      </nav>

      {/* ── User Profile (bottom) ── */}
      <div className="px-3 py-3 border-t border-border flex-shrink-0 relative">
        <button
          onClick={() => setUserMenuOpen((p) => !p)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-app transition-colors"
        >
          <Avatar user={user} size="sm" />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-primary truncate">{user?.name}</p>
            <p className="text-2xs text-tertiary truncate">{user?.email}</p>
          </div>
          <ChevronDown size={14} className={`text-tertiary flex-shrink-0 transition-transform duration-150 ${userMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {/* User menu popup */}
        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden" animate="visible" exit="exit"
              className="absolute bottom-full left-3 right-3 mb-1 bg-surface border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden"
            >
              <NavLink
                to="/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-app transition-colors text-sm text-primary"
              >
                <Avatar user={user} size="xs" />
                My Profile
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-app transition-colors text-sm text-secondary"
              >
                <Settings size={14} />
                Settings
              </NavLink>
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 hover:text-status-red transition-colors text-sm text-secondary text-left"
                >
                  <LogOut size={14} />
                  Log out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

export default Sidebar;
