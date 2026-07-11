export type ArtworkCreditData = {
  id?: string;
  userId: string | null;
  username: string | null;
  label: string | null;
  url: string | null;
};

export function ArtworkCreditsDisplay({ credits, linkStyle }: { credits: ArtworkCreditData[]; linkStyle?: React.CSSProperties }) {
  if (!credits.length) return null;

  const baseLinkStyle: React.CSSProperties = { color: "var(--novae-text-link)", textDecoration: "none", ...linkStyle };

  return (
    <>
      {credits.map((c, i) => (
        <span key={c.id ?? i}>
          {c.userId && c.username ? (
            <a href={`/${c.username}`} style={baseLinkStyle}>@{c.username}</a>
          ) : (
            <a href={c.url ?? "#"} target="_blank" rel="noopener noreferrer" style={baseLinkStyle}>{c.label}</a>
          )}
          {i < credits.length - 2 ? ", " : i === credits.length - 2 ? " & " : ""}
        </span>
      ))}
    </>
  );
}
