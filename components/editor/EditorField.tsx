"use client";

import { useEffect, useRef, useId } from "react";
import type EditorJS from "@editorjs/editorjs";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const TOOLBAR_ITEMS = [
  { label: "B",  title: "Gras",         inline: "bold" },
  { label: "I",  title: "Italique",     inline: "italic" },
  { label: "S",  title: "Barré",        inline: "strikeThrough" },
  null,
  { label: "H2", title: "Titre",        block: "header",  data: { text: "", level: 2 } },
  { label: "•",  title: "Liste",        block: "list",    data: { style: "unordered", items: [""] } },
  { label: "1.", title: "Liste numérotée", block: "list", data: { style: "ordered",   items: [""] } },
  { label: "❝",  title: "Citation",     block: "quote",   data: { text: "", caption: "" } },
] as const;

export default function EditorField({ value, onChange, placeholder, minHeight = 100 }: Props) {
  const id = useId().replace(/:/g, "");
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
      const EditorJS = (await import("@editorjs/editorjs")).default;
      const Header   = (await import("@editorjs/header")).default;
      const List     = (await import("@editorjs/list")).default;
      const Quote    = (await import("@editorjs/quote")).default;

      if (destroyed || !holderRef.current) return;

      editorRef.current = new EditorJS({
        holder: holderRef.current,
        placeholder: placeholder ?? "Écris quelque chose…",
        data: parsed as any,
        inlineToolbar: false,
        tools: {
          header: { class: Header as any, config: { levels: [2, 3, 4], defaultLevel: 2 } },
          list:   { class: List   as any, config: { defaultStyle: "unordered", availableStyles: { unordered: { label: "Unordered", normalizeData: false }, ordered: { label: "Ordered", normalizeData: false } } } },
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

  function handleToolbar(item: (typeof TOOLBAR_ITEMS)[number]) {
    if (!item) return;
    if ("inline" in item) {
      holderRef.current?.focus();
      document.execCommand(item.inline, false);
      return;
    }
    if ("block" in item && editorRef.current) {
      editorRef.current.blocks.insert(item.block, item.data as any);
    }
  }

  return (
    <div style={{
      border: "1px solid var(--novae-outline-all)",
      borderRadius: "var(--novae-radius-md)",
      overflow: "hidden",
      background: "rgba(25,32,46,0.6)",
    }}>
      {/* Fixed toolbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "4px 8px",
        borderBottom: "1px solid var(--novae-outline-all)",
        backgroundColor: "rgba(15,20,32,0.6)",
        flexWrap: "wrap",
      }}>
        {TOOLBAR_ITEMS.map((item, i) =>
          item === null ? (
            <div key={i} style={{ width: 1, height: 16, background: "var(--novae-outline-all)", margin: "0 4px" }} />
          ) : (
            <button
              key={i}
              type="button"
              title={item.title}
              onMouseDown={(e) => { e.preventDefault(); handleToolbar(item); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--novae-text-secondary)",
                fontFamily: "var(--font-dm-sans)",
                fontSize: 12,
                fontWeight: "inline" in item && item.inline === "bold" ? 700 : 400,
                fontStyle: "inline" in item && item.inline === "italic" ? "italic" : "normal",
                minWidth: 28,
                height: 26,
                borderRadius: 4,
                padding: "0 4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.label}
            </button>
          )
        )}
      </div>

      {/* Override Editor.js default max-width so content fills the container */}
      <style>{`
        .ce-block__content, .ce-toolbar__content { max-width: 100% !important; }
        .cdx-block { padding: 0 !important; }
        .ce-toolbar { display: none !important; }
        .codex-editor__redactor { padding-bottom: 0 !important; }
      `}</style>

      {/* Editor.js canvas */}
      <div
        ref={holderRef}
        style={{
          minHeight,
          padding: "4px 12px",
          color: "var(--novae-text-primary)",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "var(--novae-text-base)",
        }}
      />
    </div>
  );
}
