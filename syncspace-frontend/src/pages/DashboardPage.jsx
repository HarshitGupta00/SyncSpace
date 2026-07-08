// pages/DashboardPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderOpen, Users, FileText, CheckSquare,
  MoreHorizontal, Plus, ArrowRight, Calendar
} from "lucide-react";
import StatCard from "../components/ui/StatCard";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { PageSkeleton } from "../components/ui/Skeleton";
import { staggerContainer, staggerItem } from "../styles/animations";
import { projectService, documentService, teamService } from "../services";
import useAuthStore from "../store/useAuthStore";
import useWorkspaceStore from "../store/useWorkspaceStore";
import useUIStore from "../store/useUIStore";
import { formatRelativeTime, truncate } from "../utils";

// Greeting based on time of day
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { openModal } = useUIStore();

  const [projects, setProjects]   = useState([]);
  const [documents, setDocuments] = useState([]);
  const [teams, setTeams]         = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, tRes] = await Promise.all([
          projectService.getProjects(activeWorkspace?._id),
          teamService.getMyTeams(),
        ]);
        const fetchedProjects = pRes.data.data.projects || [];
        setProjects(fetchedProjects);
        setTeams(tRes.data.data.teams || []);

        // Fetch docs from first project if available, otherwise fetch all
        if (fetchedProjects.length > 0) {
          const dRes = await documentService.getDocuments(fetchedProjects[0]._id);
          setDocuments(dRes.data.data.documents || []);
        }
      } catch (e) {
        // silently fail on dashboard — skeleton stays if error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeWorkspace]);

  if (loading) return <PageSkeleton />;

  // Compute dynamic stat values
  const totalMembers = teams.reduce((sum, t) => sum + (t.members?.length || 0), 0);

  const today = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <motion.div
      variants={staggerContainer} initial="hidden" animate="visible"
      className="p-8 max-w-[1400px]"
    >
      {/* ── Header ── */}
      <motion.div variants={staggerItem} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-primary">
            {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-secondary text-sm mt-1">
            Here's what's happening with your workspace today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary">
          <Calendar size={14} />
          {today}
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div variants={staggerItem} className="grid grid-cols-4 gap-4 mb-8">
        {[
          { icon: FolderOpen,  label: "Total Projects",  value: projects.length,  trend: projects.length > 0 ? `${projects.length} active` : "Create your first" },
          { icon: Users,       label: "Team Members",    value: totalMembers,     trend: `Across ${teams.length} team${teams.length !== 1 ? "s" : ""}` },
          { icon: FileText,    label: "Documents",       value: documents.length, trend: documents.length > 0 ? `${documents.length} total` : "Start writing" },
          { icon: CheckSquare, label: "Teams",           value: teams.length,     trend: teams.length > 0 ? "Manage teams" : "Create a team" },
        ].map(({ icon, label, value, trend }) => (
          <StatCard key={label} icon={icon} label={label} value={value} trendLabel={trend} />
        ))}
      </motion.div>

      {/* ── Middle Row ── */}
      <div className="grid grid-cols-3 gap-6 mb-6">

        {/* Recent Documents */}
        <motion.div variants={staggerItem} className="col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-primary">Recent Documents</h3>
            <button
              onClick={() => navigate("/documents")}
              className="text-xs text-secondary hover:text-primary flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText size={32} className="text-tertiary mb-3" />
              <p className="text-sm font-medium text-primary">No documents yet</p>
              <p className="text-xs text-secondary mt-1 mb-4">Create your first document to get started</p>
              <Button size="sm" icon={Plus} onClick={() => openModal("createDocument")}>
                New Document
              </Button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {documents.slice(0, 4).map((doc) => (
                <div key={doc._id}
                  className="flex items-center gap-3 py-3 hover:bg-app -mx-4 px-4 transition-colors cursor-pointer rounded-lg group"
                  onClick={() => navigate(`/documents/${doc._id}/edit`)}
                >
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{doc.title}</p>
                    <p className="text-xs text-tertiary">{doc.project?.name || "No project"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-tertiary">Updated {formatRelativeTime(doc.updatedAt)}</p>
                    <p className="text-xs text-tertiary">• {doc.owner?.name || "You"}</p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1 rounded text-tertiary hover:text-primary transition-all">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={staggerItem} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-primary">Recent Activity</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 bg-app border border-border rounded-xl flex items-center justify-center mb-3">
              <Calendar size={16} className="text-tertiary" />
            </div>
            <p className="text-sm font-medium text-primary">No recent activity</p>
            <p className="text-xs text-tertiary mt-1">Activity will appear here as you and your team collaborate</p>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Projects Overview */}
        <motion.div variants={staggerItem} className="card col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-primary">Projects Overview</h3>
            <button onClick={() => navigate("/projects")}
              className="text-xs text-secondary hover:text-primary flex items-center gap-1">
              View all <ArrowRight size={12}/>
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <FolderOpen size={32} className="text-tertiary mb-3" />
              <p className="text-sm font-medium text-primary mb-1">No projects yet</p>
              <Button size="sm" icon={Plus} onClick={() => openModal("createProject")}>
                Create Project
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {projects.slice(0, 4).map((project) => (
                <div key={project._id}
                  className="flex items-center gap-4 py-2 hover:bg-app -mx-4 px-4 rounded-lg transition-colors cursor-pointer"
                  onClick={() => navigate(`/documents?projectId=${project._id}`)}
                >
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <FolderOpen size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{project.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-2xs text-tertiary flex-shrink-0">{project.progress || 0}%</span>
                    </div>
                  </div>
                  <Badge variant={project.status || "not_started"}>
                    {(project.status || "not started").replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Team Members */}
        <motion.div variants={staggerItem} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-primary">Team Members</h3>
            <button
              onClick={() => navigate("/teams")}
              className="text-xs text-secondary hover:text-primary flex items-center gap-1"
            >
              View all <ArrowRight size={12}/>
            </button>
          </div>
          {teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users size={28} className="text-tertiary mb-2" />
              <p className="text-sm font-medium text-primary">No teams yet</p>
              <p className="text-xs text-tertiary mt-1 mb-3">Create a team to start collaborating</p>
              <Button size="sm" icon={Plus} onClick={() => openModal("createTeam")}>Create Team</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {teams.slice(0, 4).map((team) => (
                <div key={team._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-2xs font-bold">{team.name?.slice(0,2).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary leading-none">{team.name}</p>
                      <p className="text-2xs text-tertiary mt-0.5">{team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
