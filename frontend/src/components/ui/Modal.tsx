import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="nb-card"
        style={{ width: "min(520px, 100%)", padding: "var(--space-6)", background: "var(--surface-raised)" }}
      >
        {title && (
          <div className="row between mb-4">
            <h3 style={{ margin: 0 }}>{title}</h3>
            <button className="nb-badge" onClick={onClose} style={{ cursor: "pointer" }}>
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
