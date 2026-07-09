import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import ScanCard from "@/components/ScanCard";
import CameraCapture from "@/components/CameraCapture";
import { supabase } from "@/integrations/supabase/client";
import { ScanLine, Upload, History, LogOut, LayoutDashboard, Database, Activity, Users, Clock, Flame, ChevronRight, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ImageItem {
  url: string;
  file: File;
}

interface ScanData {
  created_at: string;
  headcount: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [scans, setScans] = useState<ScanData[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch scans to compute stats and chart
  const fetchStats = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("scans")
      .select("created_at, headcount")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setScans(data);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  const handleUploadFiles = (files: File[]) => {
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleUploadFiles(files);
  }, []);

  const handleCapture = useCallback((file: File, url: string) => {
    setImages((prev) => [...prev, { file, url }]);
  }, []);

  const handleLogout = async () => {
    await signOut();
    toast.success("Portal connection closed");
  };

  // Drag and Drop support
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Calculate statistics
  const totalScans = scans.length;
  const totalFaces = scans.reduce((acc, s) => acc + s.headcount, 0);
  const avgFaces = totalScans ? (totalFaces / totalScans).toFixed(1) : "0.0";
  const maxFaces = totalScans ? Math.max(...scans.map((s) => s.headcount)) : 0;

  // Chart data format
  const chartData = scans.map((s) => ({
    time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    count: s.headcount,
  })).slice(-10); // Last 10 scans

  return (
    <div className="min-h-screen bg-background bg-grid-cyber flex relative text-white">
      {/* Background radial overlays */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-glow-radial pointer-events-none opacity-40 z-0" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-glow-cyan pointer-events-none opacity-20 z-0" />

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 glass-panel border-r border-white/5 flex flex-col justify-between py-6 px-4 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-8">
          {/* Logo Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size={36} />
              <span className="text-xl font-extrabold tracking-tight text-white">
                HeadCount <span className="text-[#FF5900]">AI</span>
              </span>
            </div>
            <button className="lg:hidden text-muted-foreground hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Links */}
          <nav className="space-y-1">
            <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 text-cyan-400 border border-white/10 font-medium text-sm transition-all shadow-cyan">
              <LayoutDashboard className="h-4.5 w-4.5 text-cyan-400" />
              Dashboard Console
            </Link>
            <Link to="/history" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 font-medium text-sm transition-all border border-transparent">
              <History className="h-4.5 w-4.5" />
              Scan History Logs
            </Link>
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="space-y-4">
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-xs flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-400" />
            <div className="truncate">
              <p className="font-semibold text-white">Console Session</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-500/10 gap-3 border border-transparent hover:border-red-500/20">
            <LogOut className="h-4.5 w-4.5" />
            Close Connection
          </Button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 min-w-0 flex flex-col z-10">
        {/* Mobile Header Nav */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-white/5 glass-panel">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-extrabold text-white">HeadCount AI</span>
          </div>
          <button className="text-muted-foreground hover:text-white p-1 rounded-md bg-white/5 border border-white/10" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-10">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Console Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">Initiate scanning streams and explore analytics metrics.</p>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat Card 1 */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel rounded-xl p-5 border border-white/5 flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">TOTAL VISION SCANS</p>
                <h3 className="text-3xl font-bold font-mono text-white">{totalScans}</h3>
              </div>
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Activity className="h-5 w-5" />
              </div>
            </motion.div>

            {/* Stat Card 2 */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl p-5 border border-white/5 flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">TOTAL DETECTED HEADS</p>
                <h3 className="text-3xl font-bold font-mono text-[#FF5900]">{totalFaces}</h3>
              </div>
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-[#FF5900]">
                <Users className="h-5 w-5" />
              </div>
            </motion.div>

            {/* Stat Card 3 */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel rounded-xl p-5 border border-white/5 flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">AVERAGE PERSONS / SCAN</p>
                <h3 className="text-3xl font-bold font-mono text-white">{avgFaces}</h3>
              </div>
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Flame className="h-5 w-5" />
              </div>
            </motion.div>

            {/* Stat Card 4 */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-5 border border-white/5 flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">PEAK DETECTED COUNT</p>
                <h3 className="text-3xl font-bold font-mono text-white">{maxFaces}</h3>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
            </motion.div>
          </section>

          {/* Stats Analytics Chart */}
          {chartData.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-panel rounded-xl p-6 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-[#FF5900]" /> Recent Activity Analytics
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF5900" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF5900" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(16,16,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                    <Area type="monotone" dataKey="count" name="Headcount" stroke="#FF5900" strokeWidth={2.5} fillOpacity={1} fill="url(#chartGlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.section>
          )}

          {/* Core Actions: Upload Dropzone & Camera Feed */}
          <section className="grid md:grid-cols-12 gap-6 items-stretch">
            {/* Upload Zone */}
            <div className="md:col-span-8 flex flex-col">
              <label 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative flex-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-cyan-400 bg-cyan-500/5' : 'border-white/10 hover:border-cyan-400/50 bg-black/20 hover:bg-black/30'}`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                />
                
                {/* Glowing Icon Container */}
                <div className={`w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground mb-4 border border-white/5 transition-transform duration-300 ${isDragActive ? 'scale-110 text-cyan-400 border-cyan-500/30' : ''}`}>
                  <Upload className="h-6 w-6" />
                </div>
                
                <h4 className="text-white font-bold text-md">Upload Crowd Images</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-2 leading-relaxed">
                  Drag and drop local image files here, or click to browse. Supports JPEG, PNG, WebP.
                </p>
              </label>
            </div>

            {/* Camera Panel */}
            <div className="md:col-span-4 glass-panel border border-white/5 rounded-xl p-6 flex flex-col justify-between items-center text-center gap-6">
              <div className="space-y-2">
                <h4 className="text-white font-bold text-md">Live Capture scanner</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Snap real-time captures using attached video inputs and feed directly into the analyzer.
                </p>
              </div>
              <div className="w-full flex items-center justify-center py-2">
                <CameraCapture onCapture={handleCapture} />
              </div>
            </div>
          </section>

          {/* Scanned Image Stream Grid */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" /> Active Scan Stream
            </h3>
            
            {images.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {images.map((img, i) => (
                    <ScanCard
                      key={i}
                      imageUrl={img.url}
                      file={img.file}
                      onSaved={fetchStats}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-16 border border-white/5 rounded-xl bg-black/10 text-muted-foreground">
                <ScanLine className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No scans processed in this session.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Upload or capture above to execute detections.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
