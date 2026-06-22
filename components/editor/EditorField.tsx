"use client";

import { useEffect, useRef } from "react";
import type EditorJS from "@editorjs/editorjs";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function EditorField({ value, onChange, placeholder, minHeight = 120 }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorJS | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!holderRef.current || editorRef.current) return;

    let parsed: object | undefined;
    if (value) {
      try { parsed = JSON.parse(value); } catch {}
    }

    let destroyed = false;
    (async () => {
      const EditorJS    = (await import("@editorjs/editorjs")).default;
      const Header      = (await import("@editorjs/header")).default;
      const List        = (await import("@editorjs/list")).default;
      const Quote       = (await import("@editorjs/quote")).default;

      if (destroyed || !holderRef.current) return;

      editorRef.current = new EditorJS({
        holder: holderRef.current,
        placeholder: placeholder ?? "Écris quelque chose…",
        data: parsed as any,
        tools: {
          header: { class: Header as any, config: { levels: [2, 3, 4], defaultLevel: 2 } },
          list:   { class: List   as any, inlineToolbar: true },
          quote:  { class: Quote  as any },
        },
        onChange: async () => {
          if (!editorRef.current) return;
          const data = await editorRef.current.save();
          onChangeRef.current(JSON.stringify(data));
        },
      });
    })();

    return () => {
      destroyed = true;
      editorRef.current?.destroy?.();
      editorRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={holderRef}
      style={{
        minHeight,
        background: "rgba(25,32,46,0.6)",
        border: "1px solid var(--novae-outline-all)",
        borderRadius: "var(--novae-radius-md)",
        padding: "4px 12px",
        color: "var(--novae-text-primary)",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "var(--novae-text-base)",
      }}
    />
  );
}
