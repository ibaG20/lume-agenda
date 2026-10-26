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
      <path
        d="M20 36c1.2-8 7.2-14 14.2-14 5.4 0 10 3.2 12.2 8"
        fill="none"
        stroke="#f3fffe"
        strokeLinecap="round"
        strokeWidth="4.5"
      />
      <path
        d="M44 28c-1.2 8-7.2 14-14.2 14-5.4 0-10-3.2-12.2-8"
        fill="none"
        stroke="#d7c4a3"
        strokeLinecap="round"
        strokeWidth="4.5"
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
