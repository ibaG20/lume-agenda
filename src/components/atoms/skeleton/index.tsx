import styles from "./index.module.css";

type SkeletonProps = {
  width?: string;
  height?: string;
};

export function Skeleton({ width = "100%", height = "0.9rem" }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={styles.bone}
      style={{ width, height }}
    />
  );
}
