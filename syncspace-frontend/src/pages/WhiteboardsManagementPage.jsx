// pages/WhiteboardsManagementPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Layout, Plus, MoreHorizontal, Star, Filter,
  Upload, Users, Clock, Share2, Calendar
} from "lucide-react";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import Tabs from "../components/ui/Tabs";
import { AvatarStack } from "../components/ui/Avatar";
import { staggerContainer, staggerItem } from "../styles/animations";
import { whiteboardService } from "../services";
import useWorkspaceStore from "../store/useWorkspaceStore";
import useUIStore from "../store/useUIStore";
import { formatRelativeTime } from "../utils";

const TABS = [
  { label: "All Whiteboards", value: "all"    },
  { label: "Owned by Me",     value: "mine"   },
  { label: "Shared with Me",  value: "shared" },
  { label: "Starred",         value: "starred"},
];

const TEMPLATES = [
  { name: "Mind Map",           desc: "Visualize ideas and concepts"          },
  { name: "Flowchart",          desc: "Map out processes and flows"            },
  { name: "Brainstorm",         desc: "Generate ideas collaboratively"         },
  { name: "Kanban Board",       desc: "Organize tasks and workflows"           },
  { name: "Customer Journey Map",desc: "Understand user journeys"             },
];

// Thumbnail placeholder colors per whiteboard
const THUMB_COLORS = ["bg-yellow-50","bg-pink-50","bg-blue-50","bg-green-50","bg-violet-50","bg-amber-50"];

const WhiteboardsManagementPage = () => {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspaceStore();
  const { openModal } = useUIStore();

  const [wbs, setWbs]           = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [starred, setStarred]   = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    whiteboardService.getWhiteboards()
      .then(res => setWbs(res.data.data.whiteboards || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  // Compute dynamic stats
  const recentCount = wbs.filter(w => Date.now() - new Date(w.updatedAt).getTime() < 7 * 86400000).length;

  return (
    <motion.div
      variants={staggerContainer} initial="hidden" animate="visible"
      className="p-8 max-w-[1400px]"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-primary">Whiteboards</h1>
          <p className="text-secondary text-sm mt-1">Visualize ideas, collaborate in real-time, and bring your thoughts to life.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={Plus} onClick={() => openModal("createWhiteboard")}>New Whiteboard</Button>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Layout} label="Total Whiteboards" value={wbs.length}    trendLabel={wbs.length > 0 ? `${wbs.length} total` : "Create your first"} />
        <StatCard icon={Users}  label="Collaborators"     value={new Set(wbs.flatMap(w => (w.collaborators || []).map(c => c._id || c))).size} trendLabel="Unique contributors" />
        <StatCard icon={Share2} label="Shared"            value={wbs.filter(w => (w.collaborators || []).length > 1).length} trendLabel="Multi-user boards" />
        <StatCard icon={Clock}  label="Recently Opened"   value={recentCount}   trendLabel="Last 7 days" />
      </motion.div>

      {/* Main + Sidebar */}
      <div className="flex gap-6">

        {/* Whiteboard list */}
        <motion.div variants={staggerItem} className="flex-1 card">
          {/* Tabs + filter */}
          <div className="flex items-center gap-3 mb-5">
            <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="flex-1" />
            <div className="flex items-center gap-2 flex-shrink-0">
              <select className="px-3 py-1.5 border border-border rounded-lg text-sm text-secondary bg-surface focus:outline-none">
                <option>Sort: Recent</option>
                <option>Sort: Name</option>
              </select>
            </div>
          </div>

          {wbs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Layout size={36} className="text-tertiary mb-3" />
              <p className="text-sm font-semibold text-primary mb-1">No whiteboards yet</p>
              <p className="text-xs text-secondary mb-4">Create a whiteboard to start visualizing your ideas</p>
              <Button icon={Plus} onClick={() => openModal("createWhiteboard")}>New Whiteboard</Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Name","Owner","Last Modified","",""].map((col,i) => (
                    <th key={i} className="text-left text-xs font-semibold text-tertiary pb-3 pr-4">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {wbs.map((wb, idx) => (
                  <tr
                    key={wb._id}
                    onClick={() => navigate(`/whiteboards/${wb._id}/edit`)}
                    className="hover:bg-app transition-colors cursor-pointer group"
                  >
                    {/* Thumbnail + name */}
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-16 h-10 rounded-lg border border-border flex-shrink-0 overflow-hidden ${THUMB_COLORS[idx % THUMB_COLORS.length]}`}>
                          {/* Mini canvas preview placeholder */}
                          <div className="w-full h-full flex items-center justify-center">
                            <Layout size={16} className="text-tertiary opacity-50" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary group-hover:text-accent-purple transition-colors">
                            {wb.title}
                          </p>
                          {wb.project && (
                            <p className="text-2xs text-tertiary mt-0.5">📁 {wb.project?.name || wb.project}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Collaborators */}
                    <td className="py-3 pr-4">
                      <span className="text-sm text-secondary">{wb.owner?.name || "You"}</span>
                    </td>

                    {/* Time */}
                    <td className="py-3 pr-4">
                      <span className="text-sm text-secondary">{formatRelativeTime(wb.updatedAt)}</span>
                    </td>

                    {/* Star */}
                    <td className="py-3 pr-2">
                      <button
                        onClick={e => { e.stopPropagation(); setStarred(p => ({ ...p, [wb._id]: !p[wb._id] })); }}
                        className="p-1 rounded transition-colors"
                      >
                        <Star size={14} className={starred[wb._id] ? "fill-amber-400 text-amber-400" : "text-tertiary hover:text-amber-400"} />
                      </button>
                    </td>

                    {/* Kebab */}
                    <td className="py-3">
                      <button
                        onClick={e => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-border text-tertiary transition-all"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* Right sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-4">

          {/* Templates */}
          <motion.div variants={staggerItem} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary">Templates</h3>
            </div>
            <div className="flex flex-col gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-app hover:border-primary/20 transition-all text-left group"
                >
                  <div className="w-10 h-8 bg-app border border-border rounded-lg flex-shrink-0 flex items-center justify-center">
                    <Layout size={12} className="text-tertiary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary group-hover:text-accent-purple transition-colors">{t.name}</p>
                    <p className="text-2xs text-tertiary">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity — empty state */}
          <motion.div variants={staggerItem} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary">Recent Activity</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 bg-app border border-border rounded-xl flex items-center justify-center mb-3">
                <Calendar size={16} className="text-tertiary" />
              </div>
              <p className="text-sm font-medium text-primary">No recent activity</p>
              <p className="text-xs text-tertiary mt-1">Activity will appear as whiteboards are edited</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default WhiteboardsManagementPage;
