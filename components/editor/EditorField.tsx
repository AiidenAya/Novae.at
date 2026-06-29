"use client";

import { useEffect, useRef, useId, useState } from "react";
import type EditorJS from "@editorjs/editorjs";
import { useUploadThing } from "@/lib/uploadthing-client";

const EMOJI_LIST = [
  "😀","😂","🥹","😍","🥰","😎","🤩","🥳","😭","😤","😡","🤔","🫠","🫡","😴",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","✨","⭐","🔥","💫","🌙","🌸",
  "🌺","🌻","🍀","🌈","🦋","🐾","🐱","🐶","🐰","🦊","🐼","🐨","🦄","🐉","🌊",
  "👑","💎","🎨","🎭","🎵","🎶","📚","✏️","🖊️","💌","🎁","🎉","🎊","🍓","🍰",
];

const TOOLBAR_ITEMS = [
  { label: "B",   title: "Bold",            inline: "bold" },
  { label: "I",   title: "Italic",          inline: "italic" },
  { label: "S",   title: "Strikethrough",   inline: "strikeThrough" },
  null,
  { label: "•",   title: "List",            block: "list",      data: { style: "unordered", items: [""] } },
  { label: "1.",  title: "Numbered list",   block: "list",      data: { style: "ordered",   items: [""] } },
  { label: "—",   title: "Divider",         block: "delimiter", data: {} },
  { label: "🖼️",  title: "Image",           block: "image",     data: {} },
  { label: "😊",  title: "Emoji",           special: "emoji" },
] as const;

export default function EditorField({ value, onChange, placeholder, minHeight = 100 }: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const id = useId().replace(/:/g, "");
  const holderRef   = useRef<HTMLDivElement>(null);
  const editorRef   = useRef<EditorJS | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [emojiOpen, setEmojiOpen] = useState(false);

  const { startUpload } = useUploadThing("editorImage");
  const uploadRef = useRef(startUpload);
  uploadRef.current = startUpload;

  useEffect(() => {
    if (!holderRef.current || editorRef.current) return;

    let parsed: object | undefined;
    if (value) {
      try { parsed = JSON.parse(value); } catch {}
    }

    let destroyed = false;
    (async () => {
      const EditorJS  = (await import("@editorjs/editorjs")).default;
      const List      = (await import("@editorjs/list")).default;
      const Delimiter = (await import("@editorjs/delimiter")).default;
      const Image     = (await import("@editorjs/image")).default;

      if (destroyed || !holderRef.current) return;

      editorRef.current = new EditorJS({
        holder: holderRef.current,
        placeholder: placeholder ?? "Write something…",
        data: parsed as any,
        inlineToolbar: false,
        tools: {
          list:      { class: List      as any, config: { defaultStyle: "unordered", availableStyles: { unordered: { label: "Unordered", normalizeData: false }, ordered: { label: "Ordered", normalizeData: false } } } },
          delimiter: { class: Delimiter as any },
          image: {
            class: Image as any,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const res = await uploadRef.current([file]);
                  const url = (res?.[0] as any)?.serverData?.url ?? (res?.[0] as any)?.url;
                  if (!url) return { success: 0 };
                  return { success: 1, file: { url } };
                },
              },
            },
          },
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
    if ("special" in item && item.special === "emoji") {
      setEmojiOpen((v) => !v);
      return;
    }
    if ("inline" in item) {
      holderRef.current?.focus();
      document.execCommand(item.inline, false);
      return;
    }
    if ("block" in item && item.block === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file || !editorRef.current) return;
        editorRef.current.blocks.insert("image", { file: { url: URL.createObjectURL(file) }, stretched: false, withBorder: false, withBackground: false });
        const res = await uploadRef.current([file]);
        const url = (res?.[0] as any)?.serverData?.url ?? (res?.[0] as any)?.url;
        if (url) {
          const data = await editorRef.current.save();
          const updated = { ...data, blocks: data.blocks.map((b: any) => b.type === "image" && b.data.file?.url?.startsWith("blob:") ? { ...b, data: { ...b.data, file: { url } } } : b) };
          onChangeRef.current(JSON.stringify(updated));
        }
      };
      input.click();
      return;
    }
    if ("block" in item && editorRef.current) {
      editorRef.current.blocks.insert(item.block, item.data as any);
    }
  }

  function insertEmoji(emoji: string) {
    holderRef.current?.focus();
    document.execCommand("insertText", false, emoji);
    setEmojiOpen(false);
  }

  return (
    <div style={{ border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "visible", background: "rgba(25,32,46,0.6)", position: "relative" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "4px 8px", borderBottom: "1px solid var(--novae-outline-all)", backgroundColor: "rgba(15,20,32,0.6)", flexWrap: "wrap", borderRadius: "var(--novae-radius-md) var(--novae-radius-md) 0 0" }}>
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
                background: "none", border: "none", cursor: "pointer",
                color: "var(--novae-text-secondary)",
                fontFamily: "var(--font-dm-sans)", fontSize: 12,
                fontWeight: "inline" in item && item.inline === "bold" ? 700 : 400,
                fontStyle: "inline" in item && item.inline === "italic" ? "italic" : "normal",
                minWidth: 28, height: 26, borderRadius: 4, padding: "0 4px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {item.label}
            </button>
          )
        )}
      </div>

      {/* Emoji picker popover */}
      {emojiOpen && (
        <div style={{ position: "absolute", top: 36, left: 0, zIndex: 200, background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: 10, display: "flex", flexWrap: "wrap", gap: 4, width: 260, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertEmoji(emoji); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Editor.js styles */}
      <style>{`
        .ce-block__content, .ce-toolbar__content { max-width: 100% !important; }
        .cdx-block { padding: 0 !important; }
        .ce-toolbar { display: none !important; }
        .codex-editor__redactor { padding-bottom: 0 !important; }
        .image-tool__image-picture { max-width: 100%; border-radius: var(--novae-radius-md); }
        .image-tool { padding: 4px 0; }
      `}</style>

      {/* Editor.js canvas */}
      <div
        ref={holderRef}
        style={{ minHeight, padding: "4px 12px", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)" }}
      />
    </div>
  );
}
