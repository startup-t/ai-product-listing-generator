import { t, type LanguageCode } from "@/lib/localization";
import styles from "./ProgressSteps.module.css";

export type StepState = "idle" | "running" | "done";

export interface Step {
  id: string;
  label: string;
  sub: string;
  state: StepState;
}

interface ProgressStepsProps {
  steps: Step[];
  language: LanguageCode;
}

export function getProgressSteps(language: LanguageCode): Step[] {
  return [
    {
      id: "bg",
      label: t(language, "removingBackground"),
      sub: t(language, "cleaningProductImage"),
      state: "idle",
    },
    {
      id: "vision",
      label: t(language, "analysingProduct"),
      sub: t(language, "visionStepSub"),
      state: "idle",
    },
    {
      id: "price",
      label: t(language, "estimatingPrice"),
      sub: t(language, "priceStepSub"),
      state: "idle",
    },
    {
      id: "listing",
      label: t(language, "writingListing"),
      sub: t(language, "listingStepSub"),
      state: "idle",
    },
  ];
}

export function ProgressSteps({ steps, language }: ProgressStepsProps) {
  const currentStep = steps.find((step) => step.state === "running") ?? null;
  const progressByStep: Record<string, number> = {
    bg: 25,
    vision: 50,
    price: 75,
    listing: 100,
  };

  const progress =
    currentStep
      ? progressByStep[currentStep.id] ?? 0
      : steps.every((step) => step.state === "done")
        ? 100
        : 0;

  const statusLabel = currentStep
    ? `${currentStep.label}...`
    : progress === 100
      ? t(language, "listingGenerated")
      : t(language, "preparingListing");

  return (
    <div className={styles.wrap}>
      <section className={styles.summary} aria-live="polite">
        <div className={styles.summaryTop}>
          <div>
            <div className={styles.eyebrow}>{t(language, "creatingListing")}</div>
            <div className={styles.status}>{statusLabel}</div>
            <div className={styles.timeHint}>{t(language, "usualTimeHint")}</div>
          </div>
          <div className={styles.percent}>{progress}%</div>
        </div>

        <div
          className={styles.track}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={statusLabel}
        >
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.summarySub}>
          {currentStep?.sub ?? t(language, "processingSummary")}
        </div>
      </section>

      <div className={styles.list}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`${styles.row} ${styles[`row${step.state[0].toUpperCase()}${step.state.slice(1)}`] ?? ""}`}
          >
            <div className={`${styles.dot} ${styles[step.state]}`}>
              {step.state === "done" ? "✓" : index + 1}
            </div>
            <div>
              <div className={styles.label}>{step.label}</div>
              <div className={styles.sub}>{step.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
