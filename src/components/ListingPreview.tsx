"use client";

import { useState } from "react";
import type { ListingDraft, ConfidenceLevel } from "@/types/listing";
import styles from "./ListingPreview.module.css";

interface ListingPreviewProps {
  listing: ListingDraft;
}

function CopyButton({ text }: { text: string }) {
  const [label, setLabel] = useState("Copy listing");
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setLabel("Copied!");
      setTimeout(() => setLabel("Copy listing"), 1600);
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

export function ListingPreview({ listing }: ListingPreviewProps) {
  const sp = listing.priceSuggestion;

  const priceDisplay = sp?.recommended
    ? new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: sp.currency || "PHP",
      maximumFractionDigits: 0,
    }).format(Number(sp.recommended))
    : "—";

  const rangeDisplay = sp?.range
    ? sp.range
      .split("-")
      .map((v) =>
        new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: sp.currency || "PHP",
          maximumFractionDigits: 0,
        }).format(Number(v))
      )
      .join(" – ")
    : "";

  const specEntries = Object.entries(listing.specifications ?? {}).filter(
    ([, v]) => v != null
  ) as [string, string][];

  const platRows: [string, string][] = (
    [
      ["facebookMarketplace", "Facebook Marketplace"],
      ["shopee", "Shopee"],
      ["lazada", "Lazada"],
      ["tiktokShop", "TikTok Shop"],
      ["shopify", "Shopify"],
    ] as [string, string][]
  ).filter(([k]) => listing.platformGuidance?.[k as keyof typeof listing.platformGuidance]);

  return (
    <div className={styles.root}>

      {/* Hero — title, category, condition, price */}
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <h2 className={styles.title}>{listing.title}</h2>
          <div className={styles.metaRow}>
            {listing.category && <Pill label={listing.category} variant="cat" />}
            {listing.condition && (
              <Pill
                label={listing.condition + (listing.confidence === "low" ? " (uncertain)" : "")}
                variant={listing.confidence === "high" ? "ok" : "warn"}
              />
            )}
          </div>
          <div className={styles.priceRow}>
            <span className={styles.priceVal}>{priceDisplay}</span>
            {sp?.range && (
              <span className={styles.priceRange}>
                range {rangeDisplay}
              </span>
            )}
          </div>
          {sp && <p className={styles.priceRationale}>AI price estimate · based on comparable listings</p>}
        </div>
      </div>

      {/* Ready-to-post */}
      {listing.readyToPostText && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>Ready-to-post listing</span>
            <CopyButton text={listing.readyToPostText} />
          </div>
          <div className={styles.cardBody}>
            <pre className={styles.postBlock}>{listing.readyToPostText}</pre>
          </div>
        </div>
      )}

      {/* Key Features first, then Short Description */}
      <div className={styles.twoCol}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>Key features</span>
          </div>
          <div className={styles.cardBody}>
            <ul className={styles.bullets}>
              {(listing.keyFeatures ?? []).map((b, i) => (
                <li key={i} className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>Short description</span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.shortDesc}>{listing.shortDescription}</p>
          </div>
        </div>
      </div>

      {/* Full description */}
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <span className={styles.cardLabel}>Full description</span>
          <CopyButton text={listing.fullDescription} />
        </div>
        <div className={styles.cardBody}>
          <p className={styles.fullDesc}>{listing.fullDescription}</p>
        </div>
      </div>

      {/* Specifications */}
      {specEntries.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>Specifications</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.specsGrid}>
              {specEntries.map(([k, v]) => (
                <div key={k} className={styles.specItem}>
                  <span className={styles.specKey}>{k}</span>
                  <span className={styles.specVal}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      {listing.tags?.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>Tags</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.tagsWrap}>
              {listing.tags.map((t) => (
                <span key={t} className={styles.tag}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Platform tips */}
      {platRows.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>Platform tips</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.platList}>
              {platRows.map(([k, label]) => (
                <div key={k} className={styles.platRow}>
                  <span className={styles.platName}>{label}</span>
                  <span className={styles.platTip}>
                    {listing.platformGuidance[k as keyof typeof listing.platformGuidance]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confidence notes */}
      {listing.confidenceFlags?.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardLabel}>Confidence notes</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.flagList}>
              {listing.confidenceFlags.map((f, i) => (
                <div key={i} className={styles.flagRow}>
                  <svg
                    width="13" height="13" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth={2}
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overall confidence badge */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <span style={{
          fontSize: 11,
          color: "#999",
          padding: "4px 10px",
          border: "1px solid #E9E9E9",
          borderRadius: 20,
          backgroundColor: "#FAFAFA",
        }}>
          {cfIcon(listing.confidence)} overall confidence: {listing.confidence}
        </span>
      </div>

    </div>
  );
}

