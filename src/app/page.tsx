"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadZone } from "@/components/UploadZone";
import { ProgressSteps, STEPS } from "@/components/ProgressSteps";
import { ErrorBox } from "@/components/ErrorBox";
import { ListingPreview } from "@/components/ListingPreview";
import type { ListingDraft } from "@/types/listing";
import type { StepState } from "@/components/ProgressSteps";
import styles from "./page.module.css";

type AppError = {
  type: "network" | "api" | "parse" | "validation";
  message: string;
  hint?: string;
};

type StepId = "bg" | "vision" | "price" | "listing";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stepStates, setStepStates] = useState<Record<StepId, StepState>>({
    bg: "idle", vision: "idle", price: "idle", listing: "idle",
  });
  const [generating, setGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [listing, setListing] = useState<ListingDraft | null>(null);
  const [language, setLanguage] = useState<"en" | "fil">("en");

  function setStep(id: StepId, state: StepState) {
    setStepStates((prev) => ({ ...prev, [id]: state }));
  }

  function handleFile(f: File, dataURL: string) {
    setFile(f);
    setPreview(dataURL);
    setListing(null);
    setError(null);
    setShowProgress(false);
    setStepStates({ bg: "idle", vision: "idle", price: "idle", listing: "idle" });
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setListing(null);
    setError(null);
    setShowProgress(false);
    setGenerating(false);
    setStepStates({ bg: "idle", vision: "idle", price: "idle", listing: "idle" });
  }

  async function generate() {
    if (!file || !preview) return;
    setGenerating(true);
    setListing(null);
    setError(null);
    setShowProgress(true);
    setStepStates({ bg: "idle", vision: "idle", price: "idle", listing: "idle" });

    try {
      // Step 1 — background removal (simulated; swap in real bg removal here)
      setStep("bg", "running");
      await new Promise((r) => setTimeout(r, 900));
      setStep("bg", "done");

      // Steps 2-4 run during the API call
      setStep("vision", "running");
      setStep("price", "running");
      setStep("listing", "running");

      const base64 = preview.split(",")[1];
      const mediaType = file.type || "image/jpeg";

      if (!base64 || base64.length < 100) {
        throw { type: "validation", message: "Image data could not be read.", hint: "Try a different image file." } as AppError;
      }

      const res = await fetch("/api/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const err = data.error ?? { type: "api", message: `Server error ${res.status}` };
        throw err as AppError;
      }

      if (!data.listing) {
        throw { type: "parse", message: "Server returned no listing data.", hint: "Try again." } as AppError;
      }

      setStep("vision", "done");
      setStep("price", "done");
      setStep("listing", "done");
      setListing(data.listing);

    } catch (err: unknown) {
      // Reset running steps to idle
      setStepStates((prev) => {
        const next = { ...prev };
        (Object.keys(next) as StepId[]).forEach((k) => {
          if (next[k] === "running") next[k] = "idle";
        });
        return next;
      });

      if (err && typeof err === "object" && "type" in err) {
        setError(err as AppError);
      } else if (err instanceof Error) {
        const isNetworkErr = err.message.toLowerCase().includes("failed to fetch") ||
          err.message.toLowerCase().includes("networkerror");
        setError({
          type: "network",
          message: isNetworkErr ? "Could not reach the server." : err.message,
          hint: isNetworkErr
            ? "Make sure the dev server is running on localhost:3000 and your internet connection is active."
            : undefined,
        });
      } else {
        setError({ type: "api", message: "An unexpected error occurred.", hint: "Check the browser console for details." });
      }
    } finally {
      setGenerating(false);
    }
  }

  const steps = STEPS.map((s) => ({ ...s, state: stepStates[s.id as StepId] }));

  return (
    <main className={styles.main}>
      <div className={styles.container}>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logo}>
            <Image
              src="/logo.png"
              alt="AI Product Listing Generator logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div className={styles.headerContent}>
            <h1 className={styles.headerTitle}>AI Product Listing Generator</h1>
            <p className={styles.headerSub}>
              Photo → Instant Listing<br />
              Upload a product photo and generate a ready-to-post marketplace listing in seconds.
            </p>
          </div>
          <span className={styles.versionBadge}>v3</span>
        </header>

        {/* Upload zone */}
        <UploadZone onFile={handleFile} preview={preview} />

        {/* Actions */}
        <div className={styles.actions}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en" | "fil")}
            className={styles.languageSelect}
          >
            <option value="en">English</option>
            <option value="fil">Filipino</option>
          </select>

          <button
            onClick={generate}
            disabled={!file || generating}
            className={styles.generateBtn}
          >
            {generating ? "Generating…" : "Generate listing"}
          </button>

          {(listing || error) && (
            <button className={styles.resetBtn} onClick={reset}>
              Start over
            </button>
          )}
        </div>

        {/* Progress */}
        {generating && showProgress && <ProgressSteps steps={steps} />}

        {/* Success Message */}
        {listing && !error && (
          <div className={styles.successMessage}>
            ✓ Listing generated successfully
          </div>
        )}

        {/* Error */}
        {error && <ErrorBox type={error.type} message={error.message} hint={error.hint} />}

        {/* Result */}
        {listing && <ListingPreview listing={listing} />}

      </div>
    </main>
  );
}
