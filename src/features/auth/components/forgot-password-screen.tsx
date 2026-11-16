"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/atoms/submit-button";
import { usePasswordResetRequest } from "../hooks/use-password-recovery";
import { AuthCard } from "./auth-card";

type ForgotPasswordScreenProps = {
  configured: boolean;
  initialError?: string;
};

const INITIAL_ERROR_MESSAGES: Record<string, string> = {
  invalid_link:
    "Este link é inválido ou expirou. Solicite um novo e-mail de recuperação.",
  unavailable: "A recuperação de senha está temporariamente indisponível.",
};

export function ForgotPasswordScreen({
  configured,
  initialError,
}: ForgotPasswordScreenProps) {
  const recovery = usePasswordResetRequest();
  const [sent, setSent] = useState(false);
  const isBusy = recovery.status === "pending";
  const errorMessage =
    recovery.error?.message ??
    (initialError ? INITIAL_ERROR_MESSAGES[initialError] : undefined) ??
    (!configured
      ? "Configure as variáveis públicas do Supabase para recuperar a senha."
      : undefined);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || isBusy) return;

    const form = new FormData(event.currentTarget);
    const result = await recovery.requestPasswordReset(
      String(form.get("email") ?? "").trim(),
    );
    if (result.ok) setSent(true);
  }

  if (sent) {
    return (
      <AuthCard
        title="Confira seu e-mail"
        description="Se existir uma conta com esse endereço, você receberá um link para criar uma nova senha."
        footer={
          <Link
            className="font-semibold text-primary underline-offset-4 hover:underline"
            href="/sign-in"
          >
            Voltar para entrar
          </Link>
        }
      >
        <div className="alert alert-success text-sm" role="status">
          <span>Enviamos as instruções de recuperação.</span>
        </div>
        <p className="text-sm leading-6 text-base-content/70">
          Verifique também as pastas de spam ou lixo eletrônico. O link expira
          por segurança.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Esqueceu sua senha?"
      description="Informe seu e-mail para receber um link seguro de recuperação."
      footer={
        <Link
          className="font-semibold text-primary underline-offset-4 hover:underline"
          href="/sign-in"
        >
          Voltar para entrar
        </Link>
      }
    >
      {errorMessage ? (
        <div className="alert alert-error text-sm" role="alert">
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <fieldset className="fieldset">
          <label className="fieldset-legend" htmlFor="forgot-password-email">
            E-mail
          </label>
          <input
            autoComplete="email"
            autoFocus
            className="input input-bordered w-full"
            disabled={!configured || isBusy}
            id="forgot-password-email"
            name="email"
            placeholder="voce@exemplo.com"
            required
            type="email"
          />
        </fieldset>

        <SubmitButton
          className="btn btn-primary btn-block"
          disabled={!configured || isBusy}
          pending={isBusy}
          pendingLabel="Enviando…"
        >
          Enviar link de recuperação
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
