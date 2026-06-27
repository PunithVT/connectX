interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export function Switch({ checked, onChange, label }: Props) {
  return (
    <label className="row gap-3" style={{ cursor: "pointer" }}>
      <span
        className="neu-toggle"
        onClick={() => onChange(!checked)}
        style={{
          width: 46,
          height: 26,
          position: "relative",
          display: "inline-block",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: checked ? "var(--rooman-green)" : "#bdb8ad",
            border: "2px solid var(--rooman-ink)",
            transition: "left .15s ease",
          }}
        />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}
