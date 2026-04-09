"use client";

import { useEffect, useState } from "react";
import { APP_VERSION, t, type CountryCode, type CurrencyCode, type LanguageCode } from "@/lib/localization";
import type { FeedbackCategory, FeedbackResponse } from "@/types/feedback";
import styles from "./FeedbackWidget.module.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CATEGORY_OPTIONS: Array<{
  value: FeedbackCategory;
  labelKey:
    | "feedbackCategoryBug"
    | "feedbackCategoryFeature"
    | "feedbackCategoryListingOutput"
    | "feedbackCategoryPrice"
    | "feedbackCategoryOther";
}> = [
  { value: "bug_report", labelKey: "feedbackCategoryBug" },
  { value: "feature_request", labelKey: "feedbackCategoryFeature" },
  { value: "confusing_listing_output", labelKey: "feedbackCategoryListingOutput" },
  { value: "wrong_price_estimate", labelKey: "feedbackCategoryPrice" },
  { value: "other", labelKey: "feedbackCategoryOther" },
];

interface FeedbackWidgetProps {
  language: LanguageCode;
  country: CountryCode;
  currency: CurrencyCode;
  generatedListingId?: string | null;
  generatedTitle?: string | null;
  generatedPrice?: string | null;
}

export function FeedbackWidget({
  language,
  country,
  currency,
  generatedListingId,
  generatedTitle,
  generatedPrice,
}: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory | "">("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [success]);

  function resetForm() {
    setCategory("");
    setMessage("");
    setEmail("");
    setError(null);
  }

  function closeModal() {
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!category) {
      setError(t(language, "validationCategory"));
      return;
    }

    if (!message.trim()) {
      setError(t(language, "validationMessage"));
      return;
    }

    if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
      setError(t(language, "validationEmail"));
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          email: email.trim() || undefined,
          page: window.location.pathname,
          source: "floating_feedback_button",
          country,
          language,
          currency,
          appVersion: APP_VERSION,
          generatedListingId: generatedListingId ?? undefined,
          generatedTitle: generatedTitle ?? undefined,
          generatedPrice: generatedPrice ?? undefined,
        }),
      });

      const data = (await response.json()) as FeedbackResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || t(language, "feedbackError"));
      }

      resetForm();
      closeModal();
      setSuccess(t(language, "feedbackSuccess"));
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : t(language, "feedbackError")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {success && <div className={styles.toast}>{success}</div>}
      <button className={styles.floatingButton} onClick={() => setOpen(true)} type="button">
        {t(language, "feedbackButton")}
      </button>

      {open && (
        <div className={styles.overlay} onClick={closeModal} role="presentation">
          <div
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
          >
            <div className={styles.header}>
              <div>
                <h2 id="feedback-title" className={styles.title}>
                  {t(language, "feedbackTitle")}
                </h2>
                <p className={styles.description}>{t(language, "feedbackDescription")}</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={closeModal}
                type="button"
                aria-label={t(language, "close")}
              >
                ×
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span className={styles.label}>{t(language, "feedbackCategory")}</span>
                <select
                  className={styles.select}
                  value={category}
                  onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
                >
                  <option value="">{t(language, "feedbackCategory")}</option>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(language, option.labelKey)}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>{t(language, "feedbackMessage")}</span>
                <textarea
                  className={styles.textarea}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={t(language, "feedbackMessagePlaceholder")}
                  rows={5}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>{t(language, "feedbackEmail")}</span>
                <input
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t(language, "feedbackEmailPlaceholder")}
                />
              </label>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.actions}>
                <button className={styles.secondaryButton} onClick={closeModal} type="button">
                  {t(language, "feedbackCancel")}
                </button>
                <button className={styles.primaryButton} disabled={submitting} type="submit">
                  {submitting ? t(language, "feedbackSubmitting") : t(language, "feedbackSubmit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
