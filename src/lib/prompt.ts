import {
  COUNTRY_LABELS,
  LANGUAGE_LABELS,
  type CountryCode,
  type CurrencyCode,
  type LanguageCode,
} from "@/lib/localization";

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 prompt — sent to Gemini vision model alongside the image.
// Gemini works best with a clear, direct instruction for marketplace listings.
// ─────────────────────────────────────────────────────────────────────────────
export const VISION_PROMPT =
  "Describe this product in detail. Include the type of item, colour, material, " +
  "visible condition, approximate size, any visible brand markings, and any " +
  "notable features or accessories shown. Be specific and factual.";

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 prompt — sent to Groq with the vision description embedded.
// Returns a JSON object matching ListingDraft exactly.
// ─────────────────────────────────────────────────────────────────────────────
export function buildListingPrompt(
  visionDescription: string,
  options: {
    language?: LanguageCode;
    currency?: CurrencyCode;
    country?: CountryCode;
  } = {}
): string {
  const language = options.language ?? "en";
  const currency = options.currency ?? "PHP";
  const country = options.country ?? "PH";
  const languageName = LANGUAGE_LABELS[language] ?? LANGUAGE_LABELS.en;
  const countryName = COUNTRY_LABELS[country] ?? COUNTRY_LABELS.PH;

  const languageRules: Record<LanguageCode, string> = {
    en: "All user-facing text must be written in English. JSON field names remain in English.",
    fil: "All user-facing text must be written in Filipino / Tagalog. JSON field names remain in English. Keep brand names and standard marketplace category labels in English when appropriate.",
    "zh-CN": "All user-facing text must be written in Simplified Chinese. JSON field names remain in English. Keep brand names in their original form when appropriate.",
    fr: "All user-facing text must be written in French. JSON field names remain in English. Keep brand names and marketplace names unchanged when appropriate.",
    pl: "All user-facing text must be written in Polish. JSON field names remain in English. Keep brand names and marketplace names unchanged when appropriate.",
  };

  return `You are Seller Agent, an expert ecommerce listing writer.

LANGUAGE RULE
${languageRules[language]}

MARKET CONTEXT
Write the listing for sellers in ${countryName}.
Use ${languageName} for all buyer-facing copy.
Use ${currency} for every price reference.
Anchor the pricing logic to realistic secondhand ecommerce and marketplace pricing in ${countryName}.

A vision model analysed a product photo and produced this description:
"""
${visionDescription}
"""

Using only what is stated in that description, generate a complete marketplace listing.
Do not invent details that are not mentioned.
If something is uncertain, note it in confidenceFlags.

Return a single raw JSON object. No markdown, no code fences, no explanation text.
The first character must be { and the last must be }.

Required JSON schema:
{
  "title": string,
  "shortDescription": string,
  "fullDescription": string,
  "keyFeatures": [string],
  "tags": [string],
  "category": string,
  "condition": string,
  "confidence": "high" | "medium" | "low",
  "priceSuggestion": {
    "recommended": number,
    "range": string,
    "currency": string,
    "rationale": string
  },
  "specifications": {
    "colour": string | null,
    "material": string | null,
    "brand": string | null,
    "size": string | null,
    "style": string | null
  },
  "platformGuidance": {
    "facebookMarketplace": string,
    "shopee": string,
    "lazada": string,
    "tiktokShop": string,
    "shopify": string
  },
  "readyToPostText": string,
  "confidenceFlags": [string]
}

FIELD RULES

title
  5-12 words.
  Pattern: [Colour/Material] [Item] [Key detail].
  No hype words such as premium, amazing, perfect, stunning, ideal, best.

shortDescription
  1-2 sentences.
  Clear, direct, neutral tone. No emojis.

keyFeatures
  4-6 short strings.
  Only factual and visible or clearly inferred from the description.

fullDescription
  70-140 words.
  Helpful to buyers.
  Describe the item, important details, and clear condition notes.
  No excessive marketing fluff.

tags
  5-10 short search tags.
  No # symbol.
  No duplicates.

category
  A single marketplace category label only.

condition
  One of exactly: New / Like new / Good / Fair / For parts.
  Pick only based on the image description.

confidence
  "high" if the vision description was detailed and clear.
  "medium" if some details were vague.
  "low" if the description was very sparse.

priceSuggestion
  Estimate from category, visible quality, condition, brand cues if clearly visible, and common resale pricing in ${countryName}.
  Never invent manufacturer, retail, or original purchase prices.
  Set currency to "${currency}".
  Prefer whole-number pricing with no decimals unless necessary.
  range format: "low-high" e.g. "400-700"

specifications
  Set null for any field not clearly stated in the vision description.
  Never fabricate brand names, model numbers, or certifications.

platformGuidance
  One practical, specific sentence per platform. Not generic advice.

readyToPostText
  Complete copy-paste block for Facebook Marketplace / Shopee.
  Include: title line, localized price line, short description, bullet key specs, condition line, hashtag line with 5 tags.

confidenceFlags
  List every field where you were uncertain or made an inference.
  Empty array [] if all fields are high-confidence.

Return ONLY the JSON object. No other text.`;
}
