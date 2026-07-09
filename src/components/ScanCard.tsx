import { useState, useRef } from "react";
import { detectFacesDetailed, type DetectionResult } from "@/lib/face-detection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Eye, Info, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ScanCardProps {
  imageUrl: string;
  file?: File;
  onSaved?: () => void;
}

export default function ScanCard({ imageUrl, file, onSaved }: ScanCardProps) {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saved, setSaved] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { user } = useAuth();

  const handleAnalyze = async () => {
    if (!imgRef.current) return;
    setAnalyzing(true);
    try {
      if (!imgRef.current.complete) {
        await new Promise<void>((resolve) => {
          imgRef.current!.onload = () => resolve();
        });
      }
      const detection = await detectFacesDetailed(imgRef.current);
      setResult(detection);

      if (user && file) {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("scan-images")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Failed to upload scan image to cloud vault");
          return;
        }

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("scan-images")
          .createSignedUrl(filePath, 3600);

        if (signedUrlError || !signedUrlData?.signedUrl) {
          console.error("Signed URL error:", signedUrlError);
          toast.error("Failed to generate secure URL");
          return;
        }

        const { error: insertError } = await supabase.from("scans").insert({
          user_id: user.id,
          image_url: signedUrlData.signedUrl,
          headcount: detection.count,
        });

        if (insertError) {
          console.error("Insert error:", insertError);
          toast.error("Failed to commit scan records to database");
        } else {
          setSaved(true);
          onSaved?.();
          toast.success(`Success! Detected ${detection.count} person(s).`);
        }
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "";
      if (message === "RATE_LIMITED") {
        toast.error("Vision API limit reached. Please wait a moment.");
      } else if (message === "AI_CREDITS_EXHAUSTED") {
        toast.error("Credits depleted. Refill in billing configuration.");
      } else {
        toast.error("Vision pipeline error. Please retry scan.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Determine colors based on confidence
  const getConfidenceStyles = (conf: string) => {
    const value = conf.toLowerCase();
    if (value === "high") {
      return { text: "text-emerald-400", bg: "bg-emerald-500/20", progress: "w-full bg-emerald-400" };
    }
    if (value === "medium" || value === "average") {
      return { text: "text-[#FF5900]", bg: "bg-orange-500/20", progress: "w-2/3 bg-[#FF5900]" };
    }
    return { text: "text-amber-400", bg: "bg-amber-500/20", progress: "w-1/3 bg-amber-400" };
  };

  const confidence = result ? getConfidenceStyles(result.confidence) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-panel rounded-xl overflow-hidden shadow-elevated border border-white/5 group flex flex-col justify-between"
    >
      {/* Image Container with Scan Line */}
      <div className="relative w-full h-44 bg-black/60 overflow-hidden shrink-0">
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Scan Source"
          crossOrigin="anonymous"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Holographic Laser Scanner Line (Only active when analyzing) */}
        {analyzing && <div className="animate-scan-line" />}
        {analyzing && (
          <div className="absolute inset-0 bg-cyan-500/5 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 animate-pulse uppercase">
                ANALYZING PIXELS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Details Box */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        {result !== null ? (
          <div className="space-y-4">
            {/* Top row result */}
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">RESULT</span>
                <div className="flex items-center gap-2 text-white font-extrabold text-lg">
                  <Users className="h-5 w-5 text-[#FF5900]" />
                  {result.count} {result.count === 1 ? "Person" : "People"}
                </div>
              </div>

              {saved && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> COMMITTED
                </div>
              )}
            </div>

            {/* Confidence metric indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>CONFIDENCE</span>
                <span className={`font-bold uppercase ${confidence?.text}`}>{result.confidence}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${confidence?.progress}`} />
              </div>
            </div>

            {/* Sub-text notes */}
            {result.details && (
              <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground bg-white/5 border border-white/5 p-2 rounded">
                <Info className="h-3.5 w-3.5 mt-0.5 text-cyan-400 shrink-0" />
                <span className="leading-normal font-mono">{result.details}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <div className="text-center text-xs text-muted-foreground leading-relaxed">
              Image loaded and prepared. Activate AI computer vision model to detect attendees.
            </div>
            
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold shadow-cyan rounded-lg transition-all h-10 gap-2 flex items-center justify-center"
            >
              <Eye className="h-4.5 w-4.5" />
              Analyze Frame
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
