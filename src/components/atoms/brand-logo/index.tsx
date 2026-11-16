import styles from "./index.module.css";

type BrandLogoProps = {
  size?: number;
  tone?: "light" | "dark";
  wordmark?: boolean;
};

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 64 64" width={size}>
      <rect fill="#0a5558" height="64" rx="16" width="64" />
      <circle
        cx="32"
        cy="32"
        fill="none"
        r="18"
        stroke="#f3fffe"
        strokeWidth="4.5"
      />
      <circle
        cx="32"
        cy="32"
        fill="none"
        pathLength="2"
        r="18"
        stroke="#d7c4a3"
        strokeDasharray="1 1"
        strokeWidth="4.5"
        transform="rotate(20 32 32)"
      />
    </svg>
  );
}

export function BrandLogo({
  size = 40,
  tone = "light",
  wordmark = true,
}: BrandLogoProps) {
  return (
    <span className={styles.logo} data-tone={tone}>
      <BrandMark size={size} />
      {wordmark ? <span className={styles.word}>Agendinha</span> : null}
    </span>
  );
}
