import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScanLine, History, LayoutDashboard, Database, LogOut, Search, Trash2, Calendar, Users, Eye, ArrowUpDown, Download, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import Logo from "@/components/Logo";

interface Scan {
  id: string;
  image_url: string;
  headcount: number;
  created_at: string;
}

export default function ScanHistory() {
  const { user, signOut } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchScans = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load historical database");
    } else {
      setScans(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScans();
  }, [user]);

  const deleteScan = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const { error } = await supabase.from("scans").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete log entry");
    } else {
      setScans((prev) => prev.filter((s) => s.id !== id));
      toast.success("Scan deleted from cloud vault");
      if (selectedScan?.id === id) {
        setSelectedScan(null);
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Portal connection closed");
  };

  const downloadMetadata = (scan: Scan) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `headcount-scan-${scan.id.substring(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Metadata payload downloaded");
  };

  // Stats
  const totalScans = scans.length;
  const avgCount = totalScans ? (scans.reduce((acc, s) => acc + s.headcount, 0) / totalScans).toFixed(1) : "0.0";
  const maxCount = totalScans ? Math.max(...scans.map((s) => s.headcount)) : 0;

  // Search & Filter
  const filteredAndSortedScans = scans
    .filter((scan) => {
      if (!searchQuery) return true;
      const countMatch = scan.headcount.toString().includes(searchQuery);
      const dateString = format(new Date(scan.created_at), "yyyy-MM-dd HH:mm:ss").toLowerCase();
      const dateMatch = dateString.includes(searchQuery.toLowerCase());
      return countMatch || dateMatch;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "highest") return b.headcount - a.headcount;
      if (sortBy === "lowest") return a.headcount - b.headcount;
      return 0;
    });

  return (
    <div className="min-h-screen bg-background bg-grid-cyber flex relative text-white">
      {/* Background radial overlays */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-glow-radial pointer-events-none opacity-40 z-0" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-glow-cyan pointer-events-none opacity-20 z-0" />

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 glass-panel border-r border-white/5 flex flex-col justify-between py-6 px-4 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-8">
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

          <nav className="space-y-1">
            <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 font-medium text-sm transition-all border border-transparent">
              <LayoutDashboard className="h-4.5 w-4.5" />
              Dashboard Console
            </Link>
            <Link to="/history" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 text-cyan-400 border border-white/10 font-medium text-sm transition-all shadow-cyan">
              <History className="h-4.5 w-4.5 text-cyan-400" />
              Scan History Logs
            </Link>
          </nav>
        </div>

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
          {/* Header */}
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Scan Database Log</h1>
            <p className="text-muted-foreground text-sm mt-1">Review historical vision capture records and headcount metrics.</p>
          </div>

          {/* Quick Historical Stats */}
          <section className="grid grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-4 border border-white/5">
              <p className="text-[10px] text-muted-foreground font-mono">SCANS COMMITTED</p>
              <h4 className="text-2xl font-bold font-mono text-white mt-1">{totalScans}</h4>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-white/5">
              <p className="text-[10px] text-muted-foreground font-mono">AVG HEADCOUNT</p>
              <h4 className="text-2xl font-bold font-mono text-cyan-400 mt-1">{avgCount}</h4>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-white/5">
              <p className="text-[10px] text-muted-foreground font-mono">MAX HEADCOUNT</p>
              <h4 className="text-2xl font-bold font-mono text-[#FF5900] mt-1">{maxCount}</h4>
            </div>
          </section>

          {/* Search, Sort and Filters */}
          <section className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search scans (date or count)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/35 border border-white/10 rounded-lg h-10 pl-10 pr-4 text-sm text-white focus:border-cyan-400 focus:ring-cyan-400 placeholder:text-muted-foreground"
              />
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:inline" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-black/35 border border-white/10 rounded-lg h-10 px-3 text-sm text-white focus:border-cyan-400 focus:ring-cyan-400 w-full sm:w-auto font-mono text-[11px] tracking-wider"
              >
                <option value="newest">SORT: NEWEST SCANS</option>
                <option value="oldest">SORT: OLDEST SCANS</option>
                <option value="highest">SORT: HIGHEST COUNT</option>
                <option value="lowest">SORT: LOWEST COUNT</option>
              </select>
            </div>
          </section>

          {/* Grid list logs */}
          {loading ? (
            <div className="text-center py-20 text-muted-foreground">
              <Logo size={40} className="mx-auto animate-spin opacity-30 mb-3" />
              <p className="text-xs font-mono tracking-widest">LOADING HISTORICAL LOGS...</p>
            </div>
          ) : filteredAndSortedScans.length === 0 ? (
            <div className="text-center py-20 border border-white/5 rounded-xl bg-black/10 text-muted-foreground">
              <History className="h-16 w-16 mx-auto mb-4 opacity-10" />
              <p className="text-sm">No historical log entries found.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Execute scans in the Dashboard console to record data.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredAndSortedScans.map((scan, i) => (
                  <motion.div
                    key={scan.id}
                    layoutId={`card-${scan.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedScan(scan)}
                    className="glass-panel rounded-xl overflow-hidden border border-white/5 shadow-elevated group cursor-pointer flex flex-col justify-between"
                  >
                    {/* Capture Frame image */}
                    <div className="relative h-36 bg-black/50 overflow-hidden shrink-0">
                      <img src={scan.image_url} alt="Scan Source" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      
                      {/* Bounding hover overlay */}
                      <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="h-7 w-7 text-cyan-400 drop-shadow-lg" />
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-white font-extrabold text-md">
                          <Users className="h-4 w-4 text-[#FF5900]" />
                          {scan.headcount} {scan.headcount === 1 ? "Person" : "People"}
                        </div>
                        
                        <button
                          onClick={(e) => deleteScan(scan.id, e)}
                          className="text-muted-foreground hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                        <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                        {format(new Date(scan.created_at), "MMM d, yyyy · h:mm a")}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* Details Dialog Viewer Modal */}
      <Dialog open={selectedScan !== null} onOpenChange={(open) => !open && setSelectedScan(null)}>
        <DialogContent className="bg-[#0C0C12] border-white/10 text-white rounded-xl max-w-lg overflow-hidden p-0 shadow-elevated">
          {selectedScan && (
            <>
              {/* Full Header Preview image */}
              <div className="relative w-full aspect-[16/10] bg-black">
                <img src={selectedScan.image_url} alt="Scan Detail" className="w-full h-full object-contain" />
                <div className="absolute top-4 left-4 bg-[#FF5900] text-white text-xs font-mono font-bold px-3 py-1 rounded-full shadow-warm flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {selectedScan.headcount} DETECTED
                </div>
              </div>

              {/* Dialog Content Meta Info */}
              <div className="p-6 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold tracking-tight text-white">Scan Log Details</DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs mt-1">
                    Inspecting cloud record payload for scan transaction.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 border-y border-white/5 py-4">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">RECORD IDENTIFIER:</span>
                    <span className="text-white truncate max-w-xs">{selectedScan.id}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">TIMESTAMP RECORDED:</span>
                    <span className="text-white">
                      {format(new Date(selectedScan.created_at), "yyyy-MM-dd · hh:mm:ss a")}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">COGNITIVE HEADCOUNT:</span>
                    <span className="text-cyan-400 font-bold">{selectedScan.headcount} Attendee(s)</span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => downloadMetadata(selectedScan)}
                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" /> Download JSON
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteScan(selectedScan.id)}
                    className="bg-red-500 hover:bg-red-600 text-white gap-2 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Wipe Record
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
