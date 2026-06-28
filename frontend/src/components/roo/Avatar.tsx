export function Avatar({
  initials,
  hue,
  size = 48,
}: {
  initials: string;
  hue: number;
  size?: number;
}) {
  const bg = `oklch(0.86 0.08 ${hue})`;
  const fg = `oklch(0.28 0.10 ${hue})`;
  return (
    <div
      style={{ width: size, height: size, backgroundColor: bg, color: fg }}
      className="grid shrink-0 place-items-center rounded-full border border-border font-medium"
    >
      <span style={{ fontSize: size * 0.38 }}>{initials}</span>
    </div>
  );
}
