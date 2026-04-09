import type { CountryCode, CurrencyCode, LanguageCode } from "@/lib/localization";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface PriceSuggestion {
  recommended: number;
  range: string;
  currency: string;
  rationale: string;
}

export interface PlatformGuidance {
  facebookMarketplace: string;
  shopee: string;
  lazada: string;
  tiktokShop: string;
  shopify: string;
}

export interface Specifications {
  colour: string | null;
  material: string | null;
  brand: string | null;
  size: string | null;
  style: string | null;
  [key: string]: string | null;
}

/** Canonical shape — every field is guaranteed non-undefined by the backend normalizer */
export interface ListingDraft {
  // Core fields (required by task spec)
  title: string;
  shortDescription: string;
  keyFeatures: string[];
  fullDescription: string;
  tags: string[];
  category: string;
  condition: string;
  priceSuggestion: PriceSuggestion | null;
  confidence: ConfidenceLevel;

  // Extended fields (preserved from v2 — rendered when present)
  specifications: Specifications;
  platformGuidance: PlatformGuidance;
  readyToPostText: string;
  confidenceFlags: string[];
}

export interface GenerateListingRequest {
  imageBase64: string;
  mediaType: string;
  language?: LanguageCode;
  currency?: CurrencyCode;
  country?: CountryCode;
}

export interface GenerateListingResponse {
  listing?: ListingDraft;
  error?: {
    type: "network" | "api" | "parse" | "validation";
    message: string;
    hint?: string;
    status?: number;
  };
}
