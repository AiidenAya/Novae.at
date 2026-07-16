"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useT } from "@/lib/locale-context";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>{title}</h2>
      <div style={{ backgroundColor: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "var(--novae-space-3xl)", display: "flex", flexDirection: "column", gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 500, color: "var(--novae-text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--novae-bg-input)",
  border: "1px solid var(--novae-outline-all)",
  borderRadius: "var(--novae-radius-md)",
  outline: "none",
  color: "var(--novae-text-primary)",
  fontFamily: "var(--font-dm-sans)",
  padding: "10px 14px",
  fontSize: "var(--novae-text-base)",
  width: "100%",
  boxSizing: "border-box" as const,
};

const btnPrimary: React.CSSProperties = {
  backgroundColor: "var(--novae-btn-primary)",
  border: "none",
  borderRadius: "var(--novae-radius-md)",
  padding: "10px 24px",
  cursor: "pointer",
  color: "var(--novae-text-btn)",
  fontFamily: "var(--font-dm-sans)",
  fontSize: "var(--novae-text-base)",
  fontWeight: 500,
  alignSelf: "flex-start",
};

const btnDanger: React.CSSProperties = {
  ...btnPrimary,
  backgroundColor: "rgba(220,38,38,0.15)",
  color: "#f87171",
  border: "1px solid rgba(220,38,38,0.3)",
};

export default function AccountSettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const { t } = useT();

  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [email,       setEmail]       = useState(user?.email ?? "");
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-3xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: "0 0 4px 0" }}>{t.account}</h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)", margin: 0 }}>{t.accountDesc}</p>
      </div>

      <Section title={t.accountProfile}>
        <Field label={t.accountEditName}>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label={t.accountEditEmail}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={inputStyle} />
        </Field>
        <button style={btnPrimary} onClick={() => { /* TODO: save */ }}>{t.saveChange}</button>
      </Section>

      <Section title={t.accountPassword}>
        <Field label={t.accountCurrentPswd}>
          <input value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} type="password" style={inputStyle} />
        </Field>
        <Field label={t.accountNewPswd}>
          <input value={newPw} onChange={(e) => setNewPw(e.target.value)} type="password" style={inputStyle} />
        </Field>
        <Field label={t.accountConfirmPswd}>
          <input value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} type="password" style={inputStyle} />
        </Field>
        <button style={btnPrimary} onClick={() => { /* TODO: change password */ }}>{t.accountUpdatePswd}</button>
      </Section>

      <Section title={t.accountDangerzone}>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)", margin: 0 }}>
          {t.accountWarningDelete}
        </p>
        <button style={btnDanger} onClick={() => { /* TODO: confirm + delete */ }}>{t.accountPermadelete}</button>
      </Section>
    </div>
  );
}
