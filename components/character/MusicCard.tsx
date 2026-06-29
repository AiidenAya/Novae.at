import Image from "next/image";
import SectionCard from "./SectionCard";

const iconExternalLink = "http://localhost:3845/assets/dfda39038dcc70fd8c649fbbba7382a13c110ad9.svg";

export interface MusicEntry {
  id: string;
  title: string;
  artist: string;
  url?: string | null;
  thumbnailUrl?: string | null;
}

interface MusicCardProps {
  /** music entries — model to be created in V2 */
  tracks: MusicEntry[];
}

export default function MusicCard({ tracks }: MusicCardProps) {
  return (
    <SectionCard title="Music">
      {tracks.length === 0 ? (
        <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
          No music yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {tracks.map((track) => (
            <div key={track.id} className="flex gap-4 items-center w-full">
              <div
                className="relative shrink-0 rounded-[var(--novae-radius-md)] overflow-hidden"
                style={{ width: 213, height: 120, backgroundColor: "var(--novae-bg-card)" }}
              >
                {track.thumbnailUrl && (
                  <Image src={track.thumbnailUrl} alt={track.title} fill className="object-cover" sizes="213px" />
                )}
              </div>
              <div className="flex flex-col gap-[10px] flex-1 min-w-0">
                <p
                  className="font-extrabold break-words"
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "var(--novae-text-2xl)",
                    color: "var(--novae-text-link)",
                  }}
                >
                  {track.title}
                </p>
                <p
                  className="font-medium"
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "var(--novae-text-lg)",
                    color: "var(--novae-text-primary)",
                  }}
                >
                  {track.artist}
                </p>
              </div>
              {track.url && (
                <a
                  href={track.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-end justify-end"
                >
                  <img src={iconExternalLink} alt="Open" className="size-[18px]" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
