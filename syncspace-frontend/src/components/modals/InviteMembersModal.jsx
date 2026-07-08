// components/modals/InviteMembersModal.jsx
import { useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import useUIStore from "../../store/useUIStore";
import { inviteService } from "../../services";
import { Mail, X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

const InviteMembersModal = ({ isOpen }) => {
  const { closeModal, modalContext } = useUIStore();
  const teamId = modalContext?.teamId;

  const [emails, setEmails]   = useState([]);
  const [input, setInput]     = useState("");
  const [role, setRole]       = useState("member");
  const [loading, setLoading] = useState(false);

  const addEmail = () => {
    const val = input.trim().toLowerCase();
    if (!val || !val.includes("@")) return;
    if (emails.includes(val)) { toast.error("Already added"); return; }
    setEmails(p => [...p, val]);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addEmail(); }
  };

  const removeEmail = (email) => setEmails(p => p.filter(e => e !== email));

  const handleSubmit = async () => {
    if (emails.length === 0) { toast.error("Add at least one email"); return; }
    setLoading(true);
    try {
      const res = await inviteService.sendInvites({ teamId, emails, role });
      const { sent, skipped } = res.data.data;
      toast.success(`${sent.length} invite(s) sent!`);
      if (skipped.length > 0) toast(`${skipped.length} skipped`, { icon: "⚠️" });
      closeModal("inviteMembers");
      setEmails([]); setInput("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invites");
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => closeModal("inviteMembers")}
      title="Invite Members" description="Invite people to collaborate on your team">
      <div className="flex flex-col gap-5 mt-2">

        {/* Email input + chips */}
        <div>
          <label className="text-sm font-medium text-primary mb-1.5 block">Email addresses</label>
          <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-app min-h-[44px] focus-within:border-primary transition-colors">
            {emails.map(email => (
              <span key={email} className="flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border rounded-full text-xs text-primary">
                {email}
                <button onClick={() => removeEmail(email)} className="text-tertiary hover:text-primary">
                  <X size={11} />
                </button>
              </span>
            ))}
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={addEmail}
              placeholder={emails.length === 0 ? "name@email.com, press Enter to add more" : "Add another..."}
              className="flex-1 min-w-32 bg-transparent text-sm text-primary placeholder:text-tertiary focus:outline-none"
            />
          </div>
          <p className="text-xs text-tertiary mt-1">Press Enter or comma to add each email</p>
        </div>

        {/* Role selector */}
        <div>
          <label className="text-sm font-medium text-primary mb-1.5 block">Role</label>
          <div className="relative">
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-sm text-primary focus:outline-none focus:border-primary appearance-none"
            >
              <option value="member">Member — can view and edit content</option>
              <option value="admin">Admin — can manage members and settings</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
          </div>
        </div>

        {/* Preview */}
        {emails.length > 0 && (
          <div className="bg-app rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-tertiary mb-2">Sending invite to:</p>
            <div className="flex flex-wrap gap-2">
              {emails.map(email => (
                <div key={email} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-2xs font-bold">
                    {email[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-secondary">{email}</span>
                  <Badge variant={role}>{role}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => closeModal("inviteMembers")}>Cancel</Button>
          <Button className="flex-1" loading={loading} onClick={handleSubmit} icon={Mail}>
            Send {emails.length > 0 ? `${emails.length} ` : ""}Invite{emails.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InviteMembersModal;
