import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB
const RESULT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESULT_CACHE_MAX_ITEMS = 200;

const resultCache = new Map<string, { expiresAt: number; result: AiCountResult }>();

type AiCountResult = {
  count: number;
  confidence?: "high" | "medium" | "low";
  details?: string;
};

function normalizeResult(result: Partial<AiCountResult>): AiCountResult {
  const count = Number.isFinite(result.count) ? Math.max(0, Math.round(Number(result.count))) : 0;
  const confidence = result.confidence === "high" || result.confidence === "medium" || result.confidence === "low"
    ? result.confidence
    : "low";
  return {
    count,
    confidence,
    details: typeof result.details === "string" ? result.details : "",
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hashImageBase64(imageBase64: string): Promise<string> {
  const bytes = new TextEncoder().encode(imageBase64);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getCachedResult(key: string): AiCountResult | null {
  const cached = resultCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    resultCache.delete(key);
    return null;
  }
  return cached.result;
}

function setCachedResult(key: string, result: AiCountResult) {
  if (resultCache.size >= RESULT_CACHE_MAX_ITEMS) {
    const oldestKey = resultCache.keys().next().value;
    if (oldestKey) resultCache.delete(oldestKey);
  }

  resultCache.set(key, {
    expiresAt: Date.now() + RESULT_CACHE_TTL_MS,
    result,
  });
}

async function callVisionPassWithRetry(args: {
  apiKey: string;
  imageContent: any;
  passInstruction: string;
}, retries = 3): Promise<AiCountResult> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await callVisionPass(args);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.startsWith("AI_PASS_ERROR:429:") && attempt < retries - 1) {
        const retryAfterMatch = msg.match(/^AI_PASS_ERROR:429:([^:]*):/);
        const retryAfterSeconds = Number(retryAfterMatch?.[1]);
        const fallbackDelayMs = 8000 * (attempt + 1);
        const retryAfterMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? retryAfterSeconds * 1000
          : fallbackDelayMs;

        await sleep(retryAfterMs);
        continue;
      }
      throw e;
    }
  }
  throw new Error("Max retries exceeded");
}

async function callVisionPass({
  apiKey,
  imageContent,
  passInstruction,
}: {
  apiKey: string;
  imageContent: any;
  passInstruction: string;
}): Promise<AiCountResult> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are an expert crowd-counting and human-detection model specializing in pixel-level analysis. You excel at counting humans in difficult scenes including occlusion, blur, low light, profile views, and rear views. You analyze images at the pixel level to detect subtle human presence cues. Return only data for the provided tool call.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Count humans with this strategy: ${passInstruction}.

PIXEL-LEVEL DETECTION APPROACH:
1. FACIAL FEATURES (primary cues): Scan for skin-tone pixel clusters forming faces. Identify eyes (dark circular pixel regions with sclera contrast), nose (central facial shadow/highlight gradient), mouth (horizontal pixel band with lip color differentiation), ears (curved skin-tone regions at head sides), eyebrows (dark arched pixel lines above eyes).
2. HAIR & HEAD DETECTION: Detect hair by color and texture patterns — look for consistent pixel regions of black, brown, blonde, red, gray, or white hair tones. Identify head shapes as oval/round pixel clusters above shoulders. Detect hairlines, partings, buns, ponytails, braids as structural cues.
3. SKIN TEXTURE ANALYSIS: Identify exposed skin regions by texture uniformity and color tone (varying across ethnicities). Look for hands, arms, necks, and legs as secondary human indicators.
4. BODY & CLOTHING: Detect torso shapes, shoulder lines, clothing edges with distinct color/texture boundaries against background. Use clothing wrinkle patterns and fabric texture as human presence indicators.
5. SILHOUETTES & PARTIAL VIEWS: For occluded individuals, use partial head tops, single visible shoulders, or arm segments as valid detection cues.
6. DEPTH & OVERLAP: In crowds, use pixel scale differences to identify individuals at varying distances. Separate overlapping heads by detecting subtle color/texture boundaries between adjacent people.

