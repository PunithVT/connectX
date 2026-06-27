type Item =
  | { kind: "avatar"; initials: string; hue: number }
  | { kind: "chip";   label: string;    variant?: "accent" | "company" | "default" }
  | { kind: "dot";    hue: number };

const RINGS: {
  radius: number;
  duration: number;
  reverse?: boolean;
  lineColor: string;
  glowColor: string;
  items: Item[];
}[] = [
  {
    radius: 90,
    duration: 24,
    lineColor: "oklch(0.62 0.19 38 / 0.55)",
    glowColor: "oklch(0.62 0.19 38 / 0.18)",
    items: [
      { kind: "avatar", initials: "AR", hue: 28  },
      { kind: "dot",    hue: 38  },
      { kind: "chip",   label: "Hiring",  variant: "accent"  },
      { kind: "avatar", initials: "VI", hue: 155 },
      { kind: "dot",    hue: 155 },
      { kind: "chip",   label: "Mentor",  variant: "default" },
      { kind: "avatar", initials: "KM", hue: 230 },
      { kind: "dot",    hue: 230 },
    ],
  },
  {
    radius: 162,
    duration: 44,
    reverse: true,
    lineColor: "oklch(0.55 0.14 155 / 0.45)",
    glowColor: "oklch(0.55 0.14 155 / 0.12)",
    items: [
      { kind: "avatar", initials: "PM", hue: 230 },
      { kind: "chip",   label: "Razorpay", variant: "company" },
      { kind: "dot",    hue: 12  },
      { kind: "avatar", initials: "RD", hue: 12  },
      { kind: "chip",   label: "Startup",  variant: "accent"  },
      { kind: "dot",    hue: 280 },
      { kind: "avatar", initials: "NK", hue: 280 },
      { kind: "chip",   label: "Swiggy",   variant: "company" },
      { kind: "dot",    hue: 155 },
      { kind: "avatar", initials: "SJ", hue: 60  },
    ],
  },
  {
    radius: 236,
    duration: 66,
    lineColor: "oklch(0.70 0.14 245 / 0.40)",
    glowColor: "oklch(0.70 0.14 245 / 0.10)",
    items: [
      { kind: "avatar", initials: "SK", hue: 320 },
      { kind: "chip",   label: "Co-founder",  variant: "accent"  },
      { kind: "dot",    hue: 60  },
      { kind: "avatar", initials: "KN", hue: 60  },
      { kind: "chip",   label: "Google",      variant: "company" },
      { kind: "dot",    hue: 320 },
      { kind: "avatar", initials: "MJ", hue: 190 },
      { kind: "chip",   label: "Batch '21",   variant: "default" },
      { kind: "dot",    hue: 190 },
      { kind: "avatar", initials: "TS", hue: 40  },
      { kind: "chip",   label: "₹2Cr raised", variant: "accent"  },
      { kind: "dot",    hue: 40  },
    ],
  },
  {
    radius: 308,
    duration: 96,
    reverse: true,
    lineColor: "oklch(0.62 0.12 280 / 0.32)",
    glowColor: "oklch(0.62 0.12 280 / 0.08)",
    items: [
      { kind: "chip",   label: "Microsoft",  variant: "company" },
      { kind: "avatar", initials: "LP", hue: 200 },
      { kind: "dot",    hue: 200 },
      { kind: "chip",   label: "Seed Stage", variant: "accent"  },
      { kind: "avatar", initials: "GV", hue: 100 },
      { kind: "dot",    hue: 100 },
      { kind: "chip",   label: "Flipkart",   variant: "company" },
      { kind: "avatar", initials: "AD", hue: 350 },
      { kind: "dot",    hue: 350 },
      { kind: "chip",   label: "Batch '18",  variant: "default" },
      { kind: "avatar", initials: "RB", hue: 260 },
      { kind: "dot",    hue: 260 },
      { kind: "chip",   label: "100 hires",  variant: "accent"  },
      { kind: "avatar", initials: "DK", hue: 170 },
    ],
  },
];

