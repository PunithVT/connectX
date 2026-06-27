import { useEffect, useRef, useState } from "react";

export function CountUp({
  value,
  duration = 1600,
  className = "",
}: {
  value: string | number;
  duration?: number;
  className?: string;
}) {
  const raw = String(value);
  const match = raw.match(/[\d.,]+/);
  const numericStr = match ? match[0] : "";
  const target = numericStr ? parseFloat(numericStr.replace(/,/g, "")) : 0;
  const hasComma = numericStr.includes(",");
  const decimals = numericStr.includes(".")
    ? (numericStr.split(".")[1]?.length ?? 0)
    : 0;
  const prefix = match ? raw.slice(0, match.index) : raw;
  const suffix = match ? raw.slice((match.index ?? 0) + numericStr.length) : "";

  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState<string>(() =>
    target ? formatNumber(0, decimals, hasComma) : raw,
  );
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !target) return;
    if (typeof IntersectionObserver === "undefined") {
      setDisplay(formatNumber(target, decimals, hasComma));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            io.disconnect();
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              setDisplay(formatNumber(target * eased, decimals, hasComma));
              if (t < 1) requestAnimationFrame(tick);
              else setDisplay(formatNumber(target, decimals, hasComma));
            };
            requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration, decimals, hasComma]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {target ? display : ""}
      {suffix}
    </span>
  );
}

function formatNumber(n: number, decimals: number, withCommas: boolean) {
  const fixed = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
  if (!withCommas) return fixed;
  const [intPart, decPart] = fixed.split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${withSep}.${decPart}` : withSep;
}
