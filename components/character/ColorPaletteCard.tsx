import SectionCard from "./SectionCard";
import type { ColorPalette, ColorSwatch } from "@/lib/generated/prisma";

type PaletteWithSwatches = ColorPalette & { swatches: ColorSwatch[] };

interface ColorPaletteCardProps {
  /** character.colorPalettes */
  palettes: PaletteWithSwatches[];
}

export default function ColorPaletteCard({ palettes }: ColorPaletteCardProps) {
  const swatches = palettes.flatMap((p) => p.swatches).sort((a, b) => a.order - b.order);

  return (
    <SectionCard title="Color Palette">
      <div className="flex flex-wrap gap-2 p-2 w-full">
        {swatches.length === 0 ? (
          <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
            No palette yet.
          </p>
        ) : (
          swatches.map((swatch) => (
            <div
              key={swatch.id}
              className="relative flex items-end justify-end p-2 rounded-[var(--novae-radius-md)] shrink-0"
              style={{ backgroundColor: swatch.hex, width: 112, height: 112 }}
            >
              {swatch.label && (
                <span
                  className="px-2 py-1 rounded-[var(--novae-radius-sm)] border-[0.5px] text-xs whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-space-grotesk)",
                    fontSize: "var(--novae-text-xs)",
                    color: "var(--novae-text-primary)",
                    backgroundColor: "var(--novae-bg-tag)",
                    borderColor: "var(--novae-bg-tag)",
                  }}
                >
                  {swatch.label}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}
