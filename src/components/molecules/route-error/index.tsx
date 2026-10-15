"use client";

type RouteErrorPanelProps = {
  title: string;
  description: string;
  onRetry?: () => void;
};

export function RouteErrorPanel({
  title,
  description,
  onRetry,
}: RouteErrorPanelProps) {
  return (
    <section
      className="mx-auto flex min-h-72 w-full max-w-lg flex-col items-start justify-center gap-3 px-4 py-10"
      role="alert"
    >
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm leading-6 opacity-80">{description}</p>
      {onRetry ? (
        <button className="btn btn-primary" onClick={onRetry} type="button">
          Tentar novamente
        </button>
      ) : null}
    </section>
  );
}
