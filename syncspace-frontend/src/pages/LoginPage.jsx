// pages/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Zap, PenTool, Sparkles, Shield } from "lucide-react";
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

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email)    errs.email    = "Email is required";
    if (!form.password) errs.password = "Password is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await authService.login(form);
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
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
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-primary text-lg">SyncSpace</span>
        </div>

        {/* Hero text */}
        <div className="flex flex-col gap-8">
          {/* AI badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full w-fit border border-violet-100">
            <Sparkles size={13} />
            <span className="text-xs font-semibold">AI-Powered Collaborative Workspace</span>
          </div>

          <div>
            <h1 className="text-5xl font-bold text-primary leading-tight">
              Work together.<br />
              Think in{" "}
              <span className="text-accent-purple">sync.</span>
            </h1>
            <p className="text-secondary text-md mt-4 leading-relaxed max-w-sm">
              Real-time documents, whiteboards, and AI assistance in one seamless workspace for modern teams.
            </p>
          </div>

          {/* Feature list */}
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

        {/* Bottom illustration placeholder */}
        <div className="h-36 bg-app rounded-2xl border border-border flex items-center justify-center">
          <p className="text-xs text-tertiary">Live collaboration preview</p>
        </div>
      </motion.div>

      {/* ── Right — Form Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">

        {/* Top right link */}
        <div className="absolute top-6 right-6 text-sm text-secondary">
          Don't have an account?{" "}
          <Link to="/signup" className="text-accent-purple font-semibold hover:underline">
            Sign up
          </Link>
        </div>

        <motion.div
          variants={pageVariants} initial="hidden" animate="visible"
          className="w-full max-w-[400px]"
        >
          {/* Form card */}
          <div className="bg-surface rounded-2xl border border-border p-8 shadow-md">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-primary">Welcome back 👋</h2>
              <p className="text-secondary text-sm mt-1">Log in to your SyncSpace account</p>
            </div>

            {/* Google OAuth button */}
            <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-primary hover:bg-app transition-colors mb-5">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-tertiary">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email address"
                name="email"
                type="email"
                placeholder="Enter your email"
                icon={Mail}
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                autoComplete="email"
              />

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-primary">Password</label>
                  <button type="button" className="text-xs text-accent-purple hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  icon={Lock}
                  value={form.password}
                  onChange={handleChange}
                  error={errors.password}
                  autoComplete="current-password"
                  iconRight={
                    <button type="button" onClick={() => setShowPassword((p) => !p)} className="text-tertiary hover:text-secondary transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border accent-primary" />
                <span className="text-sm text-secondary">Remember me</span>
              </label>

              <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
                Log in
              </Button>
            </form>
          </div>

          {/* Trust badge */}
          <p className="text-center text-xs text-tertiary mt-4 flex items-center justify-center gap-1.5">
            <Shield size={12} />
            Your data is safe with us. We never share your information.
          </p>
        </motion.div>

        {/* Footer */}
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

export default LoginPage;
