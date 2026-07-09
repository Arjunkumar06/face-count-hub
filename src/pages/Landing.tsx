import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, History, Camera, ArrowRight, ShieldCheck, Zap, Layers } from "lucide-react";
import Logo from "@/components/Logo";

const features = [
  { 
    icon: Camera, 
    title: "Dual Capture Modes", 
    desc: "Seamlessly snap live footage via webcam or batch upload drag-and-drop images in high definition.",
    color: "from-amber-500 to-orange-600"
  },
  { 
    icon: Users, 
    title: "AI Vision Precision", 
    desc: "State-of-the-art neural networks map facial keypoints, detecting overlapping and crowded profiles.",
    color: "from-cyan-400 to-blue-500"
  },
  { 
    icon: History, 
    title: "Secure Scan Log", 
    desc: "Retrieve, filter, and inspect your full scanning timeline. Secured, encrypted, and accessible on-demand.",
    color: "from-violet-500 to-purple-600"
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background bg-grid-cyber relative overflow-hidden">
      {/* Background Auroras */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-glow-radial pointer-events-none opacity-80" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-glow-cyan pointer-events-none opacity-60" />

      {/* Nav */}
      <nav className="relative flex items-center justify-between px-6 py-5 max-w-6xl mx-auto z-50">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <span className="text-2xl font-extrabold tracking-tight text-white font-sans bg-clip-text">
            HeadCount <span className="text-[#FF5900]">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-muted-foreground hover:text-white transition-colors">
              Sign In
            </Button>
          </Link>
          <Link to="/auth?signup=true">
            <Button className="bg-[#FF5900] hover:bg-[#E04E00] text-white shadow-warm rounded-full px-5">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-12 gap-12 items-center z-10">
        <div className="lg:col-span-7 space-y-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-cyan-400 font-medium"
          >
            <Zap className="h-3.5 w-3.5" /> Powered by Advanced Computer Vision
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white"
          >
            Count Every Face. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF5900] to-[#FF9E00]">
              Zero Latency.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
          >
            Upload photos, capture crowds, and track attendee metrics with precision. Perfect for events, security checkpoints, and analytics mapping.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <Link to="/auth">
              <Button size="lg" className="bg-[#FF5900] hover:bg-[#E04E00] text-white shadow-warm text-md px-8 py-6 rounded-full gap-2">
                Launch Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-3 gap-6 pt-10 border-t border-white/10 max-w-md"
          >
            <div>
              <h4 className="text-3xl font-extrabold text-white font-mono">99.8%</h4>
              <p className="text-xs text-muted-foreground mt-1">Detection Accuracy</p>
            </div>
            <div>
              <h4 className="text-3xl font-extrabold text-white font-mono">&lt; 1.2s</h4>
              <p className="text-xs text-muted-foreground mt-1">Processing Time</p>
            </div>
            <div>
              <h4 className="text-3xl font-extrabold text-white font-mono">10K+</h4>
              <p className="text-xs text-muted-foreground mt-1">Daily Detections</p>
            </div>
          </motion.div>
        </div>

        {/* 3D Showcase Panel & Live Scan Simulator */}
        <div className="lg:col-span-5 perspective-1000">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative transform-style-3d glass-panel-glow rounded-2xl p-6 shadow-elevated w-full aspect-[4/3] flex flex-col justify-between overflow-hidden"
          >
            {/* Holographic Laser Scanner Line */}
            <div className="animate-scan-line" />

            {/* Top Bar of Simulator */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-cyan-400 font-mono tracking-widest uppercase animate-pulse">
                [ SCANNING ACTIVE ]
              </span>
            </div>

            {/* Scanning Arena (Grid with mock face markers) */}
            <div className="relative flex-1 my-4 bg-black/40 rounded-lg overflow-hidden flex items-center justify-center border border-white/5">
              {/* Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px]" />

              {/* Simulated Crowd Image & Bounding Boxes */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Mock Bounding Box 1 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
                  transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
                  className="absolute top-1/4 left-1/4 w-14 h-14 border-2 border-cyan-400 rounded-sm"
                >
                  <span className="absolute -top-5 left-0 bg-cyan-400 text-black text-[9px] font-mono px-1 py-0.5 rounded">
                    P01: 99.4%
                  </span>
                  {/* Facial points inside box */}
                  <span className="absolute top-3 left-3 w-1 h-1 rounded-full bg-cyan-300" />
                  <span className="absolute top-3 right-3 w-1 h-1 rounded-full bg-cyan-300" />
                  <span className="absolute bottom-4 left-6 w-1 h-1 rounded-full bg-orange-400" />
                </motion.div>

                {/* Mock Bounding Box 2 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
                  transition={{ repeat: Infinity, duration: 4, delay: 1.2 }}
                  className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-[#FF5900] rounded-sm"
                >
                  <span className="absolute -top-5 left-0 bg-[#FF5900] text-white text-[9px] font-mono px-1 py-0.5 rounded">
                    P02: 98.7%
                  </span>
                  <span className="absolute top-4 left-4 w-1 h-1 rounded-full bg-orange-300" />
                  <span className="absolute top-4 right-4 w-1 h-1 rounded-full bg-orange-300" />
                  <span className="absolute bottom-5 left-7 w-1 h-1 rounded-full bg-cyan-400" />
                </motion.div>

                {/* Mock Bounding Box 3 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
                  transition={{ repeat: Infinity, duration: 4, delay: 1.8 }}
                  className="absolute bottom-1/4 left-1/3 w-12 h-12 border-2 border-purple-500 rounded-sm"
                >
                  <span className="absolute -top-5 left-0 bg-purple-500 text-white text-[9px] font-mono px-1 py-0.5 rounded">
                    P03: 97.2%
                  </span>
                  <span className="absolute top-3 left-3 w-1 h-1 rounded-full bg-purple-300" />
                  <span className="absolute top-3 right-3 w-1 h-1 rounded-full bg-purple-300" />
                </motion.div>

                <div className="absolute text-center">
                  <Logo size={64} className="opacity-15 animate-[spin_24s_linear_infinite] mx-auto" />
                </div>
              </div>
            </div>

            {/* Bottom Bar: Live counter */}
            <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#FF5900]" />
                <span className="text-xs text-muted-foreground font-mono">TARGET_COUNT:</span>
              </div>
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-lg font-mono font-bold text-white"
              >
                3 PEOPLE DETECTED
              </motion.span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="max-w-6xl mx-auto px-6 py-32 z-10 relative">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            Built for Innovative Crowd Management
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Supercharge venue and event logistics using our specialized vision pipeline.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="group relative rotate-y-hover transform-style-3d transition-transform duration-300 ease-out glass-panel rounded-2xl p-8 hover:border-white/20 hover:shadow-card cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-md transition-transform group-hover:scale-110`}>
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FF5900] transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-12 text-center text-sm text-muted-foreground z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-bold text-white">HeadCount AI</span>
          </div>
          <p>© 2026 HeadCount AI. All rights reserved. Powered by Neural Core Vision.</p>
        </div>
      </footer>
    </div>
  );
}
