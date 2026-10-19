import {
  type AuthHookPayload,
  buildAuthEmailDeliveries,
} from "./auth-email-templates.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function payload(
  action: string,
  overrides: Partial<AuthHookPayload["email_data"]> = {},
): AuthHookPayload {
  return {
    user: { id: "user-id", email: "ana@example.com" },
    email_data: {
      token: "123456",
      token_hash: "signup-hash",
      redirect_to: "https://lume.example.com/auth/callback?next=/inicio",
      email_action_type: action,
      site_url: "https://lume.example.com",
      token_new: "",
      token_hash_new: "",
      ...overrides,
    },
  };
}

Deno.test("signup email uses the Supabase verification endpoint", () => {
  const [delivery] = buildAuthEmailDeliveries(
    payload("signup"),
    "https://project.supabase.co",
  );

  assert(delivery.to === "ana@example.com", "signup recipient");
  assert(
    delivery.rendered.subject === "Confirme sua conta na Lume Agendas",
    "signup subject",
  );
  assert(
    delivery.rendered.html.includes(
      "https://project.supabase.co/auth/v1/verify?token=signup-hash&amp;type=signup&amp;redirect_to=https%3A%2F%2Flume.example.com%2Fauth%2Fcallback%3Fnext%3D%2Finicio",
    ),
    "confirmation URL",
  );
});

Deno.test("secure email change sends one message to each address", () => {
  const event = payload("email_change", {
    token_hash: "new-address-hash",
    token_new: "654321",
    token_hash_new: "current-address-hash",
  });
  event.user.new_email = "nova@example.com";

  const deliveries = buildAuthEmailDeliveries(
    event,
    "https://project.supabase.co",
  );

  assert(deliveries.length === 2, "delivery count");
  assert(deliveries[0].to === "ana@example.com", "current recipient");
  assert(
    deliveries[0].rendered.html.includes("token=current-address-hash"),
    "current email token hash",
  );
  assert(deliveries[1].to === "nova@example.com", "new recipient");
  assert(
    deliveries[1].rendered.html.includes("token=new-address-hash"),
    "new email token hash",
  );
});

Deno.test("reauthentication email displays the one-time code", () => {
  const [delivery] = buildAuthEmailDeliveries(
    payload("reauthentication"),
    "https://project.supabase.co",
  );

  assert(delivery.rendered.html.includes("123456"), "HTML code");
  assert(delivery.rendered.text.includes("Código: 123456"), "text code");
});

Deno.test("unknown auth email actions fail closed", () => {
  let failed = false;
  try {
    buildAuthEmailDeliveries(
      payload("unknown_action"),
      "https://project.supabase.co",
    );
  } catch {
    failed = true;
  }
  assert(failed, "unknown action must fail");
});
