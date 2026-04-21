import { useState, useRef } from "react";
import { detectFacesDetailed, type DetectionResult } from "@/lib/face-detection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Eye, Info } from "lucide-react";
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
      // Wait for image to be fully loaded
      if (!imgRef.current.complete) {
        await new Promise<void>((resolve) => {
          imgRef.current!.onload = () => resolve();
        });
      }
      const detection = await detectFacesDetailed(imgRef.current);
      setResult(detection);

      // Upload image and save scan
      if (user && file) {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("scan-images")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Failed to save image");
          return;
        }

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("scan-images")
          .createSignedUrl(filePath, 3600);

        if (signedUrlError || !signedUrlData?.signedUrl) {
          console.error("Signed URL error:", signedUrlError);
          toast.error("Failed to generate image URL");
          return;
        }

        const { error: insertError } = await supabase.from("scans").insert({
          user_id: user.id,
          image_url: signedUrlData.signedUrl,
          headcount: detection.count,
        });

        if (insertError) {
          console.error("Insert error:", insertError);
          toast.error("Failed to save scan");
        } else {
          setSaved(true);
          onSaved?.();
          toast.success(`Detected ${detection.count} ${detection.count === 1 ? "person" : "people"}!`);
        }
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "";
      if (message === "RATE_LIMITED") {
        toast.error("Too many scans in a short time. Please wait a few seconds and try again.");
      } else if (message === "AI_CREDITS_EXHAUSTED") {
        toast.error("AI credits are exhausted. Add credits in Settings, then try again.");
      } else {
        toast.error("Detection failed. Please try again.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-card overflow-hidden"
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Scan"
        crossOrigin="anonymous"
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        {result !== null ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-lg">
              <Users className="h-5 w-5" />
              {result.count} {result.count === 1 ? "person" : "people"} detected
              {saved && <span className="text-xs text-muted-foreground ml-auto">Saved ✓</span>}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              Confidence: <span className="font-medium capitalize">{result.confidence}</span>
            </div>
            {result.details && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{result.details}</span>
              </div>
            )}
          </div>
        ) : (
          <Button onClick={handleAnalyze} disabled={analyzing} className="w-full shadow-warm">
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI Analyzing...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
