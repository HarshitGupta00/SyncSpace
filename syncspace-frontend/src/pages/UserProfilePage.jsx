// pages/UserProfilePage.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail, MapPin, Phone, Calendar, Clock, Shield,
  Camera, Edit2, Award, Star, PenTool
} from "lucide-react";
import Tabs from "../components/ui/Tabs";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import { staggerContainer, staggerItem } from "../styles/animations";
import useAuthStore from "../store/useAuthStore";
import { formatRelativeTime } from "../utils";

const PROFILE_TABS = [
  { label: "Overview",      value: "overview"     },
  { label: "Activity",      value: "activity"     },
  { label: "Preferences",   value: "preferences"  },
  { label: "Security",      value: "security"     },
  { label: "Notifications", value: "notifications"},
];

const DEMO_TEAMS = [
  { name: "Product Team",   role: "owner"  },
  { name: "Design Team",    role: "member" },
  { name: "Marketing Team", role: "member" },
  { name: "Research Team",  role: "member" },
  { name: "Operations Team",role: "member" },
];

const BADGES = [
  { icon: Shield,   title: "Early Adopter",    desc: "Joined early and helped shape SyncSpace" },
  { icon: Star,     title: "Top Contributor",   desc: "Active contributor in projects"           },
  { icon: PenTool,  title: "Whiteboard Master", desc: "Created 10+ whiteboards"                 },
];

const ACTIVITY = [
  { action: "uploaded",  target: "Product Roadmap Q2 2025.pdf", context: "Product Roadmap",    time: new Date(Date.now()-7200000)   },
  { action: "moved",     target: "Design Assets",               context: "Design System",       time: new Date(Date.now()-18000000)  },
  { action: "edited",    target: "Marketing Strategy Brainstorm",context:"Whiteboards",         time: new Date(Date.now()-86400000)  },
  { action: "added",     target: "Simran Chawla",               context: "Marketing Team",      time: new Date(Date.now()-172800000) },
  { action: "updated",   target: "Budget Plan Q2.xlsx",         context: "Marketing Campaign",  time: new Date(Date.now()-259200000) },
];

const UserProfilePage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState({
    name:     user?.name     || "Harshit Verma",
    phone:    user?.phone    || "+91 98765 43210",
    location: user?.location || "Mathura, India",
    bio:      user?.bio      || "Building meaningful products with great teams.",
    skills:   user?.skills   || ["Project Management", "UI/UX", "Data Analysis"],
    timezone: user?.timezone || "GMT+5:30",
  });

  const displayUser = user || { name: "Harshit Verma", email: "harshit@acme.com", avatar: "" };

  return (
    <motion.div
      variants={staggerContainer} initial="hidden" animate="visible"
      className="p-8 max-w-[1400px]"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="mb-6">
        <h1 className="text-4xl font-bold text-primary">My Profile</h1>
        <p className="text-secondary text-sm mt-1">Manage your personal information, preferences, and account settings.</p>
      </motion.div>

      {/* Profile card */}
      <motion.div variants={staggerItem} className="card mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar with camera button */}
          <div className="relative flex-shrink-0">
            <Avatar user={displayUser} size="2xl" />
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-surface hover:bg-accent-hover transition-colors">
              <Camera size={12} className="text-white" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-primary">{form.name}</h2>
                <Badge variant="admin" className="mt-1">Admin</Badge>
                <div className="flex items-center gap-4 mt-3 text-sm text-secondary">
                  <span className="flex items-center gap-1.5"><Mail size={13}/> {displayUser.email}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={13}/> {form.location}</span>
                </div>
              </div>
              <Button variant="secondary" size="sm" icon={Edit2} onClick={() => setEditing(!editing)}>
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Right column meta */}
          <div className="flex-shrink-0 min-w-[260px] border-l border-border pl-6 grid grid-cols-1 gap-2">
            {[
              { label: "Full Name",    value: form.name     },
              { label: "Phone",        value: form.phone    },
              { label: "Role",         value: "Admin"       },
              { label: "Member Since", value: "Feb 12, 2024"},
              { label: "Time Zone",    value: `(${form.timezone}) India Standard Time` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-tertiary w-28 flex-shrink-0">{label}</span>
                <span className="text-primary font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={staggerItem}>
        <Tabs tabs={PROFILE_TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />
      </motion.div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-3 gap-6">

          {/* About + Storage + Status */}
          <motion.div variants={staggerItem} className="col-span-1 flex flex-col gap-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-primary mb-3">About Me</h3>
              {editing ? (
                <textarea
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  className="w-full text-sm text-secondary border border-border rounded-lg p-2.5 resize-none focus:outline-none focus:border-primary h-20"
                />
              ) : (
                <p className="text-sm text-secondary leading-relaxed">{form.bio}</p>
              )}
              <div className="mt-4">
                <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((s) => (
                    <span key={s} className="text-xs px-2.5 py-1 bg-app border border-border rounded-full text-secondary">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-primary mb-4">Storage Usage</h3>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-secondary">2.4 GB of 10 GB used</span>
                <span className="font-semibold text-primary">24%</span>
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-3">
                <div className="h-full bg-primary rounded-full" style={{ width: "24%" }} />
              </div>
              <Button variant="secondary" size="sm" className="w-full">Manage Storage</Button>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-primary mb-4">Account Status</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-status-green rounded-full" />
                <span className="text-sm font-semibold text-status-green">Active</span>
              </div>
              <p className="text-xs text-secondary mb-4">Your account is active and in good standing.</p>
              <Button variant="secondary" size="sm" className="w-full">View Plan Details</Button>
            </div>
          </motion.div>

          {/* Activity + Teams + Badges */}
          <motion.div variants={staggerItem} className="col-span-2 flex flex-col gap-4">

            {/* Recent Activity */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-primary">Recent Activity</h3>
                <button className="text-xs text-secondary hover:text-primary">View all</button>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {ACTIVITY.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="w-8 h-8 bg-app border border-border rounded-lg flex items-center justify-center flex-shrink-0">
                      <PenTool size={13} className="text-tertiary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-primary">
                        You {item.action}{" "}
                        <span className="font-semibold">{item.target}</span>
                        {" "}in <span className="text-secondary">{item.context}</span>
                      </p>
                    </div>
                    <span className="text-xs text-tertiary flex-shrink-0">{formatRelativeTime(item.time)}</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full py-2.5 text-sm text-secondary hover:text-primary border-t border-border transition-colors">
                View All Activity
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Teams */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-primary">Teams ({DEMO_TEAMS.length})</h3>
                  <button className="text-xs text-secondary hover:text-primary">View all</button>
                </div>
                <div className="flex flex-col gap-2.5">
                  {DEMO_TEAMS.map((team) => (
                    <div key={team.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                          <span className="text-white text-2xs font-bold">{team.name.slice(0,2).toUpperCase()}</span>
                        </div>
                        <span className="text-sm text-primary">{team.name}</span>
                      </div>
                      <Badge variant={team.role}>{team.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-primary">Badges</h3>
                  <button className="text-xs text-secondary hover:text-primary">View all</button>
                </div>
                <div className="flex flex-col gap-3">
                  {BADGES.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-app border border-border rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon size={14} className="text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary">{title}</p>
                        <p className="text-xs text-tertiary">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Other tabs — placeholder */}
      {activeTab !== "overview" && (
        <motion.div variants={staggerItem} className="card flex items-center justify-center py-20">
          <p className="text-secondary text-sm">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings coming soon</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default UserProfilePage;
