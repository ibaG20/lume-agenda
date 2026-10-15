import { Skeleton } from "@/components/atoms/skeleton";

export function RouteLoading({ label }: { label: string }) {
  return (
    <section
      aria-busy="true"
      className="flex flex-col gap-3 py-2"
      role="status"
    >
      <span className="sr-only">{label}</span>
      <Skeleton height="1.6rem" width="12rem" />
      <Skeleton height="4.5rem" />
      <Skeleton height="4.5rem" />
      <Skeleton height="4.5rem" width="80%" />
    </section>
  );
}
