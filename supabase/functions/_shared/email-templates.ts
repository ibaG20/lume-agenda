export const LOGO_CONTENT_ID = "lume-logo";

const COLOR = {
  page: "#f3f7f7",
  card: "#ffffff",
  border: "#c5d4d4",
  soft: "#e3ecec",
  text: "#14383c",
  muted: "#4f6a6d",
  subtle: "#6b8285",
  primary: "#0a5558",
  primaryContent: "#f3fffe",
  sand: "#d7c4a3",
  sandSoft: "#f6f0e6",
  success: "#166534",
  successSoft: "#e7f3eb",
  error: "#b42318",
  errorSoft: "#fbeceb",
};

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export type EmailDetails = {
  clientName: string;
  providerName: string;
  day: string;
  start: string;
  end: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

type Tone = "success" | "error";

type Layout = {
  preheader: string;
  tone: Tone;
  eyebrow: string;
  title: string;
  intro: string;
  details: EmailDetails;
  audience?: "client" | "provider";
  action: { label: string; url: string };
  note: string;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function detailRow(label: string, value: string, last = false): string {
  const border = last ? "" : `border-bottom:1px solid ${COLOR.soft};`;
  return `<tr>
<td style="padding:14px 0;${border}font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${COLOR.subtle};width:96px;vertical-align:top;">${label}</td>
<td style="padding:14px 0;${border}font-family:${FONT};font-size:15px;font-weight:700;color:${COLOR.text};vertical-align:top;">${value}</td>
</tr>`;
}

function renderLayout(layout: Layout): string {
  const accent = layout.tone === "success" ? COLOR.success : COLOR.error;
  const accentSoft = layout.tone === "success"
    ? COLOR.successSoft
    : COLOR.errorSoft;
  const { details } = layout;
  const audience = layout.audience ?? "client";
  const recipientName = audience === "client"
    ? details.clientName
    : details.providerName;
  const counterpartLabel = audience === "client" ? "Com" : "Cliente";
  const counterpartName = audience === "client"
    ? details.providerName
    : details.clientName;
  const day = escapeHtml(capitalize(details.day));
  const time = `${escapeHtml(details.start)} às ${escapeHtml(details.end)}`;
  const url = escapeHtml(layout.action.url);

  return `<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(layout.title)}</title>
<style>
  @media (max-width: 620px) {
    .container { width: 100% !important; }
    .card-pad { padding: 28px 22px !important; }
    .title { font-size: 24px !important; }
    .button a { display: block !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${COLOR.page};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${
    escapeHtml(layout.preheader)
  }&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.page};">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;">

<tr>
<td style="padding:0 4px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="vertical-align:middle;padding-right:12px;">
<img src="cid:${LOGO_CONTENT_ID}" width="40" height="40" alt="Lume Agendas" style="display:block;width:40px;height:40px;border:0;border-radius:10px;">
</td>
<td style="vertical-align:middle;font-family:${FONT};font-size:17px;font-weight:800;letter-spacing:-0.02em;color:${COLOR.text};">Lume Agendas</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="background-color:${COLOR.card};border:1.5px solid ${COLOR.border};border-radius:14px;overflow:hidden;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="height:6px;line-height:6px;font-size:0;background-color:${COLOR.primary};border-radius:12px 12px 0 0;">&nbsp;</td>
</tr>
<tr>
<td class="card-pad" style="padding:36px 36px 32px;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="background-color:${accentSoft};border:1.5px solid ${accent};border-radius:999px;padding:5px 12px;font-family:${FONT};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${accent};">${
    escapeHtml(layout.eyebrow)
  }</td>
</tr>
</table>

<h1 class="title" style="margin:18px 0 0;font-family:${FONT};font-size:28px;line-height:1.15;font-weight:900;letter-spacing:-0.03em;color:${COLOR.text};">${
    escapeHtml(layout.title)
  }</h1>

<p style="margin:14px 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${COLOR.muted};">Olá, <strong style="color:${COLOR.text};">${
    escapeHtml(recipientName)
  }</strong>. ${layout.intro}</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;background-color:${COLOR.page};border:1.5px solid ${COLOR.soft};border-radius:12px;">
<tr>
<td style="padding:6px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${detailRow(counterpartLabel, escapeHtml(counterpartName))}
${detailRow("Data", day)}
${detailRow("Horário", time, true)}
</table>
</td>
</tr>
</table>

<table role="presentation" class="button" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
<tr>
<td align="center" style="border-radius:12px;background-color:${COLOR.primary};">
<a href="${url}" target="_blank" style="display:inline-block;padding:16px 28px;font-family:${FONT};font-size:15px;font-weight:800;color:${COLOR.primaryContent};text-decoration:none;border-radius:12px;">${
    escapeHtml(layout.action.label)
  }</a>
</td>
</tr>
</table>

<p style="margin:16px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${COLOR.subtle};text-align:center;">Se o botão não funcionar, copie e cole este endereço no navegador:<br><a href="${url}" target="_blank" style="color:${COLOR.primary};word-break:break-all;">${url}</a></p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
<tr>
<td style="background-color:${COLOR.sandSoft};border-left:4px solid ${COLOR.sand};border-radius:8px;padding:14px 16px;font-family:${FONT};font-size:13px;line-height:1.55;color:${COLOR.muted};">${layout.note}</td>
</tr>
</table>

</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:24px 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${COLOR.subtle};text-align:center;">
${
    audience === "client"
      ? `Você recebeu este e-mail porque fez um agendamento com ${
        escapeHtml(details.providerName)
      } pela <strong style="color:${COLOR.muted};">Lume Agendas</strong>.`
      : `Você recebeu este e-mail porque ${
        escapeHtml(details.clientName)
      } agendou um horário com você pela <strong style="color:${COLOR.muted};">Lume Agendas</strong>.`
  }<br>
Esta é uma mensagem automática, não é preciso respondê-la.
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function renderText(lines: string[]): string {
  return lines.join("\n");
}

export function renderBookingConfirmed(
  details: EmailDetails,
  cancellationUrl: string,
): RenderedEmail {
  const provider = escapeHtml(details.providerName);
  const day = capitalize(details.day);
  return {
    subject: `Agendamento confirmado com ${details.providerName}`,
    html: renderLayout({
      preheader: `${day}, das ${details.start} às ${details.end}.`,
      tone: "success",
      eyebrow: "Agendamento confirmado",
      title: "Seu horário está garantido",
      intro:
        `Seu agendamento com <strong style="color:${COLOR.text};">${provider}</strong> foi confirmado. Confira os detalhes abaixo.`,
      details,
      action: { label: "Ver ou cancelar agendamento", url: cancellationUrl },
      note:
        "Não vai conseguir ir? Use o botão acima para cancelar com antecedência e liberar o horário. O link é pessoal, não compartilhe este e-mail.",
    }),
    text: renderText([
      `Olá, ${details.clientName}.`,
      "",
      `Seu agendamento com ${details.providerName} foi confirmado.`,
      "",
      `Data: ${day}`,
      `Horário: ${details.start} às ${details.end}`,
      "",
      `Ver ou cancelar agendamento: ${cancellationUrl}`,
      "",
      "O link é pessoal, não compartilhe este e-mail.",
      "",
      "Lume Agendas",
    ]),
  };
}

export function renderProviderCancelled(
  details: EmailDetails,
  rebookUrl: string,
): RenderedEmail {
  const provider = escapeHtml(details.providerName);
  const day = capitalize(details.day);
  return {
    subject: `Agendamento cancelado por ${details.providerName}`,
    html: renderLayout({
      preheader:
        `${details.providerName} cancelou o horário de ${day}. Escolha outro quando quiser.`,
      tone: "error",
      eyebrow: "Agendamento cancelado",
      title: "Seu horário foi cancelado",
      intro:
        `Infelizmente <strong style="color:${COLOR.text};">${provider}</strong> precisou cancelar o horário que você tinha reservado.`,
      details,
      action: { label: "Escolher outro horário", url: rebookUrl },
      note:
        "Pedimos desculpas pelo transtorno. Os horários disponíveis aparecem atualizados na agenda, é só escolher o que for melhor para você.",
    }),
    text: renderText([
      `Olá, ${details.clientName}.`,
      "",
      `Infelizmente ${details.providerName} precisou cancelar o horário que você tinha reservado.`,
      "",
      `Data: ${day}`,
      `Horário: ${details.start} às ${details.end}`,
      "",
      `Escolher outro horário: ${rebookUrl}`,
      "",
      "Lume Agendas",
    ]),
  };
}

export function renderClientCancelled(
  details: EmailDetails,
  agendaUrl: string,
): RenderedEmail {
  const client = escapeHtml(details.clientName);
  const day = capitalize(details.day);
  return {
    subject: `${details.clientName} cancelou um agendamento`,
    html: renderLayout({
      preheader:
        `${details.clientName} cancelou o horário de ${day}, das ${details.start} às ${details.end}.`,
      tone: "error",
      eyebrow: "Cancelamento do cliente",
      title: "Um horário foi liberado",
      intro:
        `<strong style="color:${COLOR.text};">${client}</strong> cancelou o agendamento abaixo. O horário voltou a ficar disponível na sua agenda.`,
      details,
      audience: "provider",
      action: { label: "Ver agenda", url: agendaUrl },
      note:
        "O cancelamento também foi registrado nos avisos do painel para você consultar e dispensar quando quiser.",
    }),
    text: renderText([
      `Olá, ${details.providerName}.`,
      "",
      `${details.clientName} cancelou o agendamento abaixo. O horário voltou a ficar disponível na sua agenda.`,
      "",
      `Cliente: ${details.clientName}`,
      `Data: ${day}`,
      `Horário: ${details.start} às ${details.end}`,
      "",
      `Ver agenda: ${agendaUrl}`,
      "",
      "Lume Agendas",
    ]),
  };
}
