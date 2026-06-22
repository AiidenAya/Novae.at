"use client";

import React from "react";

type Block = { type: string; data: Record<string, unknown> };

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={i}
          dangerouslySetInnerHTML={{ __html: block.data.text as string }}
          style={{ margin: "0 0 6px", lineHeight: "1.65" }}
        />
      );
    case "header": {
      const level = (block.data.level as number) ?? 2;
      const Tag = `h${level}` as "h2" | "h3" | "h4";
      return (
        <Tag key={i}
          dangerouslySetInnerHTML={{ __html: block.data.text as string }}
          style={{ margin: "12px 0 6px", fontFamily: "var(--font-space-grotesk)", fontWeight: 700, color: "var(--novae-text-primary)" }}
        />
      );
    }
    case "list": {
      const ordered = block.data.style === "ordered";
      const Tag = ordered ? "ol" : "ul";
      const items = (block.data.items as string[]) ?? [];
      return (
        <Tag key={i} style={{ margin: "0 0 6px", paddingLeft: 20 }}>
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: item }} style={{ lineHeight: "1.65" }} />
          ))}
        </Tag>
      );
    }
    case "quote":
      return (
        <blockquote key={i} style={{ borderLeft: "3px solid var(--novae-btn-primary)", paddingLeft: 12, margin: "0 0 6px", color: "var(--novae-text-secondary)", fontStyle: "italic" }}>
          <div dangerouslySetInnerHTML={{ __html: block.data.text as string }} />
          {block.data.caption ? (
            <cite style={{ fontSize: "0.85em", fontStyle: "normal", color: "var(--novae-text-secondary)" }}>
              — {block.data.caption as string}
            </cite>
          ) : null}
        </blockquote>
      );
    default:
      return null;
  }
}

export default function EditorRenderer({ content, style }: {
  content: string | null | undefined;
  style?: React.CSSProperties;
}) {
  if (!content) return null;

  let blocks: Block[] = [];
  try {
    const parsed = JSON.parse(content);
    blocks = parsed.blocks ?? [];
  } catch {
    return (
      <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: "1.65", ...style }}>
        {content}
      </p>
    );
  }

  if (blocks.length === 0) return null;

  return (
    <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", ...style }}>
      {blocks.map(renderBlock)}
    </div>
  );
}
