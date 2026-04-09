"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { UploadZone } from "@/components/UploadZone";
import { ProgressSteps, getProgressSteps } from "@/components/ProgressSteps";
import { ErrorBox } from "@/components/ErrorBox";
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
import {
  placeOnWhiteBackground,
  removeBackgroundFromImage,
  resizeImageForBackgroundRemoval,
} from "@/lib/removeBackground";
import type { ListingDraft } from "@/types/listing";
import type { StepState } from "@/components/ProgressSteps";
import styles from "./page.module.css";

type AppError = {
  type: "network" | "api" | "parse" | "validation";
  message: string;
  hint?: string;
};

type Notice = {
  message: string;
  hint?: string;
};

type StepId = "bg" | "vision" | "price" | "listing";

type ImageAsset = {
  base64: string;
  mediaType: string;
  previewUrl: string;
};

const COUNTRY_OPTIONS: CountryCode[] = ["US", "CN", "FR", "PL", "CA", "PH"];
const CURRENCY_OPTIONS = Object.entries(CURRENCY_LABELS) as [CurrencyCode, string][];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [imageAsset, setImageAsset] = useState<ImageAsset | null>(null);
  const [hasProcessedImage, setHasProcessedImage] = useState(false);
  const [stepStates, setStepStates] = useState<Record<StepId, StepState>>({
    bg: "idle",
    vision: "idle",
    price: "idle",
    listing: "idle",
  });
  const [generating, setGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [listing, setListing] = useState<ListingDraft | null>(null);
  const [generatedListingId, setGeneratedListingId] = useState<string | null>(null);
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

  function setStep(id: StepId, state: StepState) {
    setStepStates((prev) => ({ ...prev, [id]: state }));
  }

  function parseDataUrl(dataURL: string): ImageAsset {
    const [header, base64 = ""] = dataURL.split(",");
    const mediaTypeMatch = header.match(/^data:(.*?);base64$/);

    return {
      base64,
      mediaType: mediaTypeMatch?.[1] || "image/jpeg",
      previewUrl: dataURL,
    };
  }

  function handleFile(nextFile: File, dataURL: string) {
    setFile(nextFile);
    setImageAsset(parseDataUrl(dataURL));
    setHasProcessedImage(false);
    setListing(null);
    setGeneratedListingId(null);
    setError(null);
    setNotice(null);
    setShowProgress(false);
    setStepStates({ bg: "idle", vision: "idle", price: "idle", listing: "idle" });
  }

  function reset() {
    setFile(null);
    setImageAsset(null);
    setHasProcessedImage(false);
    setListing(null);
    setGeneratedListingId(null);
    setError(null);
    setNotice(null);
    setShowProgress(false);
    setGenerating(false);
    setStepStates({ bg: "idle", vision: "idle", price: "idle", listing: "idle" });
  }

  function handleCountryChange(nextCountry: CountryCode) {
    setCountry(nextCountry);
    setLanguage(getDefaultLanguage(nextCountry));
    setCurrency(getDefaultCurrency(nextCountry));
    setCountryMenuOpen(false);
  }

  async function generate() {
    if (!file || !imageAsset) return;

    setGenerating(true);
    setListing(null);
    setError(null);
    setNotice(null);
    setShowProgress(true);
    setStepStates({ bg: "idle", vision: "idle", price: "idle", listing: "idle" });

    try {
      setStep("bg", "running");

      let generationImageBase64 = imageAsset.base64;
      let generationMediaType = imageAsset.mediaType;

      if (!generationImageBase64 || generationImageBase64.length < 100) {
        throw {
          type: "validation",
          message: t(language, "couldNotReadImage"),
          hint: t(language, "tryDifferentImage"),
        } satisfies AppError;
      }

      try {
        const resizedFile = await resizeImageForBackgroundRemoval(file);
        const removedBgBlob = await removeBackgroundFromImage(resizedFile);
        const cleanedDataUrl = await placeOnWhiteBackground(removedBgBlob);
        const cleanedImage = parseDataUrl(cleanedDataUrl);

        generationImageBase64 = cleanedImage.base64;
        generationMediaType = cleanedImage.mediaType;
        setImageAsset(cleanedImage);
        setHasProcessedImage(true);
      } catch (bgErr) {
        console.error("Background removal failed:", bgErr);
        setHasProcessedImage(false);
        setNotice({
          message: t(language, "backgroundFallbackNotice"),
          hint: t(language, "backgroundFallbackHint"),
        });
      }

      setStep("bg", "done");
      setStep("vision", "running");
      setStep("price", "running");
      setStep("listing", "running");

      const response = await fetch("/api/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: generationImageBase64,
          mediaType: generationMediaType,
          country,
          language,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const apiError = data.error ?? { type: "api", message: `Server error ${response.status}` };
        throw apiError as AppError;
      }

      if (!data.listing) {
        throw {
          type: "parse",
          message: t(language, "serverReturnedNoListing"),
          hint: t(language, "tryAgain"),
        } satisfies AppError;
      }

      setStep("vision", "done");
      setStep("price", "done");
      setStep("listing", "done");
      setListing(data.listing);
      setGeneratedListingId(crypto.randomUUID());
    } catch (err: unknown) {
      setStepStates((prev) => {
        const next = { ...prev };
        (Object.keys(next) as StepId[]).forEach((key) => {
          if (next[key] === "running") next[key] = "idle";
        });
        return next;
      });

      if (err && typeof err === "object" && "type" in err) {
        setError(err as AppError);
      } else if (err instanceof Error) {
        const lower = err.message.toLowerCase();
        const isNetworkErr = lower.includes("failed to fetch") || lower.includes("networkerror");
        setError({
          type: "network",
          message: isNetworkErr ? t(language, "couldNotReachServer") : err.message,
          hint: isNetworkErr
            ? t(language, "devServerHint")
            : undefined,
        });
      } else {
        setError({
          type: "api",
          message: t(language, "unexpectedError"),
          hint: t(language, "consoleHint"),
        });
      }
    } finally {
      setGenerating(false);
    }
  }

  const steps = getProgressSteps(language).map((step) => ({
    ...step,
    state: stepStates[step.id as StepId],
  }));
  const preview = imageAsset?.previewUrl ?? null;
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
          preview={preview}
          title={t(language, "uploadTitle")}
          subtitle={t(language, "uploadSub")}
          downloadLabel={t(language, "downloadCleanedImage")}
          showDownload={hasProcessedImage}
          downloadHref={hasProcessedImage ? preview : null}
          downloadName="product-image-cleaned.jpg"
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

          <button onClick={generate} disabled={!file || generating} className={styles.generateBtn}>
            {generating ? t(language, "generating") : t(language, "generate")}
          </button>

          {(listing || error) && (
            <button className={styles.resetBtn} onClick={reset}>
              {t(language, "startOver")}
            </button>
          )}
        </div>

        <p className={styles.examplePrompt}>{t(language, "examplePrompt")}</p>

        {generating && showProgress && <ProgressSteps steps={steps} language={language} />}

        {listing && !error && (
          <div className={styles.successMessage}>✓ {t(language, "listingSuccess")}</div>
        )}

        {error && <ErrorBox type={error.type} message={error.message} hint={error.hint} language={language} />}
        {!error && notice && <ErrorBox type="warning" message={notice.message} hint={notice.hint} language={language} />}

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
