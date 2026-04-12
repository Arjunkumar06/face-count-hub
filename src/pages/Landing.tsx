import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScanLine, Users, Globe, Shield, BarChart3, ChevronDown, Scan } from "lucide-react";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import detectionPreview from "@/assets/detection-preview.jpg";

const features = [
  { icon: Globe, title: "Real-time Edge AI", desc: "Process images instantly with cutting-edge AI models" },
  { icon: BarChart3, title: "Scalable Crowd Analytics", desc: "Handle any crowd size with accurate counting" },
  { icon: Shield, title: "Secure & Privacy-Focused", desc: "Your data stays protected with enterprise-grade security" },
  { icon: Scan, title: "Venue API Integration", desc: "Connect seamlessly with your existing venue systems" },
];

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <ScanLine className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold font-display text-foreground">HeadCount AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <button className="flex items-center gap-1 hover:text-primary transition-colors">
            Solutions <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <a href="#" className="hover:text-primary transition-colors">Pricing</a>
          <a href="#" className="hover:text-primary transition-colors">About</a>
        </div>
        <Link to="/auth">
          <Button variant="outline" size="sm" className="rounded-full px-5">Sign In</Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-tight mb-6">
            Count Every Face,{" "}
            <span className="text-primary">Instantly.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            From outdoor festivals to corporate buildings — our edge AI delivers
            millisecond-precision counting and flow metrics for venues and crowd management.
          </p>
          <Link to="/auth">
            <Button size="lg" className="shadow-warm text-lg px-10 py-6 rounded-full">
              Get Started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Feature showcase section */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* Left: Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="rounded-2xl overflow-hidden shadow-elevated bg-card"
          >
            <img
              src={dashboardPreview}
              alt="Venue heatmap analytics dashboard"
              className="w-full h-auto"
              loading="lazy"
              width={640}
              height={512}
            />
          </motion.div>

          {/* Center: Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col justify-center py-4"
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8">
              Feature Highlights
            </h2>
            <div className="space-y-6">
              {features.map((f) => (
                <div key={f.title} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{f.title}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Detection preview card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            {/* Detection icon */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <Scan className="h-7 w-7 text-primary" />
              </div>
            </div>

            {/* Detection image */}
            <div className="rounded-2xl overflow-hidden shadow-elevated bg-card">
              <img
                src={detectionPreview}
                alt="Real-time person detection in a building lobby"
                className="w-full h-48 object-cover"
                loading="lazy"
                width={512}
                height={512}
              />
            </div>

            {/* Count result card */}
            <div className="bg-card rounded-2xl shadow-card p-5 text-center">
              <div className="text-4xl font-bold text-primary mb-3">5</div>
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
              <div className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full">
                5 people detected
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scroll indicator */}
      <div className="flex justify-center py-8">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </div>

      <footer className="text-center py-8 text-sm text-muted-foreground">
        © 2026 HeadCount AI. Powered by advanced computer vision.
      </footer>
    </div>
  );
}
