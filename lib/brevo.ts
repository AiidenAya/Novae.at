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
    throw new Error(`[Brevo] Failed to add ${email}: ${res.status} ${body}`);
  }
}

// Reconciliation pass — heals drift from failed webhooks/hooks by making sure every
// given user ends up in the "website" list and out of the "leads" list. Per-contact
// upserts (not the bulk list endpoints) so it's safe to re-run: a contact already in
// place is just a no-op, rather than an error for the whole batch.
export async function reconcileWebsiteList(users: { email: string; name?: string | null }[]) {
  const failures: string[] = [];
  for (const user of users) {
    try {
      await addContactToBrevo(user.email, user.name ?? undefined);
    } catch {
      failures.push(user.email);
    }
  }
  if (failures.length > 0) {
    throw new Error(`[Brevo] Reconciliation failed for: ${failures.join(", ")}`);
  }
}

// Account deletion — remove the contact from Brevo entirely.
export async function removeContactFromBrevo(email: string) {
  const res = await fetch(`${BREVO_API_URL}/${encodeURIComponent(email)}`, {
    method: "DELETE",
    headers: { "api-key": process.env.BREVO_API_KEY! },
  });

  if (!res.ok && res.status !== 204 && res.status !== 404) {
    const body = await res.text().catch(() => "");
    console.error(`[Brevo] Failed to remove ${email}: ${res.status} ${body}`);
  }
}

export async function sendResetPasswordEmail(email: string, resetUrl: string) {
  const res = await fetch(BREVO_EMAIL_API_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: [{ email }],
      sender: { name: "Novae", email: "no-reply@novae.at" },
      subject: "Réinitialise ton mot de passe Novae",
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Réinitialisation de mot de passe</h2>
          <p>Tu as demandé à réinitialiser le mot de passe de ton compte Novae.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;border-radius:6px;text-decoration:none;">Réinitialiser mon mot de passe</a></p>
          <p>Ce lien expire dans 1 heure. Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[Brevo] Failed to send reset password email to ${email}: ${res.status} ${body}`);
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
