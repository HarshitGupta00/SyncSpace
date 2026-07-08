// pages/LandingPage.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, PenTool, Sparkles, Lock, History, Play } from "lucide-react";
import Button from "../components/ui/Button";
import { staggerContainer, staggerItem } from "../styles/animations";

const FEATURES = [
  { icon: Zap,      color: "bg-violet-100 text-violet-600", title: "Real-time Collaboration",    desc: "Edit documents and whiteboards together. See changes instantly." },
  { icon: PenTool,  color: "bg-green-100  text-green-600",  title: "Collaborative Whiteboards",  desc: "Brainstorm, diagram, and map ideas on an infinite canvas with your team." },
  { icon: Sparkles, color: "bg-amber-100  text-amber-600",  title: "AI Assistant",               desc: "Ask questions, get summaries, and extract insights from your content." },
  { icon: Lock,     color: "bg-blue-100   text-blue-600",   title: "Secure & Private",           desc: "Enterprise-grade security with granular permissions." },
  { icon: History,  color: "bg-gray-100   text-gray-600",   title: "Version History",            desc: "Go back in time and restore any version with a click." },
];

const LOGOS = ["Acme Inc.", "ByteFlow", "VisionX", "ShipFast", "Loopify", "Innotech"];

const LandingPage = () => (
  <div className="min-h-screen bg-white">

    {/* ── Nav ── */}
    <nav className="flex items-center justify-between px-12 py-4 border-b border-border sticky top-0 bg-white/95 backdrop-blur-sm z-50">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">S</span>
        </div>
        <span className="font-bold text-primary text-lg">SyncSpace</span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm text-secondary">
        {["Features","Use Cases","Resources","Pricing","About"].map(item => (
          <a key={item} href="#" className="hover:text-primary transition-colors">{item}</a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link to="/login" className="text-sm font-medium text-primary hover:underline">Log in</Link>
        <Link to="/signup">
          <Button size="sm">Get started free</Button>
        </Link>
      </div>
    </nav>

    {/* ── Hero ── */}
    <motion.section
      variants={staggerContainer} initial="hidden" animate="visible"
      className="px-12 py-24 max-w-7xl mx-auto flex items-center gap-16"
    >
      {/* Left copy */}
      <div className="flex-1">
        <motion.div variants={staggerItem}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full border border-violet-100 mb-6"
        >
          <Sparkles size={13} />
          <span className="text-xs font-semibold">AI-Powered Collaborative Workspace</span>
        </motion.div>

        <motion.h1 variants={staggerItem} className="text-7xl font-bold text-primary leading-none mb-6">
          Work together.<br/>Think in sync.
        </motion.h1>

        <motion.p variants={staggerItem} className="text-lg text-secondary leading-relaxed mb-8 max-w-md">
          Real-time docs, whiteboards, and AI assistance — all in one minimalist workspace built for teams that move fast.
        </motion.p>

        <motion.div variants={staggerItem} className="flex items-center gap-3 mb-8">
          <Link to="/signup">
            <Button size="lg">Get started for free</Button>
          </Link>
          <button className="flex items-center gap-2.5 px-5 py-3 border border-border rounded-lg text-sm font-semibold text-primary hover:bg-app transition-colors">
            <Play size={14} className="text-secondary" /> Watch demo
          </button>
        </motion.div>

        <motion.div variants={staggerItem} className="flex items-center gap-6 text-sm text-secondary">
          {[{ icon: Zap, label: "Real-time collaboration" }, { icon: Sparkles, label: "AI Assistant" }, { icon: Lock, label: "Secure & Private" }].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5"><Icon size={13}/> {label}</span>
          ))}
        </motion.div>
      </div>

      {/* Right — App preview */}
      <motion.div variants={staggerItem} className="flex-1 max-w-2xl">
        <div className="bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
          {/* Mini app UI */}
          <div className="flex">
            {/* Sidebar mini */}
            <div className="w-40 bg-surface border-r border-border p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                  <span className="text-white text-2xs font-bold">S</span>
                </div>
                <span className="text-xs font-bold text-primary">SyncSpace</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-secondary">Acme Inc.</div>
              {["Home","Teams","Projects","Whiteboards"].map(item => (
                <div key={item} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs ${item === "Home" ? "bg-app text-primary font-semibold" : "text-secondary"}`}>
                  {item}
                </div>
              ))}
              <div className="mt-2 text-2xs font-semibold text-tertiary uppercase tracking-wider px-2">Favorites</div>
              {["Product Roadmap","Marketing Plan","Design System"].map(f => (
                <div key={f} className="px-2 py-1 text-2xs text-secondary truncate">{f}</div>
              ))}
            </div>

            {/* Content preview */}
            <div className="flex-1 p-6 min-h-[320px]">
              <div className="flex items-center gap-2 mb-4 text-xs text-secondary">
                <span className="font-semibold text-primary text-lg">Project Roadmap</span>
                <span className="ml-auto flex items-center gap-1">
                  {["P","R","A"].map((l,i) => (
                    <span key={i} className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-2xs font-bold flex items-center justify-center -ml-1 first:ml-0">{l}</span>
                  ))}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Overview", color: "bg-blue-50"   },
                  { label: "Goals",    color: "bg-green-50"  },
                  { label: "Q2 Initiatives", color: "bg-amber-50" },
                ].map(({ label, color }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-primary mb-1">{label}</p>
                    <div className={`h-6 ${color} rounded-md`} />
                  </div>
                ))}
              </div>
              {/* Live cursors */}
              {[
                { name: "Priya",  x: "60%",  y: "30%", color: "#FF6B6B" },
                { name: "Rohan",  x: "30%",  y: "60%", color: "#4ECDC4" },
                { name: "Amit",   x: "75%",  y: "70%", color: "#45B7D1" },
              ].map(c => (
                <div key={c.name} className="absolute pointer-events-none" style={{ left: c.x, top: c.y }}>
                  <div className="w-3 h-3 rounded-full border-2 border-white" style={{ background: c.color }} />
                  <span className="text-2xs text-white px-1.5 py-0.5 rounded font-semibold -mt-1 ml-2 whitespace-nowrap" style={{ background: c.color }}>
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>

    {/* ── Trusted by ── */}
    <section className="border-y border-border py-8 px-12">
      <p className="text-center text-sm text-tertiary mb-6">Trusted by teams from</p>
      <div className="flex items-center justify-center gap-12">
        {LOGOS.map(logo => (
          <span key={logo} className="text-sm font-semibold text-secondary opacity-60">{logo}</span>
        ))}
      </div>
    </section>

    {/* ── Features ── */}
    <section className="px-12 py-24 max-w-7xl mx-auto">
      <motion.div
        variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid grid-cols-5 gap-6"
      >
        {FEATURES.map(({ icon: Icon, color, title, desc }) => (
          <motion.div key={title} variants={staggerItem} className="card hover:shadow-lg transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon size={18} />
            </div>
            <h3 className="text-sm font-bold text-primary mb-1">{title}</h3>
            <p className="text-xs text-secondary leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>

    {/* ── CTA ── */}
    <section className="bg-primary py-20 px-12 text-center">
      <h2 className="text-4xl font-bold text-white mb-4">Ready to work in sync?</h2>
      <p className="text-secondary text-lg mb-8 max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
        Join thousands of teams already using SyncSpace to collaborate in real-time.
      </p>
      <Link to="/signup">
        <button className="px-8 py-3.5 bg-white text-primary font-bold rounded-xl hover:bg-gray-50 transition-colors">
          Get started for free
        </button>
      </Link>
    </section>

    {/* ── Footer ── */}
    <footer className="border-t border-border px-12 py-8 flex items-center justify-between text-xs text-tertiary">
      <span>© 2025 SyncSpace. All rights reserved.</span>
      <div className="flex gap-6">
        {["Privacy Policy","Terms of Service","Contact Us"].map(l => (
          <a key={l} href="#" className="hover:text-secondary transition-colors">{l}</a>
        ))}
      </div>
    </footer>
  </div>
);

export default LandingPage;
