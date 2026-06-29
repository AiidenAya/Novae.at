"use client";

import { useState } from "react";

interface SensitiveImageWrapperProps {
  sensitiveType: string | null;
  children: React.ReactNode;
  className?: string;
}

export default function SensitiveImageWrapper({ sensitiveType, children, className }: SensitiveImageWrapperProps) {
  if (!sensitiveType) return <>{children}</>;

  return (
    <div className={className} style={{ filter: "blur(16px)", width: "100%", height: "100%" }}>
      {children}
    </div>
  );
}

interface SensitiveBadgeProps {
  sensitiveType: string | null;
  side?: "left" | "right";
}

export function SensitiveBadge({ sensitiveType, side = "right" }: SensitiveBadgeProps) {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  if (!sensitiveType) return null;

  const label = sensitiveType === "gore" ? "Gore content" : "Nudity / fan service";

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left, y: rect.bottom + 6 });
  };

  return (
    <>
      <div
        style={{ position: "absolute", top: 6, [side]: 6, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setTooltipPos(null)}
      >
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 26, height: 26, borderRadius: "50%",
            background: "var(--novae-bg-card)",
            border: "1.5px solid var(--novae-accent-main, #c0205a)",
            color: "var(--novae-accent-main, #c0205a)",
            cursor: "default",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      </div>
      {tooltipPos && (
        <div style={{
          position: "fixed",
          top: tooltipPos.y,
          left: tooltipPos.x,
          background: "var(--novae-bg-card)",
          border: "1px solid var(--novae-outline-all)",
          borderRadius: "var(--novae-radius-sm)",
          padding: "4px 8px",
          whiteSpace: "nowrap",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "11px",
          color: "var(--novae-text-primary)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          pointerEvents: "none",
          zIndex: 9999,
        }}>
          {label}
        </div>
      )}
    </>
  );
}
