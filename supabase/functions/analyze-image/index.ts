import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, imageUrl } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the image content part
    let imageContent: any;
    if (imageBase64) {
      imageContent = {
        type: "image_url",
        image_url: { url: imageBase64 },
      };
    } else if (imageUrl) {
      imageContent = {
        type: "image_url",
        image_url: { url: imageUrl },
      };
    } else {
      throw new Error("No image provided");
    }

    const systemPrompt = `You are an expert people-counting AI. Your job is to count the EXACT number of human beings visible in an image.

DETECTION STRATEGY - Use ALL of these cues to identify people:
1. **Faces** - Front-facing, side profile, or partially visible faces
2. **Eyes** - Open or closed eyes
3. **Mouth/Lips** - Visible mouths, smiles, teeth
4. **Nose** - Visible noses from any angle
5. **Ears** - Visible ears, even partially hidden by hair
6. **Hair/Head** - Hair, bald heads, hats, head coverings, helmets
7. **Body silhouettes** - Full or partial body outlines
8. **Hands/Arms** - Visible limbs even if face is hidden
9. **Clothing** - Distinct clothing indicating separate people
10. **Shadows/Reflections** - People visible through shadows or reflections

RULES:
- Count EVERY person visible, even if partially occluded, blurry, far away, or facing away
- If a face is not visible but you can see hair, an ear, a hand, or body, still count that as a person
- People in the background count too
- Do NOT count mannequins, statues, photos-within-photos, or drawings
- If unsure whether something is a person, lean toward counting it

You MUST respond with ONLY a JSON object in this exact format:
{"count": <number>, "confidence": "<high|medium|low>", "details": "<brief description of what you detected>"}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Count the exact number of people in this image. Use all visual cues: faces, eyes, mouths, noses, ears, hair, bodies, hands, clothing. If eyes are closed or not visible, use other features to detect people.",
                },
                imageContent,
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response from the AI
    let result;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse AI response:", content);
      // Try to extract just a number
      const numMatch = content.match(/\d+/);
      result = {
        count: numMatch ? parseInt(numMatch[0]) : 0,
        confidence: "low",
        details: content,
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
