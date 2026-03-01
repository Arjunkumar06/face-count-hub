import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File, url: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      alert("Could not access camera. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStreaming(false);
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        onCapture(file, url);
        stopCamera();
      }
    }, "image/jpeg", 0.9);
  }, [onCapture, stopCamera]);

  if (!streaming) {
    return (
      <Button variant="outline" onClick={startCamera} className="gap-2">
        <Camera className="h-4 w-4" />
        Use Camera
      </Button>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden shadow-card">
      <video ref={videoRef} className="w-full max-h-64 object-cover" autoPlay muted />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        <Button onClick={capture} size="sm">Capture</Button>
        <Button onClick={stopCamera} size="sm" variant="outline">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
