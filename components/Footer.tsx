"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/locale-context";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const DISCORD_INVITE_URL = "https://discord.gg/95dZDAqCnp";

export default function Footer() {
  const { t } = useT();
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase.channel("online-users", {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <footer
      style={{
        borderTop: "1px solid var(--novae-outline-all)",
        padding: "16px 24px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-dm-sans)",
          fontSize: "var(--novae-text-xs)",
          color: "var(--novae-text-secondary)",
        }}
      >
        {t.landingFooterCopyright}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontFamily: "var(--font-dm-sans)",
          fontSize: "var(--novae-text-sm)",
          color: "var(--novae-text-secondary)",
        }}
      >
        {onlineCount !== null && (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#3ba55d", display: "inline-block" }}
              aria-hidden
            />
            {t.footerOnlineUsers.replace("{count}", String(onlineCount))}
          </span>
        )}
        <a href="mailto:hello@novae.at" style={{ color: "var(--novae-text-secondary)" }}>
          {t.landingFooterContact}
        </a>
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--novae-text-secondary)" }}
        >
          {t.landingFooterDiscord}
        </a>
      </div>
    </footer>
  );
}
