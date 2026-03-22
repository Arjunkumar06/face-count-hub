import { supabase } from "@/integrations/supabase/client";

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

    const { data, error } = await supabase.functions.invoke("analyze-image", {
      body: { imageBase64: base64 },
    });

    if (error) {
      console.error("AI detection error:", error);
      throw new Error("Detection failed. Please try again.");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      count: data.count ?? 0,
      confidence: data.confidence ?? "unknown",
      details: data.details ?? "",
    };
  } catch (err) {
    console.error("detectFaces error:", err);
    throw err;
  }
}

export async function detectFacesFromFile(file: File): Promise<DetectionResult> {
  try {
    const base64 = await fileToBase64(file);

    const { data, error } = await supabase.functions.invoke("analyze-image", {
      body: { imageBase64: base64 },
    });

    if (error) {
      console.error("AI detection error:", error);
      throw new Error("Detection failed. Please try again.");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      count: data.count ?? 0,
      confidence: data.confidence ?? "unknown",
      details: data.details ?? "",
    };
  } catch (err) {
    console.error("detectFacesFromFile error:", err);
    throw err;
  }
}
