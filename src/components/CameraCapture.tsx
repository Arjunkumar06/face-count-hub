import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File, url: string) => void;
}

const cameraPreferenceChain: MediaTrackConstraints[] = [
  { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
  { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } },
  { width: { ideal: 1280 }, height: { ideal: 720 } },
  true as unknown as MediaTrackConstraints,
];

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    setVideoReady(false);
  }, []);

  const waitForVideoReady = useCallback(async (video: HTMLVideoElement) => {
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) return;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Camera stream timed out")), 5000);

      const done = () => {
        clearTimeout(timeout);
        video.removeEventListener("loadeddata", done);
        video.removeEventListener("canplay", done);
        video.removeEventListener("playing", done);
        resolve();
      };

      video.addEventListener("loadeddata", done, { once: true });
      video.addEventListener("canplay", done, { once: true });
      video.addEventListener("playing", done, { once: true });
    });
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Camera is not supported on this browser/device.");
        return;
      }

      stopCamera();

      let stream: MediaStream | null = null;
      for (const videoConstraints of cameraPreferenceChain) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
          if (stream) break;
        } catch {
          // try next fallback
        }
      }

      if (!stream) {
        throw new Error("Could not start camera with available devices.");
      }

      streamRef.current = stream;
      setStreaming(true);

      if (!videoRef.current) throw new Error("Camera preview element not found.");

      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      await waitForVideoReady(video);

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error("Camera opened but no frames are available.");
      }

      setVideoReady(true);
    } catch (error) {
      console.error("Camera error:", error);
      stopCamera();
      alert("Could not access camera. Please allow permissions and try again.");
    }
  }, [stopCamera, waitForVideoReady]);

  const capture = useCallback(() => {
    if (!videoRef.current || !videoReady) return;

    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      alert("Camera frame not ready. Please wait a second and capture again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      alert("Could not capture image from camera.");
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          alert("Capture failed. Please try again.");
          return;
        }

        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        onCapture(file, url);
        stopCamera();
      },
      "image/jpeg",
      0.95
    );
  }, [onCapture, stopCamera, videoReady]);

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
      <video ref={videoRef} className="w-full max-h-64 object-cover" autoPlay playsInline muted />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        <Button onClick={capture} size="sm" disabled={!videoReady}>
          {videoReady ? "Capture" : "Loading..."}
        </Button>
        <Button onClick={stopCamera} size="sm" variant="outline">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
