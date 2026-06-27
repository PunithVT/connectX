import type { TextareaHTMLAttributes } from "react";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, style, ...rest }: Props) {
  return (
    <label className="stack gap-1 full">
      {label && <span className="small muted">{label}</span>}
      <textarea
        className="neu-input full"
        style={{ resize: "vertical", minHeight: 80, fontFamily: "inherit", ...style }}
        {...rest}
      />
    </label>
  );
}
