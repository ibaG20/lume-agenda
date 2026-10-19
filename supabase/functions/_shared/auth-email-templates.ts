import {
  escapeHtml,
  LOGO_CONTENT_ID,
  type RenderedEmail,
} from "./email-templates.ts";

export type AuthEmailAction =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email"
  | "reauthentication"
  | "password_changed_notification"
  | "email_changed_notification"
  | "phone_changed_notification"
  | "identity_linked_notification"
  | "identity_unlinked_notification"
  | "mfa_factor_enrolled_notification"
  | "mfa_factor_unenrolled_notification";

export type AuthHookPayload = {
  user: {
    id: string;
    email: string;
    new_email?: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: AuthEmailAction | string;
    site_url: string;
    token_new: string;
    token_hash_new: string;
  };
};

export type AuthEmailDelivery = {
  to: string;
  rendered: RenderedEmail;
};

type AuthEmailContent = {
  subject: string;
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  action?: { label: string; url: string };
  code?: string;
  note: string;
};

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
};

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function confirmationUrl(
  supabaseUrl: string,
  tokenHash: string,
  action: string,
  redirectTo: string,
): string {
  const url = new URL("/auth/v1/verify", supabaseUrl);
  url.searchParams.set("token", tokenHash);
  url.searchParams.set("type", action);
  url.searchParams.set("redirect_to", redirectTo);
  return url.toString();
}

function contentFor(
  action: string,
  options: { url?: string; token?: string; newEmail?: string },
): AuthEmailContent {
  switch (action) {
    case "signup":
      return {
        subject: "Confirme sua conta na Lume Agendas",
        preheader: "Confirme seu e-mail para começar a usar a Lume Agendas.",
        eyebrow: "Confirmação de cadastro",
        title: "Só falta confirmar seu e-mail",
        intro:
          "Recebemos seu cadastro. Confirme este endereço para ativar sua conta e acessar sua agenda.",
        action: { label: "Confirmar minha conta", url: options.url! },
        note:
          "Se você não criou uma conta na Lume Agendas, pode ignorar esta mensagem com segurança.",
      };
    case "invite":
      return {
        subject: "Você recebeu um convite para a Lume Agendas",
        preheader: "Aceite o convite para acessar a Lume Agendas.",
        eyebrow: "Convite",
        title: "Sua agenda está esperando por você",
        intro:
          "Você foi convidado para usar a Lume Agendas. Aceite o convite para concluir seu acesso.",
        action: { label: "Aceitar convite", url: options.url! },
        note: "Se você não esperava este convite, pode ignorar esta mensagem.",
      };
    case "magiclink":
      return {
        subject: "Seu acesso à Lume Agendas",
        preheader: "Use este link seguro para entrar na sua conta.",
        eyebrow: "Acesso seguro",
        title: "Entre na sua conta",
        intro:
          "Use o botão abaixo para entrar na Lume Agendas sem precisar digitar sua senha.",
        action: { label: "Entrar na Lume Agendas", url: options.url! },
        note:
          "Este link é pessoal e expira em breve. Não encaminhe esta mensagem para outras pessoas.",
      };
    case "recovery":
      return {
        subject: "Redefina sua senha da Lume Agendas",
        preheader: "Crie uma nova senha para recuperar seu acesso.",
        eyebrow: "Recuperação de acesso",
        title: "Vamos criar uma nova senha",
        intro:
          "Recebemos um pedido para redefinir sua senha. Continue pelo botão abaixo.",
        action: { label: "Criar nova senha", url: options.url! },
        note:
          "Se você não pediu a redefinição, ignore esta mensagem. Sua senha continuará a mesma.",
      };
    case "email_change":
    case "email":
      return {
        subject: "Confirme seu novo e-mail na Lume Agendas",
        preheader: "Confirme a alteração do endereço de e-mail da sua conta.",
        eyebrow: "Alteração de e-mail",
        title: "Confirme seu novo endereço",
        intro: options.newEmail
          ? `Confirme a alteração do e-mail da sua conta para ${
            escapeHtml(options.newEmail)
          }.`
          : "Confirme a alteração do endereço de e-mail associado à sua conta.",
        action: { label: "Confirmar novo e-mail", url: options.url! },
        note:
          "Se você não solicitou esta alteração, proteja sua conta trocando a senha imediatamente.",
      };
    case "reauthentication":
      return {
        subject: "Seu código de verificação da Lume Agendas",
        preheader: "Use este código para confirmar sua identidade.",
        eyebrow: "Verificação de segurança",
        title: "Confirme que é você",
        intro: "Digite o código abaixo para continuar a operação protegida.",
        code: options.token,
        note:
          "O código expira em breve. Nunca compartilhe este código com outra pessoa.",
      };
    case "password_changed_notification":
      return securityNotification(
        "Senha alterada",
        "Sua senha foi alterada",
        "A senha da sua conta foi atualizada com sucesso.",
      );
    case "email_changed_notification":
      return securityNotification(
        "E-mail alterado",
        "Seu e-mail foi alterado",
        "O endereço de e-mail da sua conta foi atualizado com sucesso.",
      );
    case "phone_changed_notification":
      return securityNotification(
        "Telefone alterado",
        "Seu telefone foi alterado",
        "O telefone associado à sua conta foi atualizado com sucesso.",
      );
    case "identity_linked_notification":
      return securityNotification(
        "Novo acesso conectado",
        "Uma nova forma de acesso foi conectada",
        "Uma nova identidade foi vinculada à sua conta.",
      );
    case "identity_unlinked_notification":
      return securityNotification(
        "Acesso desconectado",
        "Uma forma de acesso foi removida",
        "Uma identidade vinculada à sua conta foi removida.",
      );
    case "mfa_factor_enrolled_notification":
      return securityNotification(
        "Verificação em duas etapas ativada",
        "Sua conta ganhou uma camada extra de proteção",
        "Um novo método de verificação em duas etapas foi ativado.",
      );
    case "mfa_factor_unenrolled_notification":
      return securityNotification(
        "Verificação em duas etapas removida",
        "Um método de segurança foi removido",
        "Um método de verificação em duas etapas foi removido da sua conta.",
      );
    default:
      throw new Error(`Unsupported auth email action: ${action}`);
  }
}

