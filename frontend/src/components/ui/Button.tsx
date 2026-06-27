import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {},
  secondary: { background: "var(--rooman-blue)", color: "#fff" },
  ghost: { background: "transparent", color: "var(--rooman-ink)", boxShadow: "none" },
};

export function Button({
  variant = "primary",
  block,
  style,
  children,
  ...rest
}: Props) {
  return (
    <button
      className="nb-btn"
      style={{
        ...styles[variant],
        ...(block ? { width: "100%" } : {}),
        opacity: rest.disabled ? 0.5 : 1,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
