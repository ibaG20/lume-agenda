"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/atoms/submit-button";
import { usePasswordUpdate } from "../hooks/use-password-recovery";
import { AuthCard } from "./auth-card";

type ResetPasswordScreenProps = {
  configured: boolean;
};

export function ResetPasswordScreen({ configured }: ResetPasswordScreenProps) {
  const recovery = usePasswordUpdate();
  const [localError, setLocalError] = useState<string>();
  const [updated, setUpdated] = useState(false);
  const isBusy = recovery.status === "pending";
  const errorMessage =
    localError ??
    recovery.error?.message ??
    (!configured
      ? "Configure as variáveis públicas do Supabase para atualizar a senha."
      : undefined);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || isBusy) return;

    setLocalError(undefined);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("passwordConfirmation") ?? "");

    if (password !== confirmation) {
      setLocalError("As senhas precisam ser iguais.");
      return;
    }

    const result = await recovery.updatePassword(password);
    if (result.ok) setUpdated(true);
  }

  if (updated) {
    return (
      <AuthCard
        title="Senha atualizada"
        description="Sua nova senha já está valendo e sua conta continua protegida."
        footer={
          <Link
            className="font-semibold text-primary underline-offset-4 hover:underline"
            href="/inicio"
          >
            Ir para minha agenda
          </Link>
        }
      >
        <div className="alert alert-success text-sm" role="status">
          <span>Senha alterada com sucesso.</span>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Crie uma nova senha"
      description="Escolha uma senha diferente da anterior para recuperar seu acesso."
      footer={
        <Link
          className="font-semibold text-primary underline-offset-4 hover:underline"
          href="/forgot-password"
        >
          Solicitar outro link
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
          <label className="fieldset-legend" htmlFor="reset-password">
            Nova senha
          </label>
          <input
            autoComplete="new-password"
            autoFocus
            className="input input-bordered w-full"
            disabled={!configured || isBusy}
            id="reset-password"
            minLength={6}
            name="password"
            required
            type="password"
          />
          <p className="label">Use pelo menos 6 caracteres.</p>
        </fieldset>

        <fieldset className="fieldset">
          <label
            className="fieldset-legend"
            htmlFor="reset-password-confirmation"
          >
            Confirme a nova senha
          </label>
          <input
            autoComplete="new-password"
            className="input input-bordered w-full"
            disabled={!configured || isBusy}
            id="reset-password-confirmation"
            minLength={6}
            name="passwordConfirmation"
            required
            type="password"
          />
        </fieldset>

        <SubmitButton
          className="btn btn-primary btn-block"
          disabled={!configured || isBusy}
          pending={isBusy}
          pendingLabel="Atualizando…"
        >
          Atualizar senha
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
