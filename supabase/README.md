# Supabase local

This directory contains the database migrations and Edge Functions consumed by the web contracts in `docs/supabase.md`.

## Local commands

```bash
supabase start
supabase db reset
supabase functions serve --env-file supabase/functions/.env.local
```

Copy `supabase/functions/.env.example` to `supabase/functions/.env.local` and provide only local/test credentials. Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` when functions run locally or hosted.

## Authentication emails with Resend

The `send-auth-email` Edge Function replaces Supabase Auth's built-in sender and
uses the same Resend account and Agendinha visual identity as the booking emails.

1. Verify the sending domain in Resend and set `RESEND_API_KEY` and
   `RESEND_FROM` as Supabase Edge Function secrets.
2. Deploy with `supabase functions deploy send-auth-email --no-verify-jwt`.
3. In **Authentication > Hooks**, create a **Send Email** HTTPS hook pointing to
   `https://<project-ref>.supabase.co/functions/v1/send-auth-email`.
4. Generate the hook secret in the dashboard and save its complete value
   (`v1,whsec_...`) as the `SEND_EMAIL_HOOK_SECRET` Edge Function secret.
5. Keep the Email provider and **Confirm email** enabled. The enabled hook
   replaces SMTP delivery while Supabase continues to generate and verify the
   authentication tokens.
6. In **Authentication > Rate Limits**, set **Emails sent** to a production-safe
   value supported by the Resend account. The Send Email Hook replaces delivery,
   but Supabase Auth still applies this project-wide limit and returns
   `429 over_email_send_rate_limit` when it is exhausted.

The endpoint deliberately has JWT verification disabled because it authenticates
Supabase Auth through the Standard Webhooks signature. It never logs recipients
or confirmation tokens. `EMAIL_MODE=test` verifies hook requests without calling
Resend during local tests.

## Explicit interim rules

The repository still records DEC-01 through DEC-04 as open. This implementation therefore keeps the undecided behavior narrow and visible:

- recurring rule times and public `date` are interpreted in UTC, and the API returns `timezone: "UTC"`;
- each availability interval is returned as a bookable window; no unapproved fixed slot duration is invented;
- a blocking override takes precedence over recurring and extra availability;
- active weekly groups cannot contain overlapping intervals;
- the existing globally unique client email is preserved, with a provider-specific `ProviderClient` snapshot so one provider can never enumerate personal data supplied to another;
- cancellation preserves the appointment with status `CANCELLED`;
- booking confirmation, provider cancellation, and client cancellation create deduplicated outbox events; client cancellations notify the provider account by email as well as through the in-app notice.

When the decisions are accepted, replace these rules in a new forward-only migration and update this document, `docs/schema.prisma`, and `docs/supabase.md` together.

## Security boundary

- Browser roles receive no direct anonymous table access.
- Provider reads and writes are protected by RLS and `auth.uid()`.
- Public flows use narrowly scoped Edge Functions and server-only RPCs.
- Transaction RPC execution is revoked from `public`, `anon`, and `authenticated`; only `service_role` can call it.
- The service role, JWTs, cancellation tokens, email addresses, and phone numbers are never logged.
- The email and Web Push workers require `x-worker-secret`; schedule
  `process-email-outbox` and `process-notice-outbox` from a trusted runner or
  Supabase Cron/Vault.
- Web Push also requires one matching `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
  pair and `VAPID_SUBJECT` in the Edge Functions secrets. The public key is
  returned to the authenticated PWA; the private key never leaves the worker.
