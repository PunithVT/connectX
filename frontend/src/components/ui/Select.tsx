import type { SelectHTMLAttributes } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, options, style, ...rest }: Props) {
  return (
    <label className="stack gap-1 full">
      {label && <span className="small muted">{label}</span>}
      <select className="neu-input full" style={{ fontFamily: "inherit", ...style }} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
