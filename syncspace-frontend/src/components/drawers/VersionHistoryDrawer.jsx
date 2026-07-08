// components/drawers/VersionHistoryDrawer.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, History, RotateCcw, Tag } from "lucide-react";
import { drawerVariants, overlayVariants } from "../../styles/animations";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { documentService } from "../../services";
import { formatRelativeTime } from "../../utils";
import toast from "react-hot-toast";

const VersionHistoryDrawer = ({ isOpen, onClose, docId, onRestore }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    if (!isOpen || !docId) return;
    setLoading(true);
    documentService.getVersions(docId)
      .then(r => setVersions(r.data.data.versions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, docId]);

  const handleRestore = async (versionId) => {
    setRestoring(versionId);
    try {
      const res = await documentService.restoreVersion(docId, versionId);
      toast.success("Version restored!");
      onRestore?.(res.data.data.yjsState);
      onClose();
    } catch {
      toast.error("Failed to restore version");
    } finally { setRestoring(null); }
  };

  // Demo versions for UI preview
  const DEMO_VERSIONS = [
    { _id:"v1", savedBy:{ name:"Priya Singh"  }, createdAt:new Date(Date.now()-120000),    isNamedVersion:false, label:"" },
    { _id:"v2", savedBy:{ name:"Rohan Mehta" }, createdAt:new Date(Date.now()-3600000),   isNamedVersion:true,  label:"Before Q2 restructure" },
    { _id:"v3", savedBy:{ name:"You"          }, createdAt:new Date(Date.now()-86400000),  isNamedVersion:false, label:"" },
    { _id:"v4", savedBy:{ name:"Amit Kumar"   }, createdAt:new Date(Date.now()-172800000), isNamedVersion:false, label:"" },
  ];

  const displayVersions = versions.length > 0 ? versions : DEMO_VERSIONS;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit"
            onClick={onClose} className="fixed inset-0 bg-black/20 z-40" />
          <motion.div variants={drawerVariants} initial="hidden" animate="visible" exit="exit"
            className="fixed top-0 right-0 h-screen w-96 bg-surface border-l border-border z-50 flex flex-col shadow-xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <History size={16} /> Version History
              </h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-app text-tertiary hover:text-primary transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Version list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {displayVersions.map((version, i) => (
                    <div key={version._id}
                      className="flex items-start gap-3 px-5 py-4 hover:bg-app transition-colors group"
                    >
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full border-2 mt-1 ${
                          i === 0 ? "bg-primary border-primary" : "bg-surface border-border"
                        }`} />
                        {i < displayVersions.length - 1 && <div className="w-px flex-1 bg-border min-h-[24px]" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        {version.isNamedVersion && version.label && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <Tag size={11} className="text-accent-purple" />
                            <span className="text-xs font-semibold text-accent-purple">{version.label}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar user={version.savedBy} size="xs" />
                          <span className="text-xs font-medium text-primary">{version.savedBy?.name}</span>
                        </div>
                        <p className="text-xs text-tertiary">{formatRelativeTime(version.createdAt)}</p>
                      </div>

                      <button
                        onClick={() => handleRestore(version._id)}
                        disabled={restoring === version._id || i === 0}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-surface text-secondary transition-all disabled:opacity-30"
                      >
                        <RotateCcw size={11} />
                        {restoring === version._id ? "Restoring..." : "Restore"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VersionHistoryDrawer;
