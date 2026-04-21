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

function normalizeTag(raw: string): string {
  const slug = raw
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
  return slug ? `#${slug}` : "";
}

function normalizeFeature(raw: string): string {
  return raw.replace(/^\s*[-*]\s*/, "").replace(/\s+/g, " ").trim();
}

function ensureMinTags(tags: string[], category: string, title: string): string[] {
  const normalized = Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
  const categorySeed = normalizeTag(category);
  const titleWords = title
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4)
    .slice(0, 5)
    .map((word) => `#${word}`);
  const defaults = ["#listing", "#forsale", "#marketplace"];
  const merged = Array.from(
    new Set([...normalized, categorySeed, ...titleWords, ...defaults].filter(Boolean))
  );
  return merged.slice(0, Math.max(5, Math.min(10, merged.length)));
}

function sanitizeDescriptions(
  shortDescription: string,
  fullDescription: string,
  keyFeatures: string[]
): { shortDescription: string; fullDescription: string } {
  const featureSet = new Set(
    keyFeatures.map((feature) => feature.toLowerCase().replace(/\s+/g, " ").trim())
  );
  const cleanShort = shortDescription.replace(/\s+/g, " ").trim();
  const fullParts = fullDescription
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const normalized = part.toLowerCase().replace(/\s+/g, " ");
      if (normalized.includes("#")) return false;
      return !featureSet.has(normalized);
    });
  const cleanFullRaw = fullParts.join("\n\n").replace(/\s{2,}/g, " ").trim();
  const cleanFull =
    cleanFullRaw && cleanFullRaw !== cleanShort
      ? cleanFullRaw
      : `${cleanShort}\n\nGreat for buyers looking for a reliable item with practical value and clear product details.`;
  return { shortDescription: cleanShort, fullDescription: cleanFull };
}

async function generateListingFromImage(
  base64Image: string,
  mediaType = "image/jpeg"
): Promise<{
  title: string;
  price: number;
  shortDescription: string;
  keyFeatures: string[];
  fullDescription: string;
  specifications: Record<string, string>;
  tags: string[];
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
              "Analyze this product image and generate a marketplace-ready listing. " +
              "Return only valid JSON, with no markdown and no extra text outside JSON. " +
              "Use exactly this schema: " +
              '{ "title": string, "price": number, "shortDescription": string, "keyFeatures": string[4..6], "fullDescription": string, "specifications": { [field: string]: string }, "tags": string[5..10], "category": string }. ' +
              "Strict rules: include all keys, keep sections separate, do not merge content across sections, do not duplicate paragraphs across shortDescription and fullDescription, keep keyFeatures concise and distinct, and generate at least 5 SEO-relevant hashtags in lowercase with # prefix.",
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
    shortDescription: string;
    keyFeatures: string[];
    fullDescription: string;
    specifications: Record<string, string>;
    tags: string[];
    category: string;
  }>;

  const title = parsed.title?.trim();
  const shortDescription = parsed.shortDescription?.trim();
  const keyFeatures = Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures : [];
  const fullDescription = parsed.fullDescription?.trim();
  const specifications =
    parsed.specifications && typeof parsed.specifications === "object" ? parsed.specifications : {};
  const tags = Array.isArray(parsed.tags) ? parsed.tags : [];
  const category = parsed.category?.trim();
  const numericPrice =
    typeof parsed.price === "number"
      ? parsed.price
      : Number(String(parsed.price ?? "").replace(/[^\d.]/g, ""));

  if (
    !title ||
    !shortDescription ||
    keyFeatures.length === 0 ||
    !fullDescription ||
    !category ||
    !Number.isFinite(numericPrice)
  ) {
    throw new Error("Gemini returned incomplete listing data");
  }

  return {
    title,
    price: Math.round(numericPrice),
    shortDescription,
    keyFeatures,
    fullDescription,
    specifications,
    tags,
    category,
  };
}

function normalizeGeneratedListing(
  generated: Awaited<ReturnType<typeof generateListingFromImage>>,
  currency: CurrencyCode
): ListingDraft {
  const normalizedFeatures = Array.from(
    new Set(generated.keyFeatures.map(normalizeFeature).filter(Boolean))
  ).slice(0, 6);
  while (normalizedFeatures.length < 4) {
    normalizedFeatures.push(`Practical detail ${normalizedFeatures.length + 1} for buyers`);
  }

  const { shortDescription, fullDescription } = sanitizeDescriptions(
    generated.shortDescription,
    generated.fullDescription,
    normalizedFeatures
  );
  const normalizedTags = ensureMinTags(generated.tags, generated.category, generated.title);

  const normalizedSpecsEntries = Object.entries(generated.specifications ?? {})
    .map(([key, value]) => [key.trim(), String(value ?? "").trim()] as const)
    .filter(([key, value]) => key.length > 0 && value.length > 0)
    .slice(0, 8);
  const normalizedSpecs = Object.fromEntries(normalizedSpecsEntries);

  const specsForListing = {
    colour: normalizedSpecs.colour ?? null,
    material: normalizedSpecs.material ?? null,
    brand: normalizedSpecs.brand ?? null,
    size: normalizedSpecs.size ?? null,
    style: normalizedSpecs.style ?? null,
    ...normalizedSpecs,
  };

  const readyToPostText =
    `TITLE\n${generated.title}\n\n` +
    `PRICE\n${currency} ${generated.price}\n\n` +
    `SHORT DESCRIPTION\n${shortDescription}\n\n` +
    `KEY FEATURES\n${normalizedFeatures.map((feature) => `- ${feature}`).join("\n")}\n\n` +
    `FULL DESCRIPTION\n${fullDescription}\n\n` +
    `SPECIFICATIONS\n` +
    `${
      Object.entries(normalizedSpecs).length > 0
        ? Object.entries(normalizedSpecs)
            .map(([key, value]) => `- ${key}: ${value}`)
            .join("\n")
        : "- material: Not specified\n- colour: Not specified"
    }\n\n` +
    `TAGS\n${normalizedTags.join(" ")}`;

  return {
    title: generated.title,
    shortDescription,
    keyFeatures: normalizedFeatures,
    fullDescription,
    tags: normalizedTags,
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
    specifications: specsForListing,
    platformGuidance: {
      facebookMarketplace: "Use the first sentence as the opening line and keep the price visible.",
      shopee: "Use the generated title directly and add precise specs before publishing.",
      lazada: "Keep the description concise and repeat the main product keywords once.",
      tiktokShop: "Lead with the most visible product detail and keep the copy short.",
      shopify: "Expand the description later with shipping and return details if needed.",
    },
    readyToPostText,
    confidenceFlags: [],
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
    const listing = normalizeGeneratedListing(generated, currency);

    return NextResponse.json({ listing });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: {
          type: "api",
          message: err instanceof Error ? err.message : "Listing generation failed",
          hint: "Try another image or retry in a moment.",
        },
      },
      { status: 502 }
    );
  }
}
