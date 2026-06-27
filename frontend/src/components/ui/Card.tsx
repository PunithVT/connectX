import type { CSSProperties, ReactNode } from "react";

type Surface = "brutalist" | "neu" | "skeu-id" | "skeu-cert" | "skeu-bench";

const classFor: Record<Surface, string> = {
  brutalist: "nb-card",
  neu: "neu-panel",
  "skeu-id": "skeu-idcard",
  "skeu-cert": "skeu-certificate",
  "skeu-bench": "skeu-workbench",
};

interface Props {
  surface?: Surface;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Card({ surface = "brutalist", children, style, className }: Props) {
  return (
    <div
      className={`${classFor[surface]} ${className ?? ""}`}
      style={{ padding: "var(--space-4)", ...style }}
    >
      {children}
    </div>
  );
}
