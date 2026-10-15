type CachedNoticeProps = {
  cachedAt?: number;
  fromCache?: boolean;
};

export function CachedNotice({ cachedAt, fromCache }: CachedNoticeProps) {
  if (!fromCache || !cachedAt) return null;

  const label = new Date(cachedAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <p className="text-sm font-semibold" role="status">
      Dados de {label}. A lista atualiza quando a conexão voltar.
    </p>
  );
}
