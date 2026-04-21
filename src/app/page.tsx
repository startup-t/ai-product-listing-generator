"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { UploadZone } from "@/components/UploadZone";
import { ListingPreview } from "@/components/ListingPreview";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import {
  APP_VERSION,
  COUNTRY_FLAGS,
  COUNTRY_LABELS,
  CURRENCY_LABELS,
  LANGUAGE_LABELS,
  formatCurrencyValue,
  getAllowedLanguages,
  getDefaultCurrency,
  getDefaultLanguage,
  t,
  type CountryCode,
  type CurrencyCode,
  type LanguageCode,
} from "@/lib/localization";
import { useUploadFlow } from "@/lib/pipeline/uploadFlow";
import styles from "./page.module.css";

const COUNTRY_OPTIONS: CountryCode[] = ["US", "CN", "FR", "PL", "CA", "PH"];
const CURRENCY_OPTIONS = Object.entries(CURRENCY_LABELS) as [CurrencyCode, string][];

export default function Home() {
  const [country, setCountry] = useState<CountryCode>("US");
  const [language, setLanguage] = useState<LanguageCode>(getDefaultLanguage("US"));
  const [currency, setCurrency] = useState<CurrencyCode>(getDefaultCurrency("US"));
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const countryMenuRef = useRef<HTMLDivElement | null>(null);

  const allowedLanguages = getAllowedLanguages(country);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!countryMenuRef.current?.contains(event.target as Node)) {
        setCountryMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCountryMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleCountryChange(nextCountry: CountryCode) {
    setCountry(nextCountry);
    setLanguage(getDefaultLanguage(nextCountry));
    setCurrency(getDefaultCurrency(nextCountry));
    setCountryMenuOpen(false);
  }

  const {
    file,
    imagePreview,
    listingResult,
    generatedListingId,
    loadingState,
    progress,
    aiStep,
    handleFile,
    reset,
  } = useUploadFlow({
    country,
    language,
    currency,
  });

  const generating = loadingState;
  const listing = listingResult;
  const generatedPrice =
    listing?.priceSuggestion?.recommended != null
      ? formatCurrencyValue(
          Number(listing.priceSuggestion.recommended),
          (listing.priceSuggestion.currency as CurrencyCode) || currency,
          language,
          country
        )
      : null;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerMain}>
              <div className={styles.logo}>
                <Image
                  src="/logo.png"
                  alt="AI Product Listing Generator logo"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              <div className={styles.headerContent}>
                <h1 className={styles.headerTitle}>{t(language, "headerTitle")}</h1>
                <p className={styles.headerSub}>{t(language, "headerSub")}</p>
              </div>
            </div>

            <div className={styles.headerControls}>
              <div className={styles.countryControl} ref={countryMenuRef}>
                <span className={styles.countryIcon} aria-hidden="true">
                  🌐
                </span>
                <button
                  type="button"
                  className={styles.countryButton}
                  aria-haspopup="listbox"
                  aria-expanded={countryMenuOpen}
                  aria-label={t(language, "countryLabel")}
                  onClick={() => setCountryMenuOpen((current) => !current)}
                >
                  <span className={styles.countryButtonLabel}>{COUNTRY_LABELS[country]}</span>
                  <span
                    className={`${styles.countryChevron} ${countryMenuOpen ? styles.countryChevronOpen : ""}`}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                {countryMenuOpen && (
                  <div className={styles.countryMenu} role="listbox" aria-label={t(language, "countryLabel")}>
                    {COUNTRY_OPTIONS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        role="option"
                        aria-selected={country === value}
                        className={`${styles.countryOption} ${country === value ? styles.countryOptionActive : ""}`}
                        onClick={() => handleCountryChange(value)}
                      >
                        <span className={styles.countryOptionFlag} aria-hidden="true">
                          {COUNTRY_FLAGS[value]}
                        </span>
                        <span>{COUNTRY_LABELS[value]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className={styles.versionBadge}>v{APP_VERSION}</span>
            </div>
          </div>
        </header>

        <UploadZone
          onFile={handleFile}
          preview={imagePreview?.previewUrl ?? null}
          title={t(language, "uploadTitle")}
          subtitle={t(language, "uploadSub")}
        />

        <div className={styles.actions}>
          <div className={styles.control}>
            <span className={styles.controlLabel}>{t(language, "languageLabel")}</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as LanguageCode)}
              className={styles.languageSelect}
            >
              {allowedLanguages.map((value) => (
                <option key={value} value={value}>
                  {LANGUAGE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.control}>
            <span className={styles.controlLabel}>{t(language, "currencyLabel")}</span>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
              className={styles.languageSelect}
            >
              {CURRENCY_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {(listing || file) && (
            <button className={styles.resetBtn} onClick={reset}>
              {t(language, "startOver")}
            </button>
          )}
        </div>

        <p className={styles.examplePrompt}>{t(language, "examplePrompt")}</p>

        {generating && (
          <div className={styles.progressWrap} aria-live="polite">
            <p className={styles.progressLabel}>Generating your listing (3-5 seconds)...</p>
            {aiStep && <p className={styles.progressLabel}>{aiStep}</p>}
            <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {listing && (
          <div className={styles.successMessage}>✓ {t(language, "listingSuccess")}</div>
        )}

        {listing && (
          <ListingPreview
            listing={listing}
            language={language}
            country={country}
            currency={currency}
          />
        )}
      </div>

      <FeedbackWidget
        language={language}
        country={country}
        currency={currency}
        generatedListingId={generatedListingId}
        generatedTitle={listing?.title ?? null}
        generatedPrice={generatedPrice}
      />
    </main>
  );
}
