interface Props {
  tabs: Array<{ key: string; label: string }>;
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className="row gap-2 wrap mb-4">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className="nb-badge"
            style={{
              cursor: "pointer",
              background: isActive ? "var(--rooman-primary)" : "var(--surface-raised)",
              color: isActive ? "#fff" : "var(--rooman-ink)",
              padding: "6px 14px",
              fontFamily: "var(--font-display)",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