EXCLUSION RULES: Do not count mannequins, statues, posters, photographs, reflections, or non-living human representations. Verify each detection has at least 2 independent human cues (e.g., head shape + skin tone, hair + clothing edge).`,
            },
            imageContent,
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_count",
            description: "Return human count result",
            parameters: {
              type: "object",
              properties: {
                count: { type: "number" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                details: { type: "string" },
              },
              required: ["count", "confidence", "details"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "return_count" } },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const retryAfter = response.headers.get("retry-after") ?? "";
    throw new Error(`AI_PASS_ERROR:${response.status}:${retryAfter}:${text}`);
  }

  const data = await response.json();
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;

  if (!args) {
    const fallbackContent = data?.choices?.[0]?.message?.content;
    if (typeof fallbackContent === "string") {
      try {
        const jsonMatch = fallbackContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) return normalizeResult(JSON.parse(jsonMatch[0]));
      } catch {
        // ignore and throw below
      }
    }
    throw new Error("Model did not return tool arguments");
  }

  return normalizeResult(JSON.parse(args));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Authentication check ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Input validation: body size limit ---
    const bodyText = await req.text();
    if (bodyText.length > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: "Payload too large. Maximum 5MB allowed." }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, imageUrl } = JSON.parse(bodyText);

    // --- Input validation: imageBase64 format ---
    if (imageBase64 && typeof imageBase64 === "string") {
      if (!imageBase64.startsWith("data:image/")) {
        return new Response(JSON.stringify({ error: "Invalid image format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // --- Input validation: reject arbitrary imageUrl (SSRF prevention) ---
    if (imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is not supported. Please send imageBase64." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const imageContent = imageBase64
      ? { type: "image_url", image_url: { url: imageBase64 } }
      : null;

    if (!imageContent) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageHash = await hashImageBase64(imageBase64);
    const cachedResult = getCachedResult(imageHash);
    if (cachedResult) {
      return new Response(JSON.stringify(cachedResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dual-pass strategy for accuracy
    const [pass1, pass2] = await Promise.all([
      callVisionPassWithRetry({
        apiKey: LOVABLE_API_KEY,
        imageContent,
        passInstruction:
          "GRID-BASED ENUMERATION: Mentally divide the image into a 3x3 grid. For EACH of the 9 cells, list every person or partial person visible. Label them by grid cell (e.g., 'Top-Left: Person 1, Person 2'). Include anyone whose head, hair, shoulder, arm, or any body part appears in that cell. After scanning all 9 cells, give the TOTAL. Count partial/occluded people. Err on the side of MORE.",
      }),
      callVisionPassWithRetry({
        apiKey: LOVABLE_API_KEY,
        imageContent,
        passInstruction:
          "FEATURE-BASED ENUMERATION: First, count all clearly visible full faces. Second, count all partially visible faces (profile, back of head, occluded). Third, count any humans visible only by body parts (shoulder, arm, hair top) without a face. For each category give the sub-count, then sum ALL categories for the total. Every distinct human presence counts, even if only hair or a shoulder is visible.",
      }),
    ]);

    // Take the higher count — undercounting is the main problem
    const finalCount = Math.max(pass1.count, pass2.count);
    const finalConfidence = pass1.count === pass2.count ? "high" : 
      Math.abs(pass1.count - pass2.count) <= 1 ? "medium" : "low";

    const result = normalizeResult({
      count: finalCount,
      confidence: finalConfidence,
      details: `Dual-pass: Grid=${pass1.count}, Feature=${pass2.count}. ${pass1.details || ""} ${pass2.details || ""}`.trim(),
    });

    setCachedResult(imageHash, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";

    if (msg.startsWith("AI_PASS_ERROR:429:")) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (msg.startsWith("AI_PASS_ERROR:402:")) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.error("analyze-image error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
