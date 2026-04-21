import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultCurrency,
  getDefaultLanguage,
  isSupportedCountry,
  isSupportedCurrency,
  isSupportedLanguage,
  type CountryCode,
  type CurrencyCode,
  type LanguageCode,
} from "@/lib/localization";
import type {
  GenerateListingResponse,
  ListingDraft,
} from "@/types/listing";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

const GEMINI_MODEL = "gemini-flash-latest";

function extractJSON(raw: string): string {
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) return raw.trim();
  return raw.slice(first, last + 1);
}

async function generateListingFromImage(
  base64Image: string,
  mediaType = "image/jpeg"
): Promise<{
  title: string;
  price: number;
  description: string;
  category: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_key_here") {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "Analyze this product image and generate a Shopee-ready listing for the Philippines. " +
              "Return only a valid JSON object with exactly these fields: " +
              'title (string), price (number in PHP), description (string), category (string). ' +
              "Keep the title concise, the description clear and buyer-friendly, and the category specific.",
          },
          {
            inlineData: {
              mimeType: mediaType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const raw = extractJSON(response.text ?? "");
  if (!raw) {
    throw new Error("Gemini returned an empty response");
  }

  const parsed = JSON.parse(raw) as Partial<{
    title: string;
    price: number | string;
    description: string;
    category: string;
  }>;

  const title = parsed.title?.trim();
  const description = parsed.description?.trim();
  const category = parsed.category?.trim();
  const numericPrice =
    typeof parsed.price === "number"
      ? parsed.price
      : Number(String(parsed.price ?? "").replace(/[^\d.]/g, ""));

  if (!title || !description || !category || !Number.isFinite(numericPrice)) {
    throw new Error("Gemini returned incomplete listing data");
  }

  return {
    title,
    price: Math.round(numericPrice),
    description,
    category,
  };
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<GenerateListingResponse>> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey || geminiApiKey.trim() === "" || geminiApiKey === "your_key_here") {
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

  let imageBase64: string;
  let mediaType: string;
  let currency: CurrencyCode;

  try {
    const body = await req.json();
    imageBase64 = body.imageBase64;
    mediaType = body.mediaType || "image/jpeg";
    const country: CountryCode = isSupportedCountry(body.country) ? body.country : "PH";
    const language: LanguageCode = isSupportedLanguage(body.language)
      ? body.language
      : getDefaultLanguage(country);
    currency = isSupportedCurrency(body.currency) ? body.currency : getDefaultCurrency(country);
    void language;

    if (!imageBase64 || typeof imageBase64 !== "string" || imageBase64.length < 100) {
      return NextResponse.json(
        {
          error: {
            type: "validation",
            message: "Missing or invalid imageBase64 in request body",
            hint: "Send imageBase64, mediaType, country, language, and currency in the POST body.",
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

  try {
    const generated = await generateListingFromImage(imageBase64, mediaType);
    const listing: ListingDraft = {
      title: generated.title,
      shortDescription: generated.description,
      keyFeatures: [],
      fullDescription: generated.description,
      tags: [],
      category: generated.category,
      condition: "Good",
      priceSuggestion: {
        recommended: generated.price,
        range: `${Math.max(0, generated.price - 100)}-${generated.price + 100}`,
        currency,
        rationale:
          "Estimated from the visible product type, condition, and typical resale pricing in the Philippines.",
      },
      confidence: "medium",
      specifications: {
        colour: null,
        material: null,
        brand: null,
        size: null,
        style: null,
      },
      platformGuidance: {
        facebookMarketplace: "Use the first sentence as the opening line and keep the price visible.",
        shopee: "Use the generated title directly and add precise specs before publishing.",
        lazada: "Keep the description concise and repeat the main product keywords once.",
        tiktokShop: "Lead with the most visible product detail and keep the copy short.",
        shopify: "Expand the description later with shipping and return details if needed.",
      },
      readyToPostText: `${generated.title}\nPrice: ${currency} ${generated.price}\n\n${generated.description}`,
      confidenceFlags: [],
    };

    return NextResponse.json({ listing });
  } catch (err: unknown) {
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

    if (lower.includes("json") || lower.includes("incomplete")) {
      return NextResponse.json(
        {
          error: {
            type: "parse",
            message: "Gemini returned an invalid or incomplete listing",
            hint: "Retry the request with a clearer product image.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: {
          type: "api",
          message: `Listing generation failed: ${message}`,
          hint: "Try again or check the Gemini API status.",
        },
      },
      { status: 500 }
    );
  }
}
