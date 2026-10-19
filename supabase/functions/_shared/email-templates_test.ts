import {
  LOGO_CONTENT_ID,
  renderBookingConfirmed,
  renderClientCancelled,
  renderProviderCancelled,
} from "./email-templates.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const details = {
  clientName: "Ana <script>",
  providerName: "Salão & Cia",
  day: "segunda-feira, 19 de outubro",
  start: "09:00",
  end: "10:00",
};

Deno.test("confirmation email links to cancellation and embeds the logo", () => {
  const email = renderBookingConfirmed(
    details,
    "https://app.example.com/cancel?token=abc",
  );
  assert(email.subject === "Agendamento confirmado com Salão & Cia", "subject");
  assert(email.html.includes(`cid:${LOGO_CONTENT_ID}`), "logo cid");
  assert(
    email.html.includes('href="https://app.example.com/cancel?token=abc"'),
    "cancellation link",
  );
  assert(email.html.includes("Segunda-feira, 19 de outubro"), "day");
  assert(email.text.includes("09:00 às 10:00"), "plain text time");
});

Deno.test("cancellation email links to rebooking", () => {
  const email = renderProviderCancelled(
    details,
    "https://app.example.com/salao/agendar",
  );
  assert(
    email.html.includes('href="https://app.example.com/salao/agendar"'),
    "rebook link",
  );
  assert(email.text.includes("Escolher outro horário"), "plain text action");
});

Deno.test("client cancellation email addresses the provider and links to the agenda", () => {
  const email = renderClientCancelled(
    details,
    "https://app.example.com/inicio/agendamentos",
  );
  assert(email.subject === "Ana <script> cancelou um agendamento", "subject");
  assert(
    email.html.includes('href="https://app.example.com/inicio/agendamentos"'),
    "agenda link",
  );
  assert(email.html.includes("Cliente"), "client detail label");
  assert(email.text.startsWith("Olá, Salão & Cia."), "provider greeting");
  assert(email.text.includes("Cliente: Ana <script>"), "client detail");
});

Deno.test("escapes client and provider names in HTML", () => {
  const { html } = renderBookingConfirmed(details, "https://app.example.com");
  assert(!html.includes("Ana <script>"), "raw client name");
  assert(html.includes("Ana &lt;script&gt;"), "escaped client name");
  assert(html.includes("Salão &amp; Cia"), "escaped provider name");
});
