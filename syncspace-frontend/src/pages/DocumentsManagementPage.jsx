// pages/DocumentsManagementPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, Plus, MoreHorizontal, Star, Filter,
  Upload, Search, Clock, Users, HardDrive, FolderOpen, Calendar
} from "lucide-react";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import Tabs from "../components/ui/Tabs";
import Avatar from "../components/ui/Avatar";
import { staggerContainer, staggerItem } from "../styles/animations";
import { documentService } from "../services";
import useUIStore from "../store/useUIStore";
import { formatRelativeTime } from "../utils";

const TABS = [
  { label: "All Documents", value: "all"    },
  { label: "My Documents",  value: "mine"   },
  { label: "Shared with Me",value: "shared" },
  { label: "Favorites",     value: "fav"    },
];

const FILE_ICON_COLOR = {
  pdf:  "bg-red-50 text-red-500",
  doc:  "bg-blue-50 text-blue-500",
  docx: "bg-blue-50 text-blue-500",
  xlsx: "bg-green-50 text-green-500",
  pptx: "bg-amber-50 text-amber-500",
  txt:  "bg-gray-50 text-gray-500",
  default: "bg-violet-50 text-violet-500",
};

const getExt = (name = "") => name.split(".").pop().toLowerCase();

const DocumentsManagementPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { openModal } = useUIStore();

  const [docs, setDocs]         = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch]     = useState("");
  const [starred, setStarred]   = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    // Fetch documents — with or without a projectId filter
    documentService.getDocuments(projectId || undefined)
      .then(r => setDocs(r.data.data.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const displayDocs = docs
    .filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div
      variants={staggerContainer} initial="hidden" animate="visible"
      className="p-8 max-w-[1400px]"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-primary">Documents</h1>
          <p className="text-secondary text-sm mt-1">Store, organize, and collaborate on all your important documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-app text-tertiary transition-colors">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={FileText}  label="Total Documents"   value={docs.length}     trendLabel={docs.length > 0 ? `${docs.length} total` : "Start writing"} />
        <StatCard icon={Users}     label="Shared with Me"    value={0}               trendLabel="Shared documents" />
        <StatCard icon={Clock}     label="Recently Modified" value={docs.filter(d => Date.now() - new Date(d.updatedAt).getTime() < 7 * 86400000).length} trendLabel="Last 7 days" />
        <StatCard icon={HardDrive} label="Total Projects"    value={new Set(docs.map(d => d.project?._id).filter(Boolean)).size} trendLabel="With documents" />
      </motion.div>

      {/* Main + Sidebar */}
      <div className="flex gap-6">
        {/* Documents table */}
        <motion.div variants={staggerItem} className="flex-1 card">
          {/* Tabs + search + filter */}
          <div className="flex items-center gap-3 mb-4">
            <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="flex-1" />
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-app text-primary placeholder:text-tertiary focus:outline-none focus:border-primary w-36"
                />
              </div>
              <select className="px-3 py-1.5 border border-border rounded-lg text-sm text-secondary bg-surface focus:outline-none">
                <option>Sort: Recent</option>
                <option>Sort: Name</option>
              </select>
            </div>
          </div>

          {displayDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText size={36} className="text-tertiary mb-3" />
              <p className="text-sm font-semibold text-primary mb-1">No documents yet</p>
              <p className="text-xs text-secondary mb-4">Create a document to start collaborating</p>
              <Button icon={Plus} onClick={() => openModal("createDocument")}>New Document</Button>
            </div>
          ) : (
            <>
              {/* Table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Name","Owner","Last Modified","",""].map((col,i) => (
                      <th key={i} className="text-left text-xs font-semibold text-tertiary pb-3 pr-4 first:pl-0">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayDocs.map((doc) => {
                    const ext = getExt(doc.title);
                    const iconColor = FILE_ICON_COLOR[ext] || FILE_ICON_COLOR.default;
                    return (
                      <tr
                        key={doc._id}
                        onClick={() => navigate(`/documents/${doc._id}/edit`)}
                        className="hover:bg-app transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                              <FileText size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary group-hover:text-accent-purple transition-colors">
                                {doc.title}
                              </p>
                              {doc.project && (
                                <p className="text-2xs text-tertiary flex items-center gap-1 mt-0.5">
                                  <FolderOpen size={10} /> {doc.project?.name || "—"}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <Avatar user={doc.owner} size="xs" />
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className="text-sm text-secondary">{formatRelativeTime(doc.updatedAt)}</span>
                        </td>
                        <td className="py-3.5 pr-2">
                          <button
                            onClick={e => { e.stopPropagation(); setStarred(p => ({ ...p, [doc._id]: !p[doc._id] })); }}
                            className="p-1 rounded transition-colors"
                          >
                            <Star size={14} className={starred[doc._id] ? "fill-amber-400 text-amber-400" : "text-tertiary hover:text-amber-400"} />
                          </button>
                        </td>
                        <td className="py-3.5">
                          <button
                            onClick={e => e.stopPropagation()}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-border text-tertiary transition-all"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Create new */}
              <button
                onClick={() => openModal("createDocument")}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-sm text-secondary hover:border-primary/30 hover:text-primary hover:bg-app transition-all"
              >
                <Plus size={15} /> New Document
              </button>
            </>
          )}
        </motion.div>

        {/* Recent Activity sidebar — empty state */}
        <motion.div variants={staggerItem} className="w-72 flex-shrink-0 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-primary">Recent Activity</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 bg-app border border-border rounded-xl flex items-center justify-center mb-3">
              <Calendar size={16} className="text-tertiary" />
            </div>
            <p className="text-sm font-medium text-primary">No recent activity</p>
            <p className="text-xs text-tertiary mt-1">Activity will appear as documents are edited</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DocumentsManagementPage;
