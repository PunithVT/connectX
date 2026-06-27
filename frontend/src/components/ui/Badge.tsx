import type { CSSProperties, ReactNode } from "react";

interface Props {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}

export function Badge({ children, color, style }: Props) {
  return (
    <span
      className="nb-badge"
      style={{ background: color ?? "var(--rooman-accent)", ...style }}
    >
      {children}
    </span>
  );
}
