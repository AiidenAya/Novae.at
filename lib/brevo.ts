const BREVO_API_URL = "https://api.brevo.com/v3/contacts";

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
