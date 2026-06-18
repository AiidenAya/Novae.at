import SectionCard from "./SectionCard";

interface VoiceClaimCardProps {
  /** YouTube or Vimeo URL — à venir (champ à ajouter au modèle) */
  videoUrl?: string | null;
}

export default function VoiceClaimCard({ videoUrl }: VoiceClaimCardProps) {
  return (
    <SectionCard title="Voice Claim">
      <div
        className="w-full rounded-[var(--novae-radius-md)] overflow-hidden flex items-center justify-center"
        style={{ height: 220, backgroundColor: "var(--novae-bg-card)" }}
      >
        {videoUrl ? (
          <iframe
            src={videoUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <p
            className="text-sm italic"
            style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}
          >
            No voice claim yet.
          </p>
        )}
      </div>
    </SectionCard>
  );
}
