"use client";

import type {
  CountryCode,
  CurrencyCode,
  LanguageCode,
} from "@/lib/localization";
import type {
  GenerateListingRequest,
  GenerateListingResponse,
  ListingDraft,
} from "@/types/listing";

export type GenerateListingInput = Omit<
  GenerateListingRequest,
  "country" | "language" | "currency"
> & {
  country: CountryCode;
  language: LanguageCode;
  currency: CurrencyCode;
  fileName?: string;
};

export type GenerateListingResult = {
  listing: ListingDraft;
  usedFallback: boolean;
};

function normalizeTag(raw: string): string {
  const slug = String(raw ?? "")
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
  return slug ? `#${slug}` : "";
}

function normalizeListingSections(listing: ListingDraft): ListingDraft {
  const keyFeatures = Array.from(
    new Set((listing.keyFeatures ?? []).map((feature) => feature.replace(/^\s*[-*]\s*/, "").trim()).filter(Boolean))
  ).slice(0, 6);

  while (keyFeatures.length < 4) {
    keyFeatures.push(`Practical detail ${keyFeatures.length + 1} for buyers`);
  }

  const shortDescription = String(listing.shortDescription ?? "").replace(/\s+/g, " ").trim();
  const fullDescriptionSource = String(listing.fullDescription ?? "").trim();
  const fullDescription = fullDescriptionSource && fullDescriptionSource !== shortDescription
    ? fullDescriptionSource
    : `${shortDescription}\n\nWell-suited for everyday use with buyer-friendly details and clear product value.`;

  const tags = Array.from(
    new Set((listing.tags ?? []).map(normalizeTag).filter(Boolean))
  );
  const seededTags = Array.from(
    new Set([
      ...tags,
      normalizeTag(listing.category),
      ...String(listing.title ?? "")
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter((word) => word.length >= 4)
        .slice(0, 5)
        .map((word) => `#${word}`),
      "#listing",
      "#marketplace",
    ].filter(Boolean))
  ).slice(0, 10);

  while (seededTags.length < 5) {
    seededTags.push(`#tag${seededTags.length + 1}`);
  }

  const specEntries = Object.entries(listing.specifications ?? {}).filter(
    ([key, value]) => key.trim().length > 0 && value != null && String(value).trim().length > 0
  );
  const normalizedSpecs =
    specEntries.length > 0
      ? Object.fromEntries(specEntries.map(([key, value]) => [key.trim(), String(value).trim()]))
      : { material: "Not specified", colour: "Not specified" };

  const readyToPostText =
    `TITLE\n${listing.title}\n\n` +
    `PRICE\n${listing.priceSuggestion?.currency ?? "USD"} ${listing.priceSuggestion?.recommended ?? 0}\n\n` +
    `SHORT DESCRIPTION\n${shortDescription}\n\n` +
    `KEY FEATURES\n${keyFeatures.map((feature) => `- ${feature}`).join("\n")}\n\n` +
    `FULL DESCRIPTION\n${fullDescription}\n\n` +
    `SPECIFICATIONS\n${Object.entries(normalizedSpecs)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n")}\n\n` +
    `TAGS\n${seededTags.join(" ")}`;

  return {
    ...listing,
    shortDescription,
    keyFeatures,
    fullDescription,
    tags: seededTags,
    specifications: {
      colour: (normalizedSpecs.colour as string) ?? null,
      material: (normalizedSpecs.material as string) ?? null,
      brand: (normalizedSpecs.brand as string) ?? null,
      size: (normalizedSpecs.size as string) ?? null,
      style: (normalizedSpecs.style as string) ?? null,
      ...normalizedSpecs,
    },
    readyToPostText,
  };
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
}

function getFallbackTitle(fileName?: string): string {
  const cleaned = (fileName ?? "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Product Listing";
  }

  return toTitleCase(cleaned);
}

function getFallbackPrice(currency: CurrencyCode): number {
  const defaults: Record<CurrencyCode, number> = {
    PHP: 500,
    USD: 15,
    CAD: 20,
    CNY: 99,
    EUR: 18,
    PLN: 75,
  };

  return defaults[currency] ?? 100;
}

function buildFallbackListing({
  currency,
  fileName,
}: {
  currency: CurrencyCode;
  fileName?: string;
}): ListingDraft {
  const title = getFallbackTitle(fileName);
  const price = getFallbackPrice(currency);
  const description =
    "Clean product photo ready for a quick marketplace listing. Review the visible condition, add exact specs, and adjust the price before publishing.";

  return {
    title,
    shortDescription: description,
    keyFeatures: [
      "Simple, marketplace-ready draft",
      "Price can be adjusted before posting",
      "Best results with exact brand and size details added",
      "Built with structured sections for quick publishing",
    ],
    fullDescription: description,
    tags: ["#product", "#marketplace", "#quicklisting", "#forsale", "#onlinestore"],
    category: "General Merchandise",
    condition: "Good",
    priceSuggestion: {
      recommended: price,
      range: `${Math.max(0, price - Math.max(1, Math.round(price * 0.2)))}-${price + Math.max(1, Math.round(price * 0.2))}`,
      currency,
      rationale: "Fallback estimate generated locally so you can keep moving even if AI analysis is unavailable.",
    },
    confidence: "low",
    specifications: {
      colour: null,
      material: null,
      brand: null,
      size: null,
      style: null,
    },
    platformGuidance: {
      facebookMarketplace: "Mention pickup, delivery, and condition details before posting.",
      shopee: "Add exact measurements, brand, and shipping details for better conversion.",
      lazada: "Keep the title specific and include the main product keywords once.",
      tiktokShop: "Lead with the clearest visible feature and keep the copy short.",
      shopify: "Expand the description with care instructions, shipping, and returns.",
    },
    readyToPostText: `${title}\nPrice: ${currency} ${price}\n\n${description}`,
    confidenceFlags: [
      "Fallback listing used because the AI service did not return a completed listing.",
    ],
  };
}

export async function generateListing({
  imageBase64,
  mediaType,
  country,
  language,
  currency,
  fileName,
}: GenerateListingInput): Promise<GenerateListingResult> {
  try {
    const response = await fetch("/api/generate-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64,
        mediaType,
        country,
        language,
        currency,
      } satisfies GenerateListingRequest),
    });

    const data = (await response.json()) as GenerateListingResponse;

    if (!response.ok || !data.listing) {
      console.warn("Listing generation returned an invalid response, using fallback.", data.error);
      return {
        listing: buildFallbackListing({ currency, fileName }),
        usedFallback: true,
      };
    }

    return {
      listing: normalizeListingSections(data.listing),
      usedFallback: false,
    };
  } catch (error) {
    console.warn("Listing generation failed, using fallback.", error);
    return {
      listing: buildFallbackListing({ currency, fileName }),
      usedFallback: true,
    };
  }
}
