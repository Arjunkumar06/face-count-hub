import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: Access denied or route non-existent:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background bg-grid-cyber flex flex-col items-center justify-center relative p-6 text-white text-center">
      {/* Background ambient overlays */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-glow-radial pointer-events-none opacity-40 z-0" />
      
      <div className="glass-panel rounded-2xl p-8 border border-white/10 max-w-md w-full relative z-10 space-y-6 shadow-elevated">
        <div className="flex flex-col items-center gap-3">
          <Logo size={48} className="animate-glow-pulse" />
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mt-2">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">404 ROUTE SHIELD</h1>
          <p className="text-sm font-mono text-cyan-400 uppercase tracking-widest">[ PAGE NOT RECONSTRUCTED ]</p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          The grid sector you attempted to query does not contain active routes. Please return to standard checkpoints.
        </p>

        <Link to="/" className="block">
          <Button className="w-full bg-[#FF5900] hover:bg-[#E04E00] text-white shadow-warm rounded-lg h-11 gap-2">
            <ArrowLeft className="h-4 w-4" /> Return to Safe Sector
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
