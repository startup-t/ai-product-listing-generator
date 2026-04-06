"use client";

import { useRef, useState } from "react";
import styles from "./UploadZone.module.css";

interface UploadZoneProps {
  onFile: (file: File, dataURL: string) => void;
  preview: string | null;
  downloadHref?: string | null;
  downloadName?: string;
  showDownload?: boolean;
}

export function UploadZone({
  onFile,
  preview,
  downloadHref,
  downloadName = "product-image-cleaned.jpg",
  showDownload = false,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function loadFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onFile(file, e.target.result as string);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.drag : ""} ${preview ? styles.filled : ""}`}
      onClick={() => !preview && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) loadFile(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.input}
        onChange={(e) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); }}
      />
      {preview ? (
        <div className={styles.previewWrap}>
          <div className={styles.previewFrame}>
            <div className={styles.previewInner}>
              <img src={preview} alt="Product preview" className={styles.preview} />
            </div>
          </div>
          {showDownload && downloadHref && (
            <div className={styles.previewActions}>
              <a
                href={downloadHref}
                download={downloadName}
                className={styles.downloadBtn}
              >
                Download cleaned image
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.placeholder}>
          <div className={styles.icon}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className={styles.title}>Drop a product photo here</p>
          <p className={styles.sub}>or click to browse — JPG, PNG, WEBP</p>
        </div>
      )}
    </div>
  );
}
