import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center gap-3 px-4">
      <p className="text-sm font-bold text-primary">404</p>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-sm leading-6 opacity-80">
        Esse endereço não existe ou o link público mudou.
      </p>
      <Link className="btn btn-primary w-fit" href="/inicio">
        Ir para o início
      </Link>
    </section>
  );
}
