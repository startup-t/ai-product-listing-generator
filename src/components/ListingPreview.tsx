"use client";

import { useState } from "react";
import {
  formatCurrencyRange,
  formatCurrencyValue,
  t,
  type CountryCode,
  type CurrencyCode,
  type LanguageCode,
} from "@/lib/localization";
import type { ListingDraft, ConfidenceLevel } from "@/types/listing";
import styles from "./ListingPreview.module.css";

interface ListingPreviewProps {
  listing: ListingDraft;
  language: LanguageCode;
  country: CountryCode;
  currency: CurrencyCode;
}

function CopyButton({
  text,
  language,
}: {
  text: string;
  language: LanguageCode;
}) {
  const [label, setLabel] = useState(t(language, "copyListing"));

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setLabel(t(language, "copied"));
      setTimeout(() => setLabel(t(language, "copyListing")), 1600);
    });
  }

  return (
    <button className={styles.copyBtn} onClick={copy}>
      📋 {label}
    </button>
  );
}

function Pill({ label, variant }: { label: string; variant: "cat" | "ok" | "warn" }) {
  return <span className={`${styles.pill} ${styles[variant]}`}>{label}</span>;
}

function cfIcon(c: ConfidenceLevel) {
  return c === "high" ? "✓" : c === "medium" ? "~" : "?";
}

export function ListingPreview({
  listing,
  language,
  country,
  currency,
}: ListingPreviewProps) {
  const sp = listing.priceSuggestion;

  const displayCurrency = (sp?.currency as CurrencyCode) || currency;

  const priceDisplay = sp?.recommended
    ? formatCurrencyValue(Number(sp.recommended), displayCurrency, language, country)
    : "—";

  const rangeDisplay = sp?.range
    ? formatCurrencyRange(sp.range, displayCurrency, language, country)
    : "";

  const specEntries = Object.entries(listing.specifications ?? {}).filter(
    ([, value]) => value != null
  ) as [string, string][];

  const platRows: [string, string][] = (
    [
      ["facebookMarketplace", "Facebook Marketplace"],
      ["shopee", "Shopee"],
      ["lazada", "Lazada"],
      ["tiktokShop", "TikTok Shop"],
      ["shopify", "Shopify"],
    ] as [string, string][]
  ).filter(([key]) => listing.platformGuidance?.[key as keyof typeof listing.platformGuidance]);

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <h2 className={styles.title}>{listing.title}</h2>
          <div className={styles.metaRow}>
            {listing.category && <Pill label={listing.category} variant="cat" />}
            {listing.condition && (
              <Pill
                label={
                  listing.condition +
                  (listing.confidence === "low" ? ` (${t(language, "conditionUncertain")})` : "")
                }
                variant={listing.confidence === "high" ? "ok" : "warn"}
              />
            )}
          </div>
          <div className={styles.priceRow}>
            <span className={styles.priceVal}>{priceDisplay}</span>
            {sp?.range && (
              <span className={styles.priceRange}>
                {t(language, "priceRange")} {rangeDisplay}
              </span>
            )}
          </div>
          {sp && <p className={styles.priceRationale}>{t(language, "priceEstimate")}</p>}
        </div>
      </div>

      {listing.readyToPostText && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>{t(language, "readyToPost")}</span>
            <CopyButton text={listing.readyToPostText} language={language} />
          </div>
          <div className={styles.cardBody}>
            <pre className={styles.postBlock}>{listing.readyToPostText}</pre>
          </div>
        </div>
      )}

      <div className={styles.twoCol}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>{t(language, "keyFeatures")}</span>
          </div>
          <div className={styles.cardBody}>
            <ul className={styles.bullets}>
              {(listing.keyFeatures ?? []).map((bullet, index) => (
                <li key={index} className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>{t(language, "shortDescription")}</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.shortDesc}>{listing.shortDescription}</p>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <span className={styles.cardLabel}>{t(language, "fullDescription")}</span>
          <CopyButton text={listing.fullDescription} language={language} />
        </div>
        <div className={styles.cardBody}>
          <p className={styles.fullDesc}>{listing.fullDescription}</p>
        </div>
      </div>

      {specEntries.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>{t(language, "specifications")}</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.specsGrid}>
              {specEntries.map(([key, value]) => (
                <div key={key} className={styles.specItem}>
                  <span className={styles.specKey}>{key}</span>
                  <span className={styles.specVal}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {listing.tags?.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>{t(language, "tags")}</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.tagsWrap}>
              {listing.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {platRows.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>{t(language, "platformTips")}</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.platList}>
              {platRows.map(([key, label]) => (
                <div key={key} className={styles.platRow}>
                  <span className={styles.platName}>{label}</span>
                  <span className={styles.platTip}>
                    {listing.platformGuidance[key as keyof typeof listing.platformGuidance]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {listing.confidenceFlags?.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>{t(language, "confidenceNotes")}</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.flagList}>
              {listing.confidenceFlags.map((flag, index) => (
                <div key={index} className={styles.flagRow}>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                  </svg>
                  {flag}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <span
          style={{
            fontSize: 11,
            color: "#999",
            padding: "4px 10px",
            border: "1px solid #E9E9E9",
            borderRadius: 20,
            backgroundColor: "#FAFAFA",
          }}
        >
          {cfIcon(listing.confidence)} {t(language, "overallConfidence")}: {listing.confidence}
        </span>
      </div>
    </div>
  );
}
