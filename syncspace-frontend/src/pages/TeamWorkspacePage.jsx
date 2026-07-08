// pages/TeamWorkspacePage.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Shield, BarChart2, Plus, MoreHorizontal, Search } from "lucide-react";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import Tabs from "../components/ui/Tabs";
import Avatar, { AvatarStack } from "../components/ui/Avatar";
import { staggerContainer, staggerItem } from "../styles/animations";
import { teamService } from "../services";
import useUIStore from "../store/useUIStore";
import { formatRelativeTime } from "../utils";
import toast from "react-hot-toast";

const TABS = [
  { label: "All Teams", value: "all" },
  { label: "My Teams",  value: "mine" },
];

const TeamWorkspacePage = () => {
  const { openModal } = useUIStore();
  const [activeTab, setActiveTab] = useState("all");
  const [teams, setTeams]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    teamService.getMyTeams()
      .then(res => setTeams(res.data.data.teams || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayTeams = teams
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  // Compute dynamic stats
  const totalMembers = teams.reduce((sum, t) => sum + (t.members?.length || 0), 0);
  const adminCount = teams.reduce((sum, t) => {
    const admins = (t.members || []).filter(m => m.role === "admin" || m.role === "owner");
    return sum + admins.length;
  }, 0);

  return (
    <motion.div
      variants={staggerContainer} initial="hidden" animate="visible"
      className="p-8 max-w-[1400px]"
    >
      {/* ── Header ── */}
      <motion.div variants={staggerItem} className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-primary">Teams</h1>
          <p className="text-secondary text-sm mt-1">Manage your teams, members, and collaborations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-app text-secondary transition-colors">
            <MoreHorizontal size={16} />
          </button>
          <Button icon={Plus} onClick={() => openModal("createTeam")}>Create Team</Button>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div variants={staggerItem} className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}     label="Total Teams"          value={teams.length}   trendLabel={teams.length > 0 ? `${teams.length} active` : "Create your first"} />
        <StatCard icon={Users}     label="Total Members"        value={totalMembers}   trendLabel={`Across all teams`} />
        <StatCard icon={Shield}    label="Admins"               value={adminCount}     trendLabel="Manage workspace access" />
        <StatCard icon={BarChart2} label="Active Collaborations" value={teams.length}  trendLabel="Across all teams" />
      </motion.div>

      {/* ── Main Content + Sidebar ── */}
      <div className="flex gap-6">

        {/* Teams list */}
        <motion.div variants={staggerItem} className="flex-1 card">
          {/* Tabs + search */}
          <div className="flex items-center justify-between mb-4">
            <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
            <div className="relative ml-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search teams..."
                className="pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-app text-primary placeholder:text-tertiary focus:outline-none focus:border-primary w-44"
              />
            </div>
          </div>

          {displayTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={36} className="text-tertiary mb-3" />
              <p className="text-sm font-semibold text-primary mb-1">No teams yet</p>
              <p className="text-xs text-secondary mb-4">Create a team to start collaborating with others</p>
              <Button icon={Plus} onClick={() => openModal("createTeam")}>Create Team</Button>
            </div>
          ) : (
            <>
              {/* Table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Team", "Members", "Projects", "Last Activity", ""].map(col => (
                      <th key={col} className="text-left text-xs font-semibold text-tertiary pb-3 pr-4 first:pl-0">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayTeams.map((team) => (
                    <tr key={team._id} className="hover:bg-app transition-colors cursor-pointer group">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs">{team.name.slice(0,2).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-primary">{team.name}</p>
                            <p className="text-xs text-tertiary">{team.description || "No description"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-sm text-secondary">{team.members?.length || 0}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-sm text-secondary">{team.projectCount || 0}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-sm text-secondary">{formatRelativeTime(team.updatedAt || new Date())}</span>
                      </td>
                      <td className="py-4">
                        <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-border text-tertiary transition-all">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-tertiary mt-4">Showing {displayTeams.length} of {teams.length} teams</p>
            </>
          )}
        </motion.div>

        {/* Right sidebar */}
        <div className="w-80 flex flex-col gap-4 flex-shrink-0">

          {/* Team Activity */}
          <motion.div variants={staggerItem} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary">Team Activity</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 bg-app border border-border rounded-xl flex items-center justify-center mb-3">
                <BarChart2 size={16} className="text-tertiary" />
              </div>
              <p className="text-sm font-medium text-primary">No recent activity</p>
              <p className="text-xs text-tertiary mt-1">Activity will appear here as your teams collaborate</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default TeamWorkspacePage;