function securityNotification(
  eyebrow: string,
  title: string,
  intro: string,
): AuthEmailContent {
  return {
    subject: `${title} | Lume Agendas`,
    preheader: intro,
    eyebrow,
    title,
    intro,
    note:
      "Se não foi você, altere sua senha e revise a segurança da conta imediatamente.",
  };
}

function render(content: AuthEmailContent): RenderedEmail {
  const actionUrl = content.action ? escapeHtml(content.action.url) : undefined;
  const code = content.code ? escapeHtml(content.code) : undefined;
  const actionText = content.action
    ? `${content.action.label}: ${content.action.url}`
    : code
    ? `Código: ${content.code}`
    : "";

  return {
    subject: content.subject,
    text: [
      content.title,
      "",
      content.intro.replace(/<[^>]+>/g, ""),
      actionText ? `\n${actionText}` : "",
      "",
      content.note,
      "",
      "Lume Agendas",
    ].join("\n"),
    html: `<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<title>${escapeHtml(content.title)}</title>
<style>@media (max-width:620px){.container{width:100%!important}.card-pad{padding:28px 22px!important}.title{font-size:24px!important}.button a{display:block!important}}</style>
</head>
<body style="margin:0;padding:0;background-color:${COLOR.page};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${
      escapeHtml(content.preheader)
    }&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.page};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;">
<tr><td style="padding:0 4px 20px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="vertical-align:middle;padding-right:12px;"><img src="cid:${LOGO_CONTENT_ID}" width="40" height="40" alt="Lume Agendas" style="display:block;width:40px;height:40px;border:0;border-radius:10px;"></td>
<td style="vertical-align:middle;font-family:${FONT};font-size:17px;font-weight:800;color:${COLOR.text};">Lume Agendas</td>
</tr></table></td></tr>
<tr><td style="background-color:${COLOR.card};border:1.5px solid ${COLOR.border};border-radius:14px;overflow:hidden;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="height:6px;line-height:6px;font-size:0;background-color:${COLOR.primary};">&nbsp;</td></tr>
<tr><td class="card-pad" style="padding:36px 36px 32px;">
<span style="display:inline-block;background-color:${COLOR.sandSoft};border:1.5px solid ${COLOR.sand};border-radius:999px;padding:5px 12px;font-family:${FONT};font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${COLOR.primary};">${
      escapeHtml(content.eyebrow)
    }</span>
<h1 class="title" style="margin:18px 0 0;font-family:${FONT};font-size:28px;line-height:1.15;font-weight:900;color:${COLOR.text};">${
      escapeHtml(content.title)
    }</h1>
<p style="margin:14px 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${COLOR.muted};">${content.intro}</p>
${
      code
        ? `<div style="margin-top:26px;padding:18px;text-align:center;background-color:${COLOR.page};border:1.5px solid ${COLOR.soft};border-radius:12px;font-family:${FONT};font-size:30px;font-weight:900;letter-spacing:.18em;color:${COLOR.text};">${code}</div>`
        : ""
    }
${
      content.action
        ? `<table role="presentation" class="button" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;"><tr><td align="center" style="border-radius:12px;background-color:${COLOR.primary};"><a href="${actionUrl}" target="_blank" style="display:inline-block;padding:16px 28px;font-family:${FONT};font-size:15px;font-weight:800;color:${COLOR.primaryContent};text-decoration:none;border-radius:12px;">${
          escapeHtml(content.action.label)
        }</a></td></tr></table><p style="margin:16px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${COLOR.subtle};text-align:center;">Se o botão não funcionar, copie e cole este endereço no navegador:<br><a href="${actionUrl}" target="_blank" style="color:${COLOR.primary};word-break:break-all;">${actionUrl}</a></p>`
        : ""
    }
<div style="margin-top:26px;background-color:${COLOR.sandSoft};border-left:4px solid ${COLOR.sand};border-radius:8px;padding:14px 16px;font-family:${FONT};font-size:13px;line-height:1.55;color:${COLOR.muted};">${
      escapeHtml(content.note)
    }</div>
</td></tr></table></td></tr>
<tr><td style="padding:24px 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${COLOR.subtle};text-align:center;">Esta é uma mensagem automática de segurança da <strong>Lume Agendas</strong>.<br>Não é preciso respondê-la.</td></tr>
</table></td></tr></table>
</body></html>`,
  };
}

