import { initials } from "@/lib/format";

interface Props {
  name?: string;
  size?: number;
  url?: string | null;
}

export function Avatar({ name, size = 40, url }: Props) {
  if (url) {
    return (
      <img
        src={url}
        alt={name ?? "avatar"}
        width={size}
        height={size}
        style={{
          borderRadius: "50%",
          border: "2px solid var(--rooman-ink)",
          objectFit: "cover",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--rooman-primary)",
        color: "#fff",
        border: "2px solid var(--rooman-ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}
