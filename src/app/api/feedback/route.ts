import { NextRequest, NextResponse } from "next/server";
import {
  APP_VERSION,
  isSupportedCountry,
  isSupportedCurrency,
  isSupportedLanguage,
} from "@/lib/localization";
import { FEEDBACK_TABLE } from "@/lib/feedback";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { FeedbackCategory, FeedbackResponse, FeedbackSubmission } from "@/types/feedback";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_CATEGORIES: FeedbackCategory[] = [
  "bug_report",
  "feature_request",
  "confusing_listing_output",
  "wrong_price_estimate",
  "other",
];

export async function POST(req: NextRequest): Promise<NextResponse<FeedbackResponse>> {
  try {
    const supabase = getSupabaseServerClient();
    const body = await req.json();
    const category = typeof body.category === "string" ? body.category : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const country = body.country;
    const language = body.language;
    const currency = body.currency;

    if (!category || !VALID_CATEGORIES.includes(category as FeedbackCategory)) {
      return NextResponse.json(
        {
          error: {
            type: "validation",
            message: "Feedback category is required.",
          },
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          error: {
            type: "validation",
            message: "Feedback message is required.",
          },
        },
        { status: 400 }
      );
    }

    if (email && !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        {
          error: {
            type: "validation",
            message: "Feedback email format is invalid.",
          },
        },
        { status: 400 }
      );
    }

    if (
      !isSupportedCountry(country) ||
      !isSupportedLanguage(language) ||
      !isSupportedCurrency(currency)
    ) {
      return NextResponse.json(
        {
          error: {
            type: "validation",
            message: "Feedback locale metadata is invalid.",
          },
        },
        { status: 400 }
      );
    }

    const submission: FeedbackSubmission = {
      id: crypto.randomUUID(),
      category: category as FeedbackCategory,
      message,
      ...(email ? { email } : {}),
      page: typeof body.page === "string" && body.page ? body.page : req.nextUrl.pathname,
      source: typeof body.source === "string" && body.source ? body.source : "floating_feedback_button",
      country,
      language,
      currency,
      appVersion: typeof body.appVersion === "string" && body.appVersion ? body.appVersion : APP_VERSION,
      ...(typeof body.generatedListingId === "string" && body.generatedListingId
        ? { generatedListingId: body.generatedListingId }
        : {}),
      ...(typeof body.generatedTitle === "string" && body.generatedTitle
        ? { generatedTitle: body.generatedTitle }
        : {}),
      ...(typeof body.generatedPrice === "string" && body.generatedPrice
        ? { generatedPrice: body.generatedPrice }
        : {}),
      createdAt: new Date().toISOString(),
    };

    console.log("[feedback] inserting into table:", FEEDBACK_TABLE);

    const { error } = await supabase.from(FEEDBACK_TABLE).insert({
      id: submission.id,
      category: submission.category,
      message: submission.message,
      email: submission.email ?? null,
      country: submission.country,
      language: submission.language,
      currency: submission.currency,
      page: submission.page,
      source: submission.source,
      app_version: submission.appVersion,
      generated_listing_id: submission.generatedListingId ?? null,
      generated_title: submission.generatedTitle ?? null,
      generated_price: submission.generatedPrice ?? null,
      created_at: submission.createdAt,
    });

    if (error) {
      console.error("[feedback] Supabase insert failed", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        category: submission.category,
        country: submission.country,
        language: submission.language,
      });

      return NextResponse.json(
        {
          error: {
            type: "api",
            message: "Unable to store feedback right now.",
            hint: "Try again in a moment.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: submission,
    });
  } catch (error) {
    console.error("[feedback] Failed to store feedback", error);

    return NextResponse.json(
      {
        error: {
          type: "api",
          message: "Unable to store feedback right now.",
          hint: "Try again in a moment.",
        },
      },
      { status: 500 }
    );
  }
}
