import { t, type LanguageCode } from "@/lib/localization";
import styles from "./ErrorBox.module.css";

interface ErrorBoxProps {
  type: "network" | "api" | "parse" | "validation" | "warning";
  message: string;
  hint?: string;
  language: LanguageCode;
}

export function ErrorBox({ type, message, hint, language }: ErrorBoxProps) {
  const titles: Record<ErrorBoxProps["type"], string> = {
    network: t(language, "networkErrorTitle"),
    api: t(language, "apiErrorTitle"),
    parse: t(language, "parseErrorTitle"),
    validation: t(language, "validationErrorTitle"),
    warning: t(language, "noticeTitle"),
  };

  return (
    <div className={`${styles.box} ${styles[type]}`}>
      <div className={styles.title}>{titles[type]}</div>
      <div className={styles.message}>{message}</div>
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
