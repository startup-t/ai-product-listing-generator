import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { buildListingPrompt } from "@/lib/prompt";
import type {
  GenerateListingResponse,
  ListingDraft,
  PriceSuggestion,
  PlatformGuidance,
  Specifications,
  ConfidenceLevel,
} from "@/types/listing";

export const maxDuration = 60;

// Safe to initialize once. The request handler still validates the key below.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ─────────────────────────────────────────────────────────────────────────────
// extractJSON
// Strips markdown code fences that LLMs occasionally emit despite instructions.
// Locates the first { and last } and slices between them.
// ─────────────────────────────────────────────────────────────────────────────
function extractJSON(raw: string): string {
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) return raw.trim();
  return raw.slice(first, last + 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// callGroqListing
// Sends the vision description to Groq Llama 3.3 and returns raw JSON text.
// ─────────────────────────────────────────────────────────────────────────────
async function callGroqListing(
  visionDescription: string,
  language: "en" | "fil",
  groqApiKey: string
): Promise<string> {
  const groq = new Groq({ apiKey: groqApiKey });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are Seller Agent. You generate structured ecommerce listings. " +
          "Always respond with a single valid JSON object and nothing else. " +
          "No markdown. No code fences. No explanation. JSON only.",
      },
      {
        role: "user",
        content: buildListingPrompt(visionDescription, language),
      },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeListing
// Resolves field-name aliases and guarantees every field the frontend reads
// is present and the correct type.
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeListing(raw: any): ListingDraft {
  const title: string =
    raw.title ?? raw.productTitle ?? raw.product_title ?? raw.name ?? "Untitled product";

  const shortDescription: string =
    raw.shortDescription ?? raw.short_description ?? raw.summary ?? "";

  const fullDescription: string =
    raw.fullDescription ?? raw.full_description ?? raw.description ?? "";

  const category: string =
    raw.category ?? raw.productCategory ?? raw.product_category ?? "General";

  const condition: string =
    raw.condition ?? raw.productCondition ?? "Unknown";

  const VALID_CONFIDENCE: ConfidenceLevel[] = ["high", "medium", "low"];
  const confidence: ConfidenceLevel = VALID_CONFIDENCE.includes(raw.confidence)
    ? (raw.confidence as ConfidenceLevel)
    : "medium";

  const rawFeatures =
    raw.keyFeatures ??
    raw.key_features ??
    raw.bulletPoints ??
    raw.bullet_points ??
    raw.features ??
    raw.highlights ??
    [];

  const keyFeatures: string[] = Array.isArray(rawFeatures)
    ? rawFeatures.filter((x: unknown) => typeof x === "string" && x.trim() !== "")
    : [];

  const rawTags = raw.tags ?? raw.keywords ?? raw.searchTags ?? [];
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags.filter((x: unknown) => typeof x === "string" && x.trim() !== "")
    : [];

  const rawPrice =
    raw.priceSuggestion ??
    raw.price_suggestion ??
    raw.suggestedPrice ??
    raw.suggested_price ??
    raw.price ??
    null;

  let priceSuggestion: PriceSuggestion | null = null;
  if (rawPrice && typeof rawPrice === "object") {
    const rec = Number(rawPrice.recommended ?? rawPrice.price ?? 0);
    priceSuggestion = {
      recommended: Number.isFinite(rec) ? rec : 0,
      range: String(rawPrice.range ?? ""),
      currency: String(rawPrice.currency ?? "PHP"),
      rationale: String(rawPrice.rationale ?? ""),
    };
  }

  const rawSpecs = raw.specifications ?? raw.specs ?? raw.attributes ?? {};
  const specifications: Specifications = {
    colour: rawSpecs.colour ?? rawSpecs.color ?? null,
    material: rawSpecs.material ?? null,
    brand: rawSpecs.brand ?? null,
    size: rawSpecs.size ?? null,
    style: rawSpecs.style ?? null,
  };

  const rawPlat = raw.platformGuidance ?? raw.platform_guidance ?? raw.platforms ?? {};
  const platformGuidance: PlatformGuidance = {
    facebookMarketplace:
      rawPlat.facebookMarketplace ??
      rawPlat.facebook ??
      rawPlat.facebook_marketplace ??
      "",
    shopee: rawPlat.shopee ?? "",
    lazada: rawPlat.lazada ?? "",
    tiktokShop: rawPlat.tiktokShop ?? rawPlat.tiktok_shop ?? rawPlat.tiktok ?? "",
    shopify: rawPlat.shopify ?? "",
  };

  const readyToPostText: string =
    raw.readyToPostText ?? raw.ready_to_post_text ?? raw.readyToPost ?? "";

  const rawFlags = raw.confidenceFlags ?? raw.confidence_flags ?? raw.flags ?? [];
  const confidenceFlags: string[] = Array.isArray(rawFlags)
    ? rawFlags.filter((x: unknown) => typeof x === "string")
    : [];

  return {
    title,
    shortDescription,
    keyFeatures,
    fullDescription,
    tags,
    category,
    condition,
    priceSuggestion,
    confidence,
    specifications,
    platformGuidance,
    readyToPostText,
    confidenceFlags,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest
): Promise<NextResponse<GenerateListingResponse>> {
  // 1. Validate environment
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!groqApiKey || groqApiKey.trim() === "" || groqApiKey === "your_key_here") {
    console.error("[seller-agent] GROQ_API_KEY is not configured");
    return NextResponse.json(
      {
        error: {
          type: "api",
          message: "GROQ_API_KEY is not set",
          hint: "Add GROQ_API_KEY to .env.local. Get a key at console.groq.com",
        },
      },
      { status: 500 }
    );
  }

  if (!geminiApiKey || geminiApiKey.trim() === "" || geminiApiKey === "your_key_here") {
    console.error("[seller-agent] GEMINI_API_KEY is not configured");
    return NextResponse.json(
      {
        error: {
          type: "api",
          message: "GEMINI_API_KEY is not set",
          hint: "Add GEMINI_API_KEY to .env.local. Get a key at Google AI Studio",
        },
      },
      { status: 500 }
    );
  }

  // 2. Parse and validate request body
  let imageBase64: string;
  let mediaType: string;
  let language: "en" | "fil";

  try {
    const body = await req.json();
    imageBase64 = body.imageBase64;
    mediaType = body.mediaType || "image/jpeg";
    language = (body.language === "fil" ? "fil" : "en") as "en" | "fil";

    if (!imageBase64 || typeof imageBase64 !== "string" || imageBase64.length < 100) {
      return NextResponse.json(
        {
          error: {
            type: "validation",
            message: "Missing or invalid imageBase64 in request body",
            hint: "Send { imageBase64: string, mediaType: string, language?: string } in the POST body",
          },
        },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      {
        error: {
          type: "validation",
          message: "Request body is not valid JSON",
          hint: "Ensure Content-Type: application/json and a valid JSON body",
        },
      },
      { status: 400 }
    );
  }

  // 3. Step 1 — Gemini vision analysis
  let visionDescription: string;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Describe the product in this image for an online marketplace listing. " +
                "Focus on product type, visible color, material, design details, brand cues, " +
                "condition clues, and any features a seller would mention.",
            },
            {
              inlineData: {
                mimeType: mediaType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const caption = response.text;
    if (!caption || caption.trim() === "") {
      throw new Error("Gemini returned empty caption");
    }

    visionDescription = caption;
    console.log("[seller-agent] Gemini caption:", caption);
  } catch (err: unknown) {
    console.error("[seller-agent] Gemini error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();

    if (message.includes("401") || lower.includes("invalid api key")) {
      return NextResponse.json(
        {
          error: {
            type: "api",
            message: "Gemini API key is invalid (401)",
            hint: "Check GEMINI_API_KEY in .env.local.",
          },
        },
        { status: 401 }
      );
    }

    if (message.includes("404") || lower.includes("not found") || lower.includes("model")) {
      return NextResponse.json(
        {
          error: {
            type: "api",
            message: "Gemini model was not found for this API version",
            hint: "Use model: gemini-flash-latest and make sure @google/genai is up to date.",
          },
        },
        { status: 404 }
      );
    }

    if (message.includes("429") || lower.includes("rate limit")) {
      return NextResponse.json(
        {
          error: {
            type: "api",
            message: "Gemini rate limit exceeded (429)",
            hint: "Wait a moment and retry.",
          },
        },
        { status: 429 }
      );
    }

    if (message.includes("503") || lower.includes("unavailable")) {
      return NextResponse.json(
        {
          error: {
            type: "api",
            message: "Gemini service temporarily unavailable",
            hint: "Retry after a few seconds.",
          },
        },
        { status: 503 }
      );
    }

    if (lower.includes("fetch") || lower.includes("network")) {
      return NextResponse.json(
        {
          error: {
            type: "network",
            message: "Could not reach Gemini API",
            hint: "Check your internet connection.",
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: {
          type: "api",
          message: `Vision step failed: ${message}`,
          hint: "Try again or check the Gemini API status.",
        },
      },
      { status: 500 }
    );
  }

  // 4. Step 2 — Groq listing generation
  let rawText: string;

  try {
    console.log("Prompt language:", language);
    rawText = await callGroqListing(visionDescription, language, groqApiKey);
    console.log("[seller-agent] Groq response (first 500 chars):", rawText.slice(0, 500));
  } catch (err: unknown) {
    console.error("[seller-agent] Groq error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();

    if (message.includes("401") || lower.includes("invalid api key")) {
      return NextResponse.json(
        {
          error: {
            type: "api",
            message: "Groq API key is invalid (401)",
            hint: "Check GROQ_API_KEY in .env.local. Get a free key at console.groq.com",
          },
        },
        { status: 401 }
      );
    }

    if (message.includes("429") || lower.includes("rate limit")) {
      return NextResponse.json(
        {
          error: {
            type: "api",
            message: "Groq rate limit exceeded (429)",
            hint: "Wait a moment and retry.",
          },
        },
        { status: 429 }
      );
    }

    if (message.includes("503") || lower.includes("unavailable")) {
      return NextResponse.json(
        {
          error: {
            type: "api",
            message: "Groq service temporarily unavailable",
            hint: "Retry after a few seconds.",
          },
        },
        { status: 503 }
      );
    }

    if (lower.includes("fetch") || lower.includes("network")) {
      return NextResponse.json(
        {
          error: {
            type: "network",
            message: "Could not reach Groq API",
            hint: "Check your internet connection.",
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: {
          type: "api",
          message: `Groq listing generation failed: ${message}`,
          hint: "Try again or check status at status.groq.com",
        },
      },
      { status: 500 }
    );
  }

  // 5. Sanitise
  const cleanText = extractJSON(rawText);
  console.log(
    "[seller-agent] Cleaned JSON before parse (first 300 chars):",
    cleanText.slice(0, 300)
  );

  // 6. Parse
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;

  try {
    parsed = JSON.parse(cleanText);
  } catch {
    console.error(
      "[seller-agent] JSON.parse failed.\n  raw  :",
      rawText.slice(0, 600),
      "\n  clean:",
      cleanText.slice(0, 600)
    );

    return NextResponse.json(
      {
        error: {
          type: "parse",
          message: "Groq returned text that could not be parsed as JSON",
          hint: "Try again. If this keeps happening, the model prompt may need adjustment.",
        },
      },
      { status: 500 }
    );
  }

  // 7. Normalize
  const listing: ListingDraft = normalizeListing(parsed);

  console.log(
    "[seller-agent] Listing ready —",
    `title: "${listing.title}" |`,
    `keyFeatures: ${listing.keyFeatures.length} |`,
    `tags: ${listing.tags.length} |`,
    `shortDesc: ${listing.shortDescription.length} chars |`,
    `fullDesc: ${listing.fullDescription.length} chars`
  );

  return NextResponse.json({ listing });
}