// components/drawers/CommentsDrawer.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Send, Check } from "lucide-react";
import { drawerVariants, overlayVariants } from "../../styles/animations";
import Avatar from "../ui/Avatar";
import { commentService } from "../../services";
import useAuthStore from "../../store/useAuthStore";
import { formatRelativeTime } from "../../utils";
import toast from "react-hot-toast";

const CommentsDrawer = ({ isOpen, onClose, targetId, targetType = "Document" }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    if (!isOpen || !targetId) return;
    setLoading(true);
    commentService.getComments(targetId, targetType)
      .then(r => setComments(r.data.data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, targetId, targetType]);

  const sendComment = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      const res = await commentService.addComment({ targetId, targetType, content: input });
      setComments(p => [...p, res.data.data.comment]);
      setInput("");
    } catch {
      toast.error("Failed to add comment");
    } finally { setSending(false); }
  };

  const resolveComment = async (commentId, resolved) => {
    try {
      await commentService.resolveComment(commentId, resolved);
      setComments(p => p.map(c => c._id === commentId ? { ...c, resolved } : c));
    } catch { toast.error("Failed to update comment"); }
  };

  // Demo comments
  const DEMO = [
    { _id:"c1", author:{ name:"Priya Singh"  }, content:"Can we add more detail to the Goals section?", createdAt:new Date(Date.now()-900000),  resolved:false },
    { _id:"c2", author:{ name:"Rohan Mehta" }, content:"The Q2 timeline looks tight. Should we push the deadline?", createdAt:new Date(Date.now()-3600000), resolved:false },
    { _id:"c3", author:{ name:"Amit Kumar"  }, content:"Great structure overall!", createdAt:new Date(Date.now()-86400000), resolved:true },
  ];

  const displayComments = comments.length > 0 ? comments : DEMO;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit"
            onClick={onClose} className="fixed inset-0 bg-black/20 z-40" />
          <motion.div variants={drawerVariants} initial="hidden" animate="visible" exit="exit"
            className="fixed top-0 right-0 h-screen w-96 bg-surface border-l border-border z-50 flex flex-col shadow-xl">

            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <MessageSquare size={16} /> Comments ({displayComments.filter(c => !c.resolved).length})
              </h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-app text-tertiary hover:text-primary transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {displayComments.map((comment) => (
                <div key={comment._id}
                  className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${
                    comment.resolved ? "bg-app border-border opacity-60" : "bg-surface border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar user={comment.author} size="xs" />
                      <div>
                        <p className="text-xs font-semibold text-primary">{comment.author?.name}</p>
                        <p className="text-2xs text-tertiary">{formatRelativeTime(comment.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => resolveComment(comment._id, !comment.resolved)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-2xs font-semibold transition-colors flex-shrink-0 ${
                        comment.resolved
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-app border border-border text-secondary hover:bg-surface"
                      }`}
                    >
                      <Check size={10} />
                      {comment.resolved ? "Resolved" : "Resolve"}
                    </button>
                  </div>
                  <p className="text-sm text-primary leading-relaxed">{comment.content}</p>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Avatar user={user} size="xs" />
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-app border border-border rounded-xl focus-within:border-primary transition-colors">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent text-sm text-primary placeholder:text-tertiary focus:outline-none"
                  />
                  <button
                    onClick={sendComment}
                    disabled={sending || !input.trim()}
                    className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-40"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommentsDrawer;