function renderLinkedEmail(
  action: string,
  supabaseUrl: string,
  tokenHash: string,
  redirectTo: string,
  newEmail?: string,
): RenderedEmail {
  if (!tokenHash) throw new Error(`Missing token hash for ${action}`);
  return render(contentFor(action, {
    url: confirmationUrl(supabaseUrl, tokenHash, action, redirectTo),
    newEmail,
  }));
}

export function buildAuthEmailDeliveries(
  payload: AuthHookPayload,
  supabaseUrl: string,
): AuthEmailDelivery[] {
  const { user, email_data: data } = payload;
  if (!user.email) throw new Error("Auth hook payload has no recipient email");
  const redirectTo = data.redirect_to || data.site_url;
  const action = data.email_action_type;

  if (action === "email_change") {
    const newEmail = user.new_email || user.email;
    const deliveries: AuthEmailDelivery[] = [];

    if (data.token_hash_new) {
      deliveries.push({
        to: user.email,
        rendered: renderLinkedEmail(
          action,
          supabaseUrl,
          data.token_hash_new,
          redirectTo,
          newEmail,
        ),
      });
    }

    if (data.token_hash) {
      deliveries.push({
        to: newEmail,
        rendered: renderLinkedEmail(
          action,
          supabaseUrl,
          data.token_hash,
          redirectTo,
          newEmail,
        ),
      });
    }

    if (deliveries.length === 0) {
      throw new Error("Missing token hash for email_change");
    }
    return deliveries;
  }

  if (["signup", "invite", "magiclink", "recovery", "email"].includes(action)) {
    return [{
      to: user.email,
      rendered: renderLinkedEmail(
        action,
        supabaseUrl,
        data.token_hash,
        redirectTo,
      ),
    }];
  }

  return [{
    to: user.email,
    rendered: render(contentFor(action, { token: data.token })),
  }];
}
