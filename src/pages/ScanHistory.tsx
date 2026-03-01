import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ScanLine, ArrowLeft, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface Scan {
  id: string;
  image_url: string;
  headcount: number;
  created_at: string;
}

export default function ScanHistory() {
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load history");
    } else {
      setScans(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScans();
  }, [user]);

  const deleteScan = async (id: string) => {
    const { error } = await supabase.from("scans").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setScans((prev) => prev.filter((s) => s.id !== id));
      toast.success("Scan deleted");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <ScanLine className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold font-display text-foreground">HeadCount AI</span>
        </Link>
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Scan History</h1>
        <p className="text-muted-foreground mb-8">Your previous scans and headcount results.</p>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : scans.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>No scans yet. Go to the dashboard to start scanning!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scans.map((scan, i) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl shadow-card overflow-hidden group"
              >
                <img src={scan.image_url} alt="Scan" className="w-full h-40 object-cover" />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Users className="h-4 w-4" />
                      {scan.headcount} {scan.headcount === 1 ? "person" : "people"}
                    </div>
                    <button
                      onClick={() => deleteScan(scan.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(scan.created_at), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
