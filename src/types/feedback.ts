import type { CountryCode, CurrencyCode, LanguageCode } from "@/lib/localization";

export type FeedbackCategory =
  | "bug_report"
  | "feature_request"
  | "confusing_listing_output"
  | "wrong_price_estimate"
  | "other";

export interface FeedbackSubmission {
  id: string;
  category: FeedbackCategory;
  message: string;
  email?: string;
  page: string;
  source: string;
  country: CountryCode;
  language: LanguageCode;
  currency: CurrencyCode;
  appVersion: string;
  createdAt: string;
  generatedListingId?: string;
  generatedTitle?: string;
  generatedPrice?: string;
}

export interface FeedbackRequest {
  category: FeedbackCategory;
  message: string;
  email?: string;
  page?: string;
  source?: string;
  country: CountryCode;
  language: LanguageCode;
  currency: CurrencyCode;
  appVersion?: string;
  generatedListingId?: string;
  generatedTitle?: string;
  generatedPrice?: string;
}

export interface FeedbackResponse {
  success?: boolean;
  feedback?: FeedbackSubmission;
  error?: {
    type: "validation" | "api";
    message: string;
    hint?: string;
  };
}
