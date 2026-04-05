import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are HeadCount AI's friendly assistant. Answer questions about the HeadCount AI app concisely.

HeadCount AI is a web application that uses AI vision to count people in images. Here's what you know:

**Features:**
- Upload images or use your device camera to capture photos
- AI-powered people counting using advanced dual-pass vision analysis (grid-based + feature-based)
- Results show headcount, confidence level (high/medium/low), and analysis details
- Scan history page to review past scans
- Secure authentication required to use the app

**How it works:**
1. Users upload or capture an image on the Dashboard
2. Click "Analyze with AI" on any image card
3. The AI uses Google Gemini Pro vision model with two parallel analysis passes for accuracy
4. The higher count from both passes is used to minimize undercounting
5. Results are saved automatically with the image to scan history

**Technical details:**
- Uses dual-pass AI analysis: Grid-based enumeration (3x3 grid scan) and Feature-based enumeration (faces, partial faces, body parts)
- Confidence is "high" when both passes agree, "medium" when off by 1, "low" when they differ more
- Images are stored securely and scans are tied to authenticated users
- Maximum upload size is 5MB per image

**Tips for best results:**
- Use well-lit images for higher accuracy
- Front-facing group photos work best
- The AI can detect partially hidden people (occluded, profile views, rear views)
- For large crowds, results may vary — check the confidence level

If asked about something unrelated to HeadCount AI, politely redirect the conversation back to the app.`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
