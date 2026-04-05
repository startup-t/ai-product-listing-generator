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
  return (
    <div className={styles.list}>
      {steps.map((step, i) => (
        <div
          key={step.id}
          className={`${styles.row} ${step.state === "done" ? styles.done : ""}`}
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
  );
}

export const STEPS: Step[] = [
  { id: "bg",      label: "Removing background",  sub: "Cleaning product image",                         state: "idle" },
  { id: "vision",  label: "Analysing product",     sub: "Category, condition, material, colour, attributes", state: "idle" },
  { id: "price",   label: "Estimating price",      sub: "Category, quality signals and market patterns", state: "idle" },
  { id: "listing", label: "Writing listing",       sub: "Title, descriptions, bullets, tags, platform tips", state: "idle" },
];
