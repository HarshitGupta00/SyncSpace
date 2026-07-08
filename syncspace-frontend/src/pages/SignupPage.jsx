// pages/SignupPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Sparkles, Zap, PenTool, Shield } from "lucide-react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { authService } from "../services";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import { pageVariants } from "../styles/animations";

const FEATURES = [
  { icon: Zap,      color: "bg-violet-100 text-violet-600", title: "Real-time Collaboration", desc: "Work together in real-time with your team." },
  { icon: PenTool,  color: "bg-green-100 text-green-600",   title: "Collaborative Whiteboards", desc: "Brainstorm and visualize ideas together." },
  { icon: Sparkles, color: "bg-amber-100 text-amber-600",   title: "AI Assistant", desc: "Get answers and insights from your content." },
  { icon: Shield,   color: "bg-blue-100 text-blue-600",     title: "Secure & Private", desc: "Enterprise-grade security for your data." },
];

const SignupPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [agreed, setAgreed]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState({});

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())    errs.name    = "Name is required";
    if (!form.email)          errs.email   = "Email is required";
    if (form.password.length < 8) errs.password = "At least 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    if (!agreed)              errs.terms   = "Please accept the terms";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await authService.signup({ name: form.name, email: form.email, password: form.password });
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success("Account created! Welcome to SyncSpace 🎉");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7FB] flex">

      {/* ── Left — Branding Panel ── */}
      <motion.div
        variants={pageVariants} initial="hidden" animate="visible"
        className="hidden lg:flex flex-col justify-between w-[520px] flex-shrink-0 p-12 bg-white border-r border-border"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-primary text-lg">SyncSpace</span>
        </div>

        <div className="flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full w-fit border border-violet-100">
            <Sparkles size={13} />
            <span className="text-xs font-semibold">AI-Powered Collaborative Workspace</span>
          </div>

          <div>
            <h1 className="text-5xl font-bold text-primary leading-tight">
              Create your account<br />
              Start{" "}
              <span className="text-accent-purple">collaborating</span>{" "}
              in real-time.
            </h1>
            <p className="text-secondary text-md mt-4 leading-relaxed max-w-sm">
              Join teams, create documents and whiteboards, and get more done together.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{title}</p>
                  <p className="text-xs text-secondary">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-tertiary">
          <span>Loved by teams at</span>
          {["Acme Inc.", "VisionX", "ByteFlow", "Loopify"].map((b) => (
            <span key={b} className="font-semibold text-secondary">{b}</span>
          ))}
        </div>
      </motion.div>

      {/* ── Right — Form Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">

        <div className="absolute top-6 right-6 text-sm text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="text-accent-purple font-semibold hover:underline">
            Log in
          </Link>
        </div>

        <motion.div
          variants={pageVariants} initial="hidden" animate="visible"
          className="w-full max-w-[420px]"
        >
          <div className="bg-surface rounded-2xl border border-border p-8 shadow-md">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-primary">Sign up</h2>
              <p className="text-secondary text-sm mt-1">Create your SyncSpace account</p>
            </div>

            {/* Google OAuth */}
            <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-primary hover:bg-app transition-colors mb-5">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-tertiary">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input label="Full name" name="name" placeholder="Enter your full name"
                icon={User} value={form.name} onChange={handleChange} error={errors.name} />

              <Input label="Email address" name="email" type="email" placeholder="Enter your email"
                icon={Mail} value={form.email} onChange={handleChange} error={errors.email} />

              <div>
                <Input
                  label="Password" name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  icon={Lock} value={form.password} onChange={handleChange} error={errors.password}
                  iconRight={
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="text-tertiary hover:text-secondary">
                      {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  }
                />
                {!errors.password && (
                  <p className="text-xs text-tertiary mt-1">At least 8 characters with a mix of letters, numbers & symbols</p>
                )}
              </div>

              <Input
                label="Confirm password" name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your password"
                icon={Lock} value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword}
                iconRight={
                  <button type="button" onClick={() => setShowConfirm(p => !p)} className="text-tertiary hover:text-secondary">
                    {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                }
              />

              <div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-border accent-primary flex-shrink-0" />
                  <span className="text-sm text-secondary">
                    I agree to the{" "}
                    <a href="#" className="text-accent-purple hover:underline font-medium">Terms of Service</a>
                    {" "}and{" "}
                    <a href="#" className="text-accent-purple hover:underline font-medium">Privacy Policy</a>
                  </span>
                </label>
                {errors.terms && <p className="text-xs text-status-red mt-1">{errors.terms}</p>}
              </div>

              <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
                Sign up
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-tertiary mt-4 flex items-center justify-center gap-1.5">
            <Shield size={12} />
            Your data is safe with us. We never share your information.
          </p>
        </motion.div>

        <div className="absolute bottom-6 flex items-center gap-4 text-xs text-tertiary">
          <span>© 2025 SyncSpace.</span>
          <a href="#" className="hover:text-secondary">Privacy Policy</a>
          <a href="#" className="hover:text-secondary">Terms of Service</a>
          <a href="#" className="hover:text-secondary">Contact Us</a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
