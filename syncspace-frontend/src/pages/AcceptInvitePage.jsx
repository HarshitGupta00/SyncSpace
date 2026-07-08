// pages/AcceptInvitePage.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Shield, Building2, Calendar, CheckCircle2, X } from "lucide-react";
import Button from "../components/ui/Button";
import { inviteService } from "../services";
import useAuthStore from "../store/useAuthStore";
import { pageVariants } from "../styles/animations";
import toast from "react-hot-toast";

const AcceptInvitePage = () => {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const token = params.get("token");

  const [invite, setInvite]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!token) { setError("Invalid invite link"); setLoading(false); return; }
    inviteService.previewInvite(token)
      .then(res => setInvite(res.data.data))
      .catch(err => setError(err.response?.data?.message || "Invalid or expired invite"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/invite/accept?token=${token}`);
      return;
    }
    setAccepting(true);
    try {
      await inviteService.acceptInvite(token);
      toast.success("You've joined the team!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept invite");
    } finally { setAccepting(false); }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      await inviteService.declineInvite(token);
      toast("Invitation declined");
      navigate("/");
    } catch { navigate("/"); }
    finally { setDeclining(false); }
  };

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-surface">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-bold text-primary">SyncSpace</span>
        </div>
        <div className="text-sm text-secondary">
          Already a member?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          variants={pageVariants} initial="hidden" animate="visible"
          className="w-full max-w-md"
        >
          {loading ? (
            <div className="card text-center py-16">
              <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-secondary text-sm mt-4">Loading invite...</p>
            </div>
          ) : error ? (
            <div className="card text-center py-12">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={24} className="text-status-red" />
              </div>
              <h2 className="text-xl font-bold text-primary mb-2">Invite Invalid</h2>
              <p className="text-secondary text-sm">{error}</p>
              <Button className="mt-6" onClick={() => navigate("/")}>Go Home</Button>
            </div>
          ) : (
            <div className="card">
              {/* Envelope illustration */}
              <div className="flex justify-center mb-6 relative">
                <div className="relative">
                  {/* Decorative dots */}
                  {[[-60,-20],[-80,20],[60,-20],[80,20],[-40,50],[40,50]].map(([x,y],i) => (
                    <div key={i} className="absolute w-1 h-1 bg-border rounded-full"
                      style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }} />
                  ))}
                  <div className="w-20 h-20 bg-app border-2 border-border rounded-2xl flex items-center justify-center">
                    <Users size={32} className="text-secondary" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-primary text-center mb-1">You've been invited!</h2>
              <p className="text-secondary text-sm text-center mb-6">
                {invite.invitedBy?.name} ({invite.invitedBy?.email}) has invited you to join
              </p>

              {/* Team info */}
              <div className="bg-app rounded-xl border border-border p-4 mb-5 flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {invite.team?.name?.slice(0,2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-primary">{invite.team?.name}</p>
                  <p className="text-xs text-secondary">Collaborative workspace</p>
                </div>
              </div>

              {/* Details */}
              <div className="border border-border rounded-xl overflow-hidden mb-6">
                {[
                  { icon: Users,     label: "Invited by",  value: `${invite.invitedBy?.name}`, badge: "Admin" },
                  { icon: Shield,    label: "Your role",   value: invite.role,  badge: "Can edit" },
                  { icon: Building2, label: "Workspace",   value: invite.team?.name },
                  { icon: Calendar,  label: "Expires on",  value: new Date(invite.expiresAt).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" }), badge: "7 days" },
                ].map(({ icon: Icon, label, value, badge }, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < 3 ? "border-b border-border" : ""}`}>
                    <Icon size={16} className="text-tertiary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-tertiary">{label}</p>
                      <p className="text-sm font-semibold text-primary capitalize">{value}</p>
                    </div>
                    {badge && (
                      <span className="text-xs bg-app border border-border text-secondary px-2.5 py-1 rounded-lg font-medium">
                        {badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full" size="lg"
                  loading={accepting} onClick={handleAccept}
                  icon={CheckCircle2}
                >
                  Accept Invitation
                </Button>
                <Button
                  variant="secondary" className="w-full" size="lg"
                  loading={declining} onClick={handleDecline}
                  icon={X}
                >
                  Decline Invitation
                </Button>
              </div>

              <p className="text-center text-xs text-tertiary mt-4 flex items-center justify-center gap-1">
                <Shield size={11}/>
                By accepting, you'll be able to access team projects and collaborate with others.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
