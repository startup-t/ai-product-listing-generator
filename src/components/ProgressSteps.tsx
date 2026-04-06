import styles from "./ProgressSteps.module.css";

export type StepState = "idle" | "running" | "done";

interface Step {
  id: string;
  label: string;
  sub: string;
  state: StepState;
}

interface ProgressStepsProps {
  steps: Step[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
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
      ? "Listing ready"
      : "Preparing listing...";

  return (
    <div className={styles.wrap}>
      <section className={styles.summary} aria-live="polite">
        <div className={styles.summaryTop}>
          <div>
            <div className={styles.eyebrow}>Creating your listing</div>
            <div className={styles.status}>{statusLabel}</div>
            <div className={styles.timeHint}>Usually takes 5-10 seconds</div>
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
          {currentStep?.sub ?? "We’re processing your image and drafting the listing."}
        </div>
      </section>

      <div className={styles.list}>
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`${styles.row} ${styles[`row${step.state[0].toUpperCase()}${step.state.slice(1)}`] ?? ""}`}
          >
            <div className={`${styles.dot} ${styles[step.state]}`}>
              {step.state === "done" ? "✓" : i + 1}
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

export const STEPS: Step[] = [
  { id: "bg",      label: "Removing background",  sub: "Cleaning product image",                         state: "idle" },
  { id: "vision",  label: "Analysing product",     sub: "Category, condition, material, colour, attributes", state: "idle" },
  { id: "price",   label: "Estimating price",      sub: "Category, quality signals and market patterns", state: "idle" },
  { id: "listing", label: "Writing listing",       sub: "Title, descriptions, bullets, tags, platform tips", state: "idle" },
];
