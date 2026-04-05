// ─────────────────────────────────────────────────────────────────────────────
// Step 1 prompt — sent to Gemini vision model alongside the image.
// Gemini works best with a clear, direct instruction for marketplace listings.
// ─────────────────────────────────────────────────────────────────────────────
export const VISION_PROMPT =
  "Describe this product in detail. Include the type of item, colour, material, " +
  "visible condition, approximate size, any visible brand markings, and any " +
  "notable features or accessories shown. Be specific and factual.";

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 prompt — sent to Groq (Llama 3.3) with the vision description embedded.
// Returns a JSON object matching ListingDraft exactly.
// Supports English (en) and Filipino (fil) languages.
// ─────────────────────────────────────────────────────────────────────────────
export function buildListingPrompt(visionDescription: string, language: "en" | "fil" = "en"): string {
  const isFilipino = language === "fil";

  const systemMsg = isFilipino
    ? "Ikaw ay Seller Agent, isang eksperto sa paglikha ng ecommerce listings."
    : "You are Seller Agent, an expert ecommerce listing writer.";

  const languageRuleMsg = isFilipino
    ? `LANGUAGE RULE
Lahat ng user-facing text ay dapat nasa Filipino.
Ito ay kasama ang:
title
shortDescription
keyFeatures
fullDescription
platformGuidance
readyToPostText

Huwag gumamit ng Ingles maliban kung brand name o marketplace category.
Panatilihing English ang JSON field names.`
    : `LANGUAGE RULE
All user-facing text must be written in English.
JSON field names remain in English.`;

  const descIntroMsg = isFilipino
    ? "Ang isang vision model ay nag-analisa ng larawan ng produkto at gumawa ng paglalarawan na ito:"
    : "A vision model has analysed a product photo and produced this description:";

  const instructionMsg = isFilipino
    ? "Gamit lamang kung ano ang nakasaad sa deskripsiyon, lumikha ng kompletong marketplace listing. Hindi dapat mag-imbento ng mga detalye na hindi nabanggit. Kung may hindi tiyak, isama sa confidenceFlags."
    : "Using only what is stated in that description, generate a complete marketplace listing. Do not invent details that are not mentioned. If something is uncertain, note it in confidenceFlags.";

  const returnMsg = isFilipino
    ? "Magbalik ng isang raw JSON object — walang markdown, walang code fences, walang explanation text. Ang unang character ay dapat { at ang huli ay }."
    : "Return a single raw JSON object — no markdown, no code fences, no explanation text. The first character must be { and the last must be }.";

  const fieldRulesMsg = isFilipino
    ? "MGA PATAKARAN SA FIELD"
    : "FIELD RULES";

  const titleMsg = isFilipino
    ? `title
  5-12 salita. Pattern: [Kulay/Materyales] [Item] [Key detalye].
  Walang hype words: premium, kahanga-hanga, perpekto, mataas na kalidad, kahanga, ideal.
  Mabuti: "Vintage brown leather messenger bag - medium"
  Mali:  "Amazing high-quality bag perfect for everyday use"`
    : `title
  5-12 words. Pattern: [Colour/Material] [Item] [Key detail].
  No hype words: premium, amazing, perfect, high-quality, stunning, ideal, great, best.
  Good: "Vintage brown leather messenger bag - medium"
  Bad:  "Amazing high-quality bag perfect for everyday use"`;

  const shortDescMsg = isFilipino
    ? "shortDescription\n  2-3 mga pangungusap, 25-50 salita. Natural na tinig ng nagbebenta. Magsimula sa pinakamahalagan na katotohanan."
    : "shortDescription\n  2-3 sentences, 25-50 words. Natural seller voice. Lead with the most useful fact.";

  const keyFeaturesMsg = isFilipino
    ? `keyFeatures
  Eksaktong 5 strings. Format: "[Feature]: [bakit mahalaga sa isang parirala]"
  Halimbawa: "Adjustable shoulder strap: fits across body or over shoulder"`
    : `keyFeatures
  Exactly 5 strings. Format: "[Feature]: [why it matters in one phrase]"
  Example: "Adjustable shoulder strap: fits across body or over shoulder"`;

  const fullDescMsg = isFilipino
    ? "fullDescription\n  100-200 salita. Benefit-led paragraphs. Ilahad lamang kung ano ang nakasaad sa vision output. Maikli ang paragraphs, max 3 na pangungusap bawat isa."
    : "fullDescription\n  100-200 words. Benefit-led paragraphs. Describe only what is stated in the vision output. Short paragraphs, max 3 sentences each.";

  const tagsMsg = isFilipino
    ? "tags\n  6-10 lowercase strings. Mix ng specific at general search terms (sa wikang Ingles)."
    : "tags\n  6-10 lowercase strings. Mix specific and general search terms.";

  const categoryMsg = isFilipino
    ? "category\n  Standard marketplace category e.g. Electronics, Clothing, Home & Garden, Toys, Sports, Books, Bags & Luggage, Furniture, Beauty, Kitchen, Tools, Footwear, Collectibles (laging sa Ingles)."
    : "category\n  Standard marketplace category e.g. Electronics, Clothing, Home & Garden, Toys, Sports, Books, Bags & Luggage, Furniture, Beauty, Kitchen, Tools, Footwear, Collectibles.";

  const conditionMsg = isFilipino
    ? "condition\n  Isa lamang sa eksakto: New / Like new / Good / Fair / For parts"
    : "condition\n  One of exactly: New / Like new / Good / Fair / For parts";

  const confidenceMsg = isFilipino
    ? `confidence
  "high" kung ang vision description ay detalyado at malinaw.
  "medium" kung ang ilang detalye ay hindi malinaw.
  "low" kung ang description ay napakaliit.`
    : `confidence
  "high" if the vision description was detailed and clear.
  "medium" if some details were vague.
  "low" if the description was very sparse.`;

  const priceMsg = isFilipino
    ? `priceSuggestion
  Mag-estimate mula sa category, nakikitang kalidad, condition, brand cues kung nasa malinaw, at karaniwang secondhand pricing sa Pilipinas.
  Huwag mag-imbento ng manufacturer, retail, o original purchase prices.
  Huwag gumamit ng USD.
  Gamitin ang Philippine Peso (PHP) lamang.
  I-set ang currency sa "PHP".
  Gumamit ng realistic Facebook Marketplace, Shopee, o Carousell-style resale pricing sa Pilipinas.
  Mas gustong whole-number pricing na walang decimals maliban kung kinakailangan.
  range format: "low-high" e.g. "400-700"`
    : `priceSuggestion
  Estimate from category, visible quality, condition, brand cues if clearly visible, and common secondhand pricing in the Philippines.
  Never invent manufacturer, retail, or original purchase prices.
  Do not use USD.
  Use Philippine Peso (PHP) only.
  Set currency to "PHP".
  Use realistic Facebook Marketplace, Shopee, or Carousell-style resale pricing in the Philippines.
  Prefer whole-number pricing with no decimals unless necessary.
  range format: "low-high" e.g. "400-700"`;

  const specsMsg = isFilipino
    ? "specifications\n  I-set ang null para sa anumang field na hindi malinaw na nakasaad sa vision description. Hindi dapat mag-imbento ng brand names, model numbers, o certifications."
    : "specifications\n  Set null for any field not clearly stated in the vision description. Never fabricate brand names, model numbers, or certifications.";

  const platGuidanceMsg = isFilipino
    ? "platformGuidance\n  Isang praktikal, tukoy na pangungusap bawat platform. Hindi generic na payo."
    : "platformGuidance\n  One practical, specific sentence per platform. Not generic advice.";

  const readyToPostMsg = isFilipino
    ? "readyToPostText\n  Kompletong copy-paste block para sa Facebook Marketplace / Shopee.\n  Kasama: title line, \"Price: [PRICE]\", short description, bullet key specs, \"Condition: [value]\" line, hashtag line na may 5 tags."
    : "readyToPostText\n  Complete copy-paste block for Facebook Marketplace / Shopee.\n  Include: title line, \"Price: [PRICE]\", short description, bullet key specs, \"Condition: [value]\" line, hashtag line with 5 tags.";

  const confidenceFlagsMsg = isFilipino
    ? "confidenceFlags\n  I-list ang bawat field kung saan ka hindi sigurado o gumawa ng inference. Empty array [] kung lahat ng fields ay high-confidence."
    : "confidenceFlags\n  List every field where you were uncertain or made an inference. Empty array [] if all fields are high-confidence.";

  const returnOnlyMsg = isFilipino
    ? "Ibalik LAMANG ang JSON object. Walang ibang text."
    : "Return ONLY the JSON object. No other text.";

  return `${systemMsg}

${languageRuleMsg}

${descIntroMsg}
"""
${visionDescription}
"""

${instructionMsg}

${returnMsg}

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
    "currency": "PHP",
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

${fieldRulesMsg}

${titleMsg}

${shortDescMsg}

${keyFeaturesMsg}

${fullDescMsg}

${tagsMsg}

${categoryMsg}

${conditionMsg}

${confidenceMsg}

${priceMsg}

${specsMsg}

${platGuidanceMsg}

${readyToPostMsg}

${confidenceFlagsMsg}

${returnOnlyMsg}`;
}
