import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, style, ...rest }: Props) {
  return (
    <label className="stack gap-1 full">
      {label && <span className="small muted">{label}</span>}
      <input className="neu-input full" style={style} {...rest} />
    </label>
  );
}
