"use client";

import { useState } from "react";
import SectionCard from "./SectionCard";

export interface InfoRow {
  label: string;
  value: string | null;
}

interface InfoCardProps {
  rows: InfoRow[];
  initialVisible?: number;
}

function Row({ label, value }: InfoRow) {
  return (
    <div className="flex items-start justify-between w-full">
      <span
        className="font-bold w-1/2"
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "var(--novae-text-base)",
          color: "var(--novae-text-secondary)",
        }}
      >
        {label}
      </span>
      <span
        className="font-medium w-1/2"
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "var(--novae-text-base)",
          color: "var(--novae-text-primary)",
        }}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function InfoCard({ rows, initialVisible = 4 }: InfoCardProps) {
  const [expanded, setExpanded] = useState(false);

  const visible = rows.slice(0, initialVisible);
  const hidden  = rows.slice(initialVisible);
  const hasMore = hidden.length > 0;

  return (
    <SectionCard title="Informations">
      <div className="flex flex-col gap-2 w-full">
        {visible.map((row) => <Row key={row.label} {...row} />)}

        {expanded && hidden.map((row) => <Row key={row.label} {...row} />)}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex gap-2 items-center justify-center w-full pt-2 transition-opacity hover:opacity-70"
        >
          <span
            className="font-medium"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "var(--novae-text-base)",
              color: "var(--novae-text-secondary)",
            }}
          >
            {expanded ? "Show less" : "View more"}
          </span>
          <svg
            width="12"
            height="7"
            viewBox="0 0 12 7"
            fill="none"
            className="transition-transform"
            style={{
              color: "var(--novae-text-secondary)",
              transform: expanded ? "rotate(180deg)" : "none",
            }}
          >
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </SectionCard>
  );
}