function Node({ item }: { item: Item }) {
  if (item.kind === "avatar") {
    const bg  = `oklch(0.83 0.13 ${item.hue})`;
    const fg  = `oklch(0.24 0.13 ${item.hue})`;
    const glo = `oklch(0.72 0.16 ${item.hue} / 0.45)`;
    return (
      <div
        style={{ backgroundColor: bg, color: fg, boxShadow: `0 4px 18px -4px ${glo}` }}
        className="grid h-11 w-11 place-items-center rounded-full border-2 border-white/60 text-[11px] font-bold"
      >
        {item.initials}
      </div>
    );
  }
  if (item.kind === "chip") {
    if (item.variant === "company") {
      return (
        <span className="whitespace-nowrap rounded-full bg-foreground px-3 py-[5px] text-[11px] font-semibold text-background shadow-lg">
          {item.label}
        </span>
      );
    }
    if (item.variant === "accent") {
      return (
        <span
          className="whitespace-nowrap rounded-full px-3 py-[5px] text-[11px] font-semibold"
          style={{
            background: "oklch(0.62 0.19 38)",
            color:      "oklch(0.98 0.01 85)",
            boxShadow:  "0 4px 20px -4px oklch(0.62 0.19 38 / 0.55)",
          }}
        >
          {item.label}
        </span>
      );
    }
    return (
      <span
        className="whitespace-nowrap rounded-full border border-border/80 bg-card/95 px-3 py-[5px] text-[11px] shadow-sm backdrop-blur-sm"
        style={{ color: "oklch(0.35 0.02 60)" }}
      >
        {item.label}
      </span>
    );
  }
  return (
    <span
      className="block h-3 w-3 rounded-full"
      style={{
        background: `oklch(0.72 0.16 ${item.hue})`,
        boxShadow:  `0 0 14px oklch(0.72 0.16 ${item.hue} / 0.85)`,
      }}
    />
  );
}

export function OrbitBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Ambient background glow */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(60% 65% at 55% 50%, oklch(0.62 0.19 38 / 0.11), transparent 70%)",
            "radial-gradient(38% 45% at 88% 18%, oklch(0.78 0.13 230 / 0.10), transparent 70%)",
            "radial-gradient(30% 38% at 20% 85%, oklch(0.55 0.14 155 / 0.08), transparent 70%)",
            "radial-gradient(25% 30% at 80% 82%, oklch(0.62 0.12 280 / 0.07), transparent 70%)",
          ].join(", "),
        }}
      />

      {/*
        Single 700×700 wrapper centered at 55% left so items
        stay in the right half. All rings use left-1/2 top-1/2
        so orbit-spin-centered (which includes translate(-50%,-50%))
        correctly keeps them centered while rotating.
      */}
      <div
        className="absolute"
        style={{
          width: 700,
          height: 700,
          left: "55%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* ── Static guide rings (no animation) ── */}
        {RINGS.map((r, i) => (
          <div
            key={`guide-${i}`}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width:     r.radius * 2,
              height:    r.radius * 2,
              transform: "translate(-50%, -50%)",
              border:    `1.5px solid ${r.lineColor}`,
              boxShadow: `0 0 28px ${r.glowColor}, inset 0 0 18px ${r.glowColor}`,
            }}
          />
        ))}

        {/* Inner dashed accent ring */}
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 50, height: 50,
            transform: "translate(-50%, -50%)",
            border: "1.5px dashed oklch(0.62 0.19 38 / 0.40)",
          }}
        />

        {/* ── Spinning rings with items ── */}
        {RINGS.map((r, ri) => (
          <div
            key={`spin-${ri}`}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width:     r.radius * 2,
              height:    r.radius * 2,
              animation: `orbit-spin-centered ${r.duration}s linear infinite${r.reverse ? " reverse" : ""}`,
            }}
          >
            {r.items.map((item, idx) => {
              const angle = (idx / r.items.length) * 360;
              return (
                <div
                  key={idx}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(-50%,-50%) rotate(${angle}deg) translateY(-${r.radius}px) rotate(-${angle}deg)`,
                  }}
                >
                  {/* Counter-spin keeps each node upright */}
                  <div
                    style={{
                      animation: `orbit-spin ${r.duration}s linear infinite${r.reverse ? "" : " reverse"}`,
                    }}
                  >
                    <Node item={item} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Center pulse glow */}
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 80, height: 80,
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, oklch(0.62 0.19 38 / 0.55), transparent 70%)",
            animation: "orbit-pulse 3.6s ease-in-out infinite",
          }}
        />
        {/* Center dot */}
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 12, height: 12,
            transform: "translate(-50%, -50%)",
            background: "oklch(0.62 0.19 38)",
            boxShadow:  "0 0 20px oklch(0.62 0.19 38 / 0.9), 0 0 40px oklch(0.62 0.19 38 / 0.4)",
          }}
        />
      </div>

      {/* Edge fade: blends left into the text column + top/bottom */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse at 58% 50%, transparent 28%, var(--background) 78%)",
            "linear-gradient(to right, var(--background) 0%, transparent 15%)",
            "linear-gradient(to bottom, var(--background) 0%, transparent 12%, transparent 88%, var(--background) 100%)",
          ].join(", "),
        }}
      />
    </div>
  );
}
