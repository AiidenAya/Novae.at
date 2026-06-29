import type { ColorPalette, ColorSwatch } from "@/lib/generated/prisma";

type PaletteWithSwatches = ColorPalette & {
  swatches: ColorSwatch[];
};

interface CharacterColorPaletteProps {
  palettes: PaletteWithSwatches[];
}

export default function CharacterColorPalette({ palettes }: CharacterColorPaletteProps) {
  if (palettes.length === 0) {
    return <p className="text-muted-foreground italic">No palette defined.</p>;
  }

  return (
    <div className="space-y-6">
      {palettes.map((palette) => (
        <section key={palette.id}>
          <h2 className="text-lg font-semibold mb-3">{palette.name}</h2>
          <div className="flex flex-wrap gap-3">
            {palette.swatches
              .sort((a, b) => a.order - b.order)
              .map((swatch) => (
                <div key={swatch.id} className="flex flex-col items-center gap-1">
                  <div
                    className="w-12 h-12 rounded-md border shadow-sm"
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.hex}
                  />
                  {swatch.label && (
                    <span className="text-xs text-muted-foreground">{swatch.label}</span>
                  )}
                  <span className="text-xs font-mono text-muted-foreground">{swatch.hex}</span>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
