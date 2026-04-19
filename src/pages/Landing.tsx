import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScanLine, Users, History, Camera } from "lucide-react";

const features = [
  { icon: Camera, title: "Upload or Capture", desc: "Use your camera or upload multiple images at once" },
  { icon: Users, title: "AI Detection", desc: "Advanced face detection counts every person accurately" },
  { icon: History, title: "Scan History", desc: "All your scans are saved and accessible anytime" },
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
        <Link to="/auth">
          <Button variant="outline" size="sm">Sign In</Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground leading-tight mb-6">
            Count Every Face,{" "}
            <span className="text-primary">Instantly</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Upload photos or snap a picture — our AI detects and counts every person in seconds. 
            Perfect for events, venues, and crowd management.
          </p>
          <Link to="/auth">
            <Button size="lg" className="shadow-warm text-lg px-8 py-6">
              Get Started
            </Button>
          </Link>
        </motion.div>

        {/* Floating illustration */}
        <motion.div
          className="mt-16 mx-auto w-72 h-48 rounded-2xl bg-card shadow-elevated flex items-center justify-center"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            ))}
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-full shadow-warm">
            5 people detected
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="bg-card rounded-xl p-6 shadow-card text-center"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold font-display text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-muted-foreground">
        © 2026 HeadCount AI. Powered by advanced computer vision.
      </footer>
    </div>
  );
}
