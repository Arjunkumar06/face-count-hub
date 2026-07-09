import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { lovable } from "@/integrations/lovable/index";
import Logo from "@/components/Logo";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success("Account created! Welcome to HeadCount AI.");
      } else {
        await signIn(email, password);
        toast.success("Authentication successful!");
      }
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.message === "Failed to fetch" 
        ? "Network latency detected. Retrying gateway connection..." 
        : (err?.message || "Authentication credentials rejected");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid-cyber flex flex-col lg:flex-row relative overflow-hidden">
      {/* Visual Ambient Light */}
      <div className="absolute top-[-30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-glow-radial pointer-events-none opacity-40" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-glow-cyan pointer-events-none opacity-40" />

      {/* Left side: Cyberpunk AI Graphics Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-black/40 border-r border-white/5 flex-col justify-between p-12 relative overflow-hidden">
        {/* Floating background neural nodes */}
        <div className="absolute inset-0 opacity-20 flex items-center justify-center">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="dotpattern" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="rgba(0, 240, 255, 0.4)" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dotpattern)" />
          </svg>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Logo size={40} />
          <span className="text-2xl font-extrabold tracking-tight text-white">
            HeadCount <span className="text-[#FF5900]">AI</span>
          </span>
        </div>

        <div className="space-y-6 relative z-10 my-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Access the Next Generation <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-[#FF5900]">
                of Audience Analytics.
              </span>
            </h2>
            <p className="text-muted-foreground text-md max-w-md mt-4 leading-relaxed">
              Log in to process images, manage detection logs, review spatial heatmaps, and extract structured audience metrics.
            </p>
          </motion.div>

          {/* Interactive UI card inside left panel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-panel rounded-xl p-5 border border-white/10 flex items-center gap-4 max-w-sm"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Secure Vision Gateway</h4>
              <p className="text-xs text-muted-foreground mt-0.5">End-to-end data encryption of crowd scans.</p>
            </div>
          </motion.div>
        </div>

        <div className="text-xs text-muted-foreground relative z-10">
          © 2026 HeadCount AI. All connections are secured under TLS 1.3.
        </div>
      </div>

      {/* Right side: Auth Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass-panel rounded-2xl shadow-elevated p-8 border border-white/10 relative overflow-hidden"
        >
          {/* Top Logo for mobile view */}
          <div className="flex items-center gap-3 justify-center mb-8 lg:hidden">
            <Logo size={36} />
            <span className="text-xl font-extrabold text-white">HeadCount AI</span>
          </div>

          <h3 className="text-3xl font-extrabold text-white text-center tracking-tight mb-2">
            {isSignUp ? "Initialize Profile" : "Portal Entry"}
          </h3>
          <p className="text-muted-foreground text-sm text-center mb-8">
            {isSignUp ? "Set up your credentials to begin vision scans." : "Enter credentials to access headcount console."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground font-mono">EMAIL ADDRESS</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@headcount.ai"
                required
                className="bg-black/30 border-white/10 focus:border-cyan-400 focus:ring-cyan-400 text-white rounded-lg h-11"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs text-muted-foreground font-mono">ACCESS PASSWORD</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-black/30 border-white/10 focus:border-cyan-400 focus:ring-cyan-400 text-white rounded-lg h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#FF5900] hover:bg-[#E04E00] text-white shadow-warm rounded-lg h-11 transition-all mt-4 flex items-center justify-center font-bold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting Portal...
                </>
              ) : isSignUp ? (
                "Initialize Account"
              ) : (
                "Authorize Gateway"
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">OR OAUTH AUTHENTICATION</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-lg h-11 font-medium transition-colors"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) toast.error("Google SSO verification failed. Please try again.");
            }}
          >
            <svg className="h-4 w-4 mr-2.5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-8">
            {isSignUp ? "Already registered?" : "New operator?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-cyan-400 font-bold hover:underline font-mono"
            >
              {isSignUp ? "PORTAL SIGNIN" : "CREATE PROFILE"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
