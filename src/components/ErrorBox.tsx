import styles from "./ErrorBox.module.css";

interface ErrorBoxProps {
  type: "network" | "api" | "parse" | "validation";
  message: string;
  hint?: string;
}

const TITLES: Record<string, string> = {
  network:    "Network error",
  api:        "API error",
  parse:      "Parse error",
  validation: "Validation error",
};

export function ErrorBox({ type, message, hint }: ErrorBoxProps) {
  return (
    <div className={`${styles.box} ${styles[type]}`}>
      <div className={styles.title}>{TITLES[type] ?? "Error"}</div>
      <div className={styles.message}>{message}</div>
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
