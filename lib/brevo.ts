const BREVO_API_URL = "https://api.brevo.com/v3/contacts";
const BREVO_EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function addContactToBrevo(email: string, name?: string) {
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      attributes: name ? { FIRSTNAME: name } : undefined,
      listIds: [5],
      updateEnabled: true,
    }),
  });

  if (!res.ok && res.status !== 204) {
    const body = await res.text().catch(() => "");
    console.error(`[Brevo] Failed to add ${email}: ${res.status} ${body}`);
  }
}

export async function sendInviteCodeEmail(email: string, code: string) {
  const res = await fetch(BREVO_EMAIL_API_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: [{ email }],
      templateId: 2,
      params: { Code: code },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[Brevo] Failed to send invite code to ${email}: ${res.status} ${body}`);
  }
}
