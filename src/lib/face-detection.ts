import { supabase } from "@/integrations/supabase/client";

const CLIENT_SCAN_GAP_MS = 7000;
let scanQueue: Promise<void> = Promise.resolve();
let lastScanStartedAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseInvokeStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;

  const context = (error as { context?: { status?: number } }).context;
  if (typeof context?.status === "number") return context.status;

  const message = (error as { message?: string }).message;
  if (typeof message === "string") {
    const match = message.match(/\b(4\d\d|5\d\d)\b/);
    if (match) return Number(match[1]);
  }

  return undefined;
}

async function enqueueDetection<T>(work: () => Promise<T>): Promise<T> {
  const run = scanQueue.then(async () => {
    const now = Date.now();
    const waitMs = Math.max(0, CLIENT_SCAN_GAP_MS - (now - lastScanStartedAt));
    if (waitMs > 0) await sleep(waitMs);

    lastScanStartedAt = Date.now();
    return work();
  });

  scanQueue = run.then(() => undefined, () => undefined);
  return run;
}

function normalizeDetectionPayload(data: any): DetectionResult {
  return {
    count: data?.count ?? 0,
    confidence: data?.confidence ?? "unknown",
    details: data?.details ?? "",
  };
}

async function invokeAnalyzeImage(base64: string): Promise<DetectionResult> {
  const { data, error } = await supabase.functions.invoke("analyze-image", {
    body: { imageBase64: base64 },
  });

  if (error) {
    console.error("AI detection error:", error);
    const status = parseInvokeStatus(error);
    if (status === 429) {
      throw new Error("RATE_LIMITED");
    }
    throw new Error("Detection failed. Please try again.");
  }

  if (data?.error) {
    const errorText = typeof data.error === "string" ? data.error : "Detection failed. Please try again.";
    if (errorText.toLowerCase().includes("rate limit")) {
      throw new Error("RATE_LIMITED");
    }
    throw new Error(errorText);
  }

  return normalizeDetectionPayload(data);
}

/**
 * Convert an image element to a base64 data URL by drawing it on a canvas.
 */
function imageToBase64(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * Convert a File to a base64 data URL.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// No model loading needed anymore
export async function loadModels() {
  // AI vision is used instead of local models - no loading needed
  return;
}

export interface DetectionResult {
  count: number;
  confidence: string;
  details: string;
}

/**
 * Detect people in an image using AI vision analysis.
 * Analyzes faces, eyes, mouth, ears, hair, nose, teeth, body etc.
 */
export async function detectFaces(imageElement: HTMLImageElement): Promise<number> {
  const result = await detectFacesDetailed(imageElement);
  return result.count;
}

export async function detectFacesDetailed(imageElement: HTMLImageElement): Promise<DetectionResult> {
  try {
    const base64 = imageToBase64(imageElement);
    return await enqueueDetection(() => invokeAnalyzeImage(base64));
  } catch (err) {
    console.error("detectFaces error:", err);
    throw err;
  }
}

export async function detectFacesFromFile(file: File): Promise<DetectionResult> {
  try {
    const base64 = await fileToBase64(file);
    return await enqueueDetection(() => invokeAnalyzeImage(base64));
  } catch (err) {
    console.error("detectFacesFromFile error:", err);
    throw err;
  }
}
