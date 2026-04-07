const steps = [
  { key: "first_upload", label: "Upload" },
  { key: "first_processed", label: "Analyzed" },
  { key: "first_outfit", label: "Outfit" },
  { key: "complete", label: "Complete" },
];

const stateOrder = [
  "signup",
  "first_upload",
  "first_processed",
  "first_outfit",
  "complete",
];

export function ProgressIndicator({ currentState }: { currentState: string }) {
  const currentIndex = stateOrder.indexOf(currentState);
  if (currentIndex >= stateOrder.length - 1) return null; // complete
  return (
    <div
      className="flex items-center gap-2 mb-10"
      role="progressbar"
      aria-label="Onboarding progress"
      aria-valuetext={currentState}
    >
      {steps.map((step, i) => {
        const stepIndex = stateOrder.indexOf(step.key);
        const isComplete = currentIndex >= stepIndex;
        const isCurrent = currentIndex === stepIndex - 1;
        return (
          <div key={step.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`w-8 h-px ${isComplete ? "bg-primary" : "bg-outline-variant/30"}`}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 flex items-center justify-center text-label-md ${
                  isComplete
                    ? "bg-primary text-on-primary"
                    : isCurrent
                      ? "ghost-border text-primary"
                      : "bg-surface-container-high text-on-surface-variant"
                }`}
                aria-hidden="true"
              >
                {isComplete ? "✓" : i + 1}
              </div>
              <span
                className={`label-text text-label-md ${isComplete ? "text-primary" : "text-on-surface-variant"}`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
