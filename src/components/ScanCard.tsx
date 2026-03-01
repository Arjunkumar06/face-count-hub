import { useState, useRef } from "react";
import { detectFaces } from "@/lib/face-detection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ScanCardProps {
  imageUrl: string;
  file?: File;
  onSaved?: () => void;
}

export default function ScanCard({ imageUrl, file, onSaved }: ScanCardProps) {
  const [count, setCount] = useState<number | null>(null);
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
      const faces = await detectFaces(imgRef.current);
      setCount(faces);

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

        const { data: urlData } = supabase.storage
          .from("scan-images")
          .getPublicUrl(filePath);

        const { error: insertError } = await supabase.from("scans").insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
          headcount: faces,
        });

        if (insertError) {
          console.error("Insert error:", insertError);
          toast.error("Failed to save scan");
        } else {
          setSaved(true);
          onSaved?.();
          toast.success(`Detected ${faces} ${faces === 1 ? "person" : "people"}!`);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Detection failed");
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
        {count !== null ? (
          <div className="flex items-center gap-2 text-primary font-semibold text-lg">
            <Users className="h-5 w-5" />
            {count} {count === 1 ? "person" : "people"} detected
            {saved && <span className="text-xs text-muted-foreground ml-auto">Saved ✓</span>}
          </div>
        ) : (
          <Button onClick={handleAnalyze} disabled={analyzing} className="w-full shadow-warm">
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
