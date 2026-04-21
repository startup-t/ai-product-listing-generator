"use client";

import { useEffect, useRef, useState } from "react";
import type {
  CountryCode,
  CurrencyCode,
  LanguageCode,
} from "@/lib/localization";
import { generateListing } from "@/lib/ai/generateListing";
import type { ListingDraft } from "@/types/listing";

export type ImagePreview = {
  base64: string;
  mediaType: string;
  previewUrl: string;
};

type UploadFlowConfig = {
  country: CountryCode;
  language: LanguageCode;
  currency: CurrencyCode;
};

type ProcessedUpload = {
  file: File;
  dataUrl: string;
  previewUrl: string;
};

function parseDataUrl(dataURL: string): ImagePreview {
  const [header, base64 = ""] = dataURL.split(",");
  const mediaTypeMatch = header.match(/^data:(.*?);base64$/);

  return {
    base64,
    mediaType: mediaTypeMatch?.[1] || "image/jpeg",
    previewUrl: dataURL,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to read image as Data URL"));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });
}

async function removeBackgroundServerSide(originalFile: File): Promise<ProcessedUpload> {
  const fallbackDataUrl = await fileToDataUrl(originalFile);

  try {
    const formData = new FormData();
    formData.append("file", originalFile);

    const response = await fetch("/api/remove-background", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`remove-background failed with ${response.status}`);
    }

    const outputBlob = await response.blob();
    const processedFile = new File([outputBlob], originalFile.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: outputBlob.type || "image/jpeg",
      lastModified: Date.now(),
    });
    const processedDataUrl = await fileToDataUrl(processedFile);

    return {
      file: processedFile,
      dataUrl: processedDataUrl,
      previewUrl: URL.createObjectURL(processedFile),
    };
  } catch (error) {
    console.warn("Background removal failed. Using original image.", error);
    return {
      file: originalFile,
      dataUrl: fallbackDataUrl,
      previewUrl: URL.createObjectURL(originalFile),
    };
  }
}

export function useUploadFlow({ country, language, currency }: UploadFlowConfig) {
  const runIdRef = useRef(0);
  const previewObjectUrlRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressFinishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiStepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressStartTimeRef = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [listingResult, setListingResult] = useState<ListingDraft | null>(null);
  const [generatedListingId, setGeneratedListingId] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiStep, setAiStep] = useState<string>("");

  function stopProgressAnimation() {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }

  function clearProgressFinishTimeout() {
    if (progressFinishTimeoutRef.current) {
      clearTimeout(progressFinishTimeoutRef.current);
      progressFinishTimeoutRef.current = null;
    }
  }

  function clearAiStepTimeout() {
    if (aiStepTimeoutRef.current) {
      clearTimeout(aiStepTimeoutRef.current);
      aiStepTimeoutRef.current = null;
    }
  }

  function startProgressAnimation() {
    stopProgressAnimation();
    clearProgressFinishTimeout();
    progressStartTimeRef.current = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartTimeRef.current;
      let target = 0;

      if (elapsed <= 300) {
        target = (elapsed / 300) * 30;
      } else if (elapsed <= 2000) {
        target = 30 + ((elapsed - 300) / 1700) * 40;
      } else {
        const slowPhase = elapsed - 2000;
        target = 70 + 20 * (1 - Math.exp(-slowPhase / 2200));
      }

      const clampedTarget = Math.min(90, target);
      setProgress((current) => (clampedTarget > current ? clampedTarget : current));
    }, 50);
  }

  function revokePreviewObjectUrl() {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      stopProgressAnimation();
      clearProgressFinishTimeout();
      clearAiStepTimeout();
      revokePreviewObjectUrl();
    };
  }, []);

  function reset() {
    runIdRef.current += 1;
    stopProgressAnimation();
    clearProgressFinishTimeout();
    clearAiStepTimeout();
    revokePreviewObjectUrl();
    setFile(null);
    setImagePreview(null);
    setListingResult(null);
    setGeneratedListingId(null);
    setLoadingState(false);
    setProgress(0);
    setAiStep("");
  }

  function runAiStepProgress(runId: number): Promise<void> {
    const steps = [
      "Analyzing product: category, material, color, attributes",
      "Estimating price: category, quality signals, market patterns",
      "Writing listing: title, description, key features, tags",
    ];
    clearAiStepTimeout();
    setAiStep(steps[0]);

    return new Promise((resolve) => {
      let index = 0;

      const scheduleNext = () => {
        if (runIdRef.current !== runId) {
          resolve();
          return;
        }

        if (index >= steps.length - 1) {
          resolve();
          return;
        }

        const delay = 600 + Math.floor(Math.random() * 301);
        aiStepTimeoutRef.current = setTimeout(() => {
          if (runIdRef.current !== runId) {
            resolve();
            return;
          }
          index += 1;
          setAiStep(steps[index]);
          scheduleNext();
        }, delay);
      };

      scheduleNext();
    });
  }

  async function handleFile(nextFile: File, _dataURL: string) {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    revokePreviewObjectUrl();
    setFile(nextFile);
    setImagePreview(null);
    setListingResult(null);
    setGeneratedListingId(null);
    setLoadingState(true);
    setProgress(0);
    setAiStep("");
    startProgressAnimation();

    const processedUpload = await removeBackgroundServerSide(nextFile);

    if (runIdRef.current !== runId) {
      URL.revokeObjectURL(processedUpload.previewUrl);
      return;
    }

    const effectiveFile = processedUpload.file;
    const parsedImage = parseDataUrl(processedUpload.dataUrl);
    previewObjectUrlRef.current = processedUpload.previewUrl;

    setFile(effectiveFile);
    setImagePreview({
      ...parsedImage,
      previewUrl: processedUpload.previewUrl,
    });

    try {
      const listingPromise = generateListing({
        imageBase64: parsedImage.base64,
        mediaType: parsedImage.mediaType,
        country,
        language,
        currency,
        fileName: effectiveFile.name,
      });
      const stepPromise = runAiStepProgress(runId);
      const [result] = await Promise.all([listingPromise, stepPromise]);

      if (runIdRef.current !== runId) {
        return;
      }

      setListingResult(result.listing);
      setGeneratedListingId(crypto.randomUUID());
    } catch (error) {
      console.warn("Listing generation failed unexpectedly.", error);
    } finally {
      if (runIdRef.current === runId) {
        stopProgressAnimation();
        setProgress(100);
        clearProgressFinishTimeout();
        progressFinishTimeoutRef.current = setTimeout(() => {
          if (runIdRef.current === runId) {
            setAiStep("");
            setLoadingState(false);
          }
        }, 220);
      }
    }
  }

  return {
    file,
    imagePreview,
    listingResult,
    generatedListingId,
    loadingState,
    progress,
    aiStep,
    handleFile,
    reset,
  };
}
