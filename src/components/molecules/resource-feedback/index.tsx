import { Skeleton } from "@/components/atoms/skeleton";
import styles from "./index.module.css";

type ResourceFeedbackProps = {
  kind?: "loading" | "empty" | "error" | "success";
  title: string;
  description?: string;
  onRetry?: () => void;
};

export function ResourceFeedback({
  kind = "empty",
  title,
  description,
  onRetry,
}: ResourceFeedbackProps) {
  if (kind === "loading") {
    return (
      <section aria-busy="true" aria-live="polite" className={styles.loading}>
        <span className="sr-only">{title}</span>
        <Skeleton height="1rem" width="40%" />
        <Skeleton height="3.2rem" />
        <Skeleton height="3.2rem" />
      </section>
    );
  }

  return (
    <section className={styles.feedback} data-kind={kind} aria-live="polite">
      <div>
        <h2 className={styles.title}>{title}</h2>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
      </div>
      {onRetry ? (
        <button className={styles.retry} onClick={onRetry} type="button">
          Tentar novamente
        </button>
      ) : null}
    </section>
  );
}
