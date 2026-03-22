import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB

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
            "You are an expert crowd-counting model. Count humans in difficult scenes (occlusion, blur, profile view). Return only data for the provided tool call.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Count humans with this strategy: ${passInstruction}. Use facial features (eyes, mouth, nose, ears), hair/head, upper body, silhouettes, hands/arms, and clothing boundaries. Do not count mannequins/statues/posters.`,
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
    throw new Error(`AI_PASS_ERROR:${response.status}:${text}`);
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

    // Ensemble algorithm: precision pass + recall pass, then weighted merge
    const [precisionPass, recallPass] = await Promise.all([
      callVisionPass({
        apiKey: LOVABLE_API_KEY,
        imageContent,
        passInstruction:
          "Precision pass: count only when you can identify distinct human identity boundaries to avoid double counting",
      }),
      callVisionPass({
        apiKey: LOVABLE_API_KEY,
        imageContent,
        passInstruction:
          "Recall pass: include partially visible humans via hair, ears, shoulders, body parts, and occluded profiles",
      }),
    ]);

    const rawScore = (precisionPass.count + recallPass.count * 2) / 3;
    const count = Math.max(precisionPass.count, Math.round(rawScore));
    const disagreement = Math.abs(precisionPass.count - recallPass.count);

    const confidence: "high" | "medium" | "low" =
      disagreement <= 1 ? "high" : disagreement <= 3 ? "medium" : "low";

    const details = `Ensemble result from precision(${precisionPass.count}) + recall(${recallPass.count}) passes. ${recallPass.details || precisionPass.details || ""}`.trim();

    return new Response(JSON.stringify({ count, confidence, details }), {
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
