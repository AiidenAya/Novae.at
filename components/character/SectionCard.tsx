interface SectionCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({ title, action, children, className }: SectionCardProps) {
  return (
    <div
      className={`flex flex-col gap-6 p-8 rounded-[var(--novae-radius-md)] border ${className ?? ""}`}
      style={{
        backgroundColor: "var(--novae-bg-card)",
        borderColor: "var(--novae-outline-all)",
      }}
    >
      <div className="flex items-start justify-between shrink-0 w-full">
        <div className="flex flex-col gap-2 items-start">
          <p
            className="text-xs font-normal uppercase tracking-[0.7px]"
            style={{
              fontFamily: "var(--font-space-grotesk)",
              color: "var(--novae-text-secondary)",
              fontSize: "var(--novae-text-sm)",
            }}
          >
            {title}
          </p>
          <div className="h-px w-14" style={{ backgroundColor: "var(--novae-text-secondary)" }} />
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
