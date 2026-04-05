import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import ScanCard from "@/components/ScanCard";
import CameraCapture from "@/components/CameraCapture";
import { ScanLine, Upload, History, LogOut } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ChatBot from "@/components/ChatBot";

interface ImageItem {
  url: string;
  file: File;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [images, setImages] = useState<ImageItem[]>([]);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const handleCapture = useCallback((file: File, url: string) => {
    setImages((prev) => [...prev, { file, url }]);
  }, []);

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <ScanLine className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold font-display text-foreground">HeadCount AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/history">
            <Button variant="ghost" size="sm" className="gap-2">
              <History className="h-4 w-4" />
              History
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">New Scan</h1>
          <p className="text-muted-foreground mb-8">
            Upload images or use your camera to count people with AI vision.
          </p>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-8">
            <label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
              <Button asChild variant="default" className="gap-2 shadow-warm cursor-pointer">
                <span>
                  <Upload className="h-4 w-4" />
                  Upload Images
                </span>
              </Button>
            </label>
            <CameraCapture onCapture={handleCapture} />
          </div>

          {/* Image grid */}
          {images.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <ScanCard
                  key={i}
                  imageUrl={img.url}
                  file={img.file}
                  onSaved={() => {}}
                />
              ))}
            </div>
          )}

          {images.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <ScanLine className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No images yet. Upload or capture to get started.</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
