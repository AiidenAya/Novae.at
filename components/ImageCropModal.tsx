"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

async function cropToBlob(imageSrc: string, croppedArea: Area, mimeType = "image/jpeg"): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = croppedArea.width;
  canvas.height = croppedArea.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, croppedArea.x, croppedArea.y, croppedArea.width, croppedArea.height, 0, 0, croppedArea.width, croppedArea.height);

  return new Promise((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("toBlob failed")), mimeType, 0.92));
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

interface Props {
  src: string;
  filename: string;
  originalFile: File;
  aspect?: number;
  onConfirm: (file: File, preview: string) => void;
  onCancel: () => void;
}

export default function ImageCropModal({ src, filename, originalFile, aspect = 1, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedArea(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const blob = await cropToBlob(src, croppedArea);
      const file = blobToFile(blob, filename.replace(/\.[^.]+$/, ".jpg"));
      onConfirm(file, URL.createObjectURL(blob));
    } finally {
      setProcessing(false);
    }
  }

  function handleUseOriginal() {
    onConfirm(originalFile, URL.createObjectURL(originalFile));
  }

  const overlay: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 2000,
    background: "transparent", backdropFilter: "blur(8px)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24,
  };

  const btn = (variant: "primary" | "secondary" | "ghost"): React.CSSProperties => ({
    flex: 1, padding: "10px 0",
    background: variant === "primary" ? "var(--novae-btn-primary)" : "none",
    border: variant === "ghost" ? "none" : "1px solid var(--novae-outline-all)",
    borderRadius: "var(--novae-radius-md)",
    color: variant === "primary" ? "#fff" : "var(--novae-text-secondary)",
    fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)",
    fontWeight: variant === "primary" ? 600 : 400,
    cursor: "pointer",
  });

  return (
    <div style={overlay}>
      <div
        style={{ width: "min(560px, 100%)", display: "flex", flexDirection: "column", gap: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 600, color: "var(--novae-text-primary)", textAlign: "center" }}>
          Crop image
        </p>

        {/* Crop area */}
        <div style={{ position: "relative", width: "100%", aspectRatio: String(aspect), borderRadius: "var(--novae-radius-lg)", overflow: "hidden", background: "var(--novae-bg-card)" }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--novae-text-secondary)", fontSize: 13 }}>−</span>
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--novae-btn-primary)" }}
          />
          <span style={{ color: "var(--novae-text-secondary)", fontSize: 13 }}>+</span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={btn("secondary")}>Cancel</button>
          <button onClick={handleUseOriginal} style={btn("secondary")}>Use original</button>
          <button onClick={handleConfirm} disabled={processing} style={{ ...btn("primary"), opacity: processing ? 0.7 : 1, cursor: processing ? "not-allowed" : "pointer" }}>
            {processing ? "Processing…" : "Apply crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
