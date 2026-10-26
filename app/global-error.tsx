"use client";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          background: "#f3f7f7",
          color: "#14383c",
          fontFamily: "sans-serif",
          margin: 0,
          minHeight: "100vh",
          padding: "2.5rem 1.25rem",
        }}
      >
        <h1 style={{ fontSize: "1.6rem" }}>A Agendinha encontrou um erro</h1>
        <p style={{ lineHeight: 1.5, maxWidth: "32rem" }}>
          Recarregue a página. Se o problema continuar, tente de novo mais
          tarde.
        </p>
        <button
          onClick={() => retry()}
          style={{
            background: "#0a5558",
            border: 0,
            borderRadius: "0.75rem",
            color: "#f3fffe",
            fontWeight: 700,
            marginTop: "1rem",
            minHeight: "2.75rem",
            padding: "0.6rem 1rem",
          }}
          type="button"
        >
          Tentar novamente
        </button>
        {error.digest ? (
          <p style={{ fontSize: "0.75rem", opacity: 0.7 }}>
            Código {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  );
}
