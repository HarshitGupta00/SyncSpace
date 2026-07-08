// components/modals/ShareDocumentModal.jsx
import { useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import useUIStore from "../../store/useUIStore";
import { Link2, Copy, Check, Globe, Lock, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

const ShareDocumentModal = ({ isOpen }) => {
  const { closeModal, modalContext } = useUIStore();
  const [email, setEmail]         = useState("");
  const [role, setRole]           = useState("editor");
  const [linkAccess, setLinkAccess] = useState("restricted");
  const [copied, setCopied]       = useState(false);

  const shareLink = `https://syncspace.app/d/${modalContext?.docId || "abc123"}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const SHARED_WITH = [
    { user: { name: "Priya Singh",  email: "priya@acme.com"  }, role: "editor" },
    { user: { name: "Rohan Mehta", email: "rohan@acme.com"  }, role: "viewer" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={() => closeModal("shareDocument")}
      title="Share document" description="Invite people or share a link" size="lg">
      <div className="flex flex-col gap-5 mt-2">

        {/* Invite by email */}
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="Add people by email..."
            value={email}
            onChange={e => setEmail(e.target.value)}
            icon={Link2}
          />
          <div className="relative flex-shrink-0">
            <select value={role} onChange={e => setRole(e.target.value)}
              className="h-full px-3 border border-border rounded-lg bg-surface text-sm text-primary focus:outline-none appearance-none pr-8">
              <option value="editor">Editor</option>
              <option value="commenter">Commenter</option>
              <option value="viewer">Viewer</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
          </div>
          <Button onClick={() => { toast.success("Invite sent!"); setEmail(""); }} disabled={!email.includes("@")}>
            Invite
          </Button>
        </div>

        {/* People with access */}
        <div>
          <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-3">People with access</p>
          <div className="flex flex-col gap-3">
            {SHARED_WITH.map(({ user, role }) => (
              <div key={user.email} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar user={user} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-primary">{user.name}</p>
                    <p className="text-xs text-tertiary">{user.email}</p>
                  </div>
                </div>
                <div className="relative">
                  <select defaultValue={role}
                    className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-surface text-secondary focus:outline-none appearance-none pr-6">
                    <option value="editor">Editor</option>
                    <option value="commenter">Commenter</option>
                    <option value="viewer">Viewer</option>
                    <option value="remove">Remove</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Link access */}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-3">Link access</p>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {linkAccess === "anyone" ? <Globe size={16} className="text-status-blue" /> : <Lock size={16} className="text-secondary" />}
              <div>
                <p className="text-sm font-medium text-primary">
                  {linkAccess === "anyone" ? "Anyone with the link" : "Restricted"}
                </p>
                <p className="text-xs text-tertiary">
                  {linkAccess === "anyone" ? "Anyone can view this document" : "Only invited people can access"}
                </p>
              </div>
            </div>
            <div className="relative">
              <select value={linkAccess} onChange={e => setLinkAccess(e.target.value)}
                className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-surface text-secondary focus:outline-none appearance-none pr-6">
                <option value="restricted">Restricted</option>
                <option value="anyone">Anyone with link</option>
              </select>
              <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
            </div>
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2 p-2.5 bg-app border border-border rounded-lg">
            <span className="flex-1 text-xs text-secondary truncate font-mono">{shareLink}</span>
            <button onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-primary hover:bg-app transition-colors flex-shrink-0">
              {copied ? <><Check size={12} className="text-status-green"/> Copied</> : <><Copy size={12}/> Copy link</>}
            </button>
          </div>
        </div>

        <Button className="w-full" onClick={() => closeModal("shareDocument")}>Done</Button>
      </div>
    </Modal>
  );
};

export default ShareDocumentModal;
