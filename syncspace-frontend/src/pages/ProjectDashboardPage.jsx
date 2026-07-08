// pages/ProjectDashboardPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FolderOpen, FileText, Users, Plus, MoreHorizontal, LayoutGrid, List, Calendar } from "lucide-react";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Tabs from "../components/ui/Tabs";
import ProgressBar from "../components/ui/ProgressBar";
import { AvatarStack } from "../components/ui/Avatar";
import { staggerContainer, staggerItem } from "../styles/animations";
import { projectService } from "../services";
import useWorkspaceStore from "../store/useWorkspaceStore";
import useUIStore from "../store/useUIStore";
import { formatRelativeTime } from "../utils";

const TABS = [
  { label: "All Projects", value: "all" },
  { label: "Ongoing",      value: "in_progress" },
  { label: "Completed",    value: "completed" },
  { label: "Archived",     value: "archived" },
];

const ProjectCard = ({ project, onClick }) => (
  <motion.div
    variants={staggerItem}
    onClick={onClick}
    className="card cursor-pointer hover:shadow-md transition-all group"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <FolderOpen size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-primary group-hover:text-accent-purple transition-colors">
            {project.name}
          </h3>
          <Badge variant={project.status}>
            {(project.status || "not started").replace("_", " ")}
          </Badge>
        </div>
      </div>
      <button
        onClick={e => e.stopPropagation()}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-app text-tertiary transition-all"
      >
        <MoreHorizontal size={14} />
      </button>
    </div>

    <p className="text-xs text-secondary mb-4 leading-relaxed line-clamp-2">
      {project.description || "No description"}
    </p>

    <ProgressBar value={project.progress || 0} showLabel className="mb-4" />

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-xs text-secondary">
          <Users size={12} /> {project.members?.length || 0}
        </span>
        <span className="flex items-center gap-1 text-xs text-secondary">
          <FileText size={12} /> {project.documentCount || 0}
        </span>
      </div>
      <span className="text-2xs text-tertiary">
        Updated {formatRelativeTime(project.updatedAt || new Date())}
      </span>
    </div>
  </motion.div>
);

const ProjectDashboardPage = () => {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspaceStore();
  const { openModal } = useUIStore();

  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [view, setView] = useState("grid"); // grid | list
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService.getProjects(activeWorkspace?._id)
      .then(res => setProjects(res.data.data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  const displayProjects = projects
    .filter(p => activeTab === "all" || p.status === activeTab);

  return (
    <motion.div
      variants={staggerContainer} initial="hidden" animate="visible"
      className="p-8 max-w-[1400px]"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-primary">Projects</h1>
          <p className="text-secondary text-sm mt-1">All your projects in one place. Stay organized and keep things moving.</p>
        </div>
        <Button icon={Plus} onClick={() => openModal("createProject")}>Create New Project</Button>
      </motion.div>

      {/* Tabs + view toggle */}
      <motion.div variants={staggerItem} className="flex items-center justify-between mb-6">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-md transition-colors ${view === "grid" ? "bg-primary text-white" : "text-tertiary hover:text-primary"}`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-md transition-colors ${view === "list" ? "bg-primary text-white" : "text-tertiary hover:text-primary"}`}
          >
            <List size={14} />
          </button>
        </div>
      </motion.div>

      {/* Projects grid */}
      {displayProjects.length === 0 && projects.length === 0 ? (
        <motion.div variants={staggerItem} className="card flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen size={40} className="text-tertiary mb-4" />
          <p className="text-lg font-semibold text-primary mb-1">No projects yet</p>
          <p className="text-sm text-secondary mb-6 max-w-sm">Create your first project to start organizing your documents and collaborations.</p>
          <Button icon={Plus} onClick={() => openModal("createProject")}>Create New Project</Button>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          className={view === "grid"
            ? "grid grid-cols-4 gap-4 mb-8"
            : "flex flex-col gap-3 mb-8"
          }
        >
          {displayProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onClick={() => navigate(`/documents?projectId=${project._id}`)}
            />
          ))}

          {/* Create new project card */}
          <motion.div
            variants={staggerItem}
            onClick={() => openModal("createProject")}
            className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-app transition-all group"
          >
            <div className="w-9 h-9 bg-app border border-border rounded-xl flex items-center justify-center group-hover:border-primary/40 transition-colors">
              <Plus size={16} className="text-tertiary group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-semibold text-primary">Create New Project</p>
            <p className="text-xs text-tertiary text-center">Start a new project from scratch</p>
          </motion.div>
        </motion.div>
      )}

      {/* Recent Activity — empty state */}
      {projects.length > 0 && (
        <motion.div variants={staggerItem} className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-md font-semibold text-primary">Recent Activity</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 bg-app border border-border rounded-xl flex items-center justify-center mb-3">
              <Calendar size={16} className="text-tertiary" />
            </div>
            <p className="text-sm font-medium text-primary">No recent activity</p>
            <p className="text-xs text-tertiary mt-1">Activity will appear here as you and your team work on projects</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProjectDashboardPage;
