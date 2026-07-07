const BREVO_API_URL = "https://api.brevo.com/v3/contacts";
const BREVO_EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email";

const LIST_LEADS   = 2;
const LIST_WEBSITE = 5;

async function getBrevoContact(email: string): Promise<{ listIds: number[] } | null> {
  const res = await fetch(`${BREVO_API_URL}/${encodeURIComponent(email)}`, {
    headers: { "api-key": process.env.BREVO_API_KEY! },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[Brevo] Failed to fetch contact ${email}: ${res.status} ${body}`);
    return null;
  }
  return res.json();
}

// Waitlist signup from the landing page — always goes to the "leads" list.
export async function addToWaitlist(email: string) {
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      listIds: [LIST_LEADS],
      updateEnabled: true,
    }),
  });

  if (!res.ok && res.status !== 204) {
    const body = await res.text().catch(() => "");
    console.error(`[Brevo] Failed to add ${email} to waitlist: ${res.status} ${body}`);
  }
}

// Real account registration — if the email was a lead, move it to the "website" list;
// otherwise, register it directly in the "website" list.
export async function addContactToBrevo(email: string, name?: string) {
  const existing = await getBrevoContact(email);
  const wasLead = existing?.listIds?.includes(LIST_LEADS) ?? false;
  const attributes = name ? { FIRSTNAME: name } : undefined;

  const res = existing
    ? await fetch(`${BREVO_API_URL}/${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: {
          "api-key": process.env.BREVO_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attributes,
          listIds: [LIST_WEBSITE],
          unlinkListIds: wasLead ? [LIST_LEADS] : undefined,
        }),
      })
    : await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          attributes,
          listIds: [LIST_WEBSITE],
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
