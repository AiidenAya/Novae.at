const NEXT_IMAGE_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

function nearestWidth(w: number): number {
  return NEXT_IMAGE_WIDTHS.find((n) => n >= w) ?? 3840;
}

export function thumbUrl(url: string | null | undefined, width: number, quality = 80): string | undefined {
  if (!url) return undefined;
  // blob/data URLs and local paths can't go through the optimizer
  if (url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("/")) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${nearestWidth(width)}&q=${quality}`;
}
