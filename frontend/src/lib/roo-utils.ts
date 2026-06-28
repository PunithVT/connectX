import type { PostType } from "@/types/models";

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function nameToHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  }
  return h % 360;
}

export function timeAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export const POST_TYPE_LABELS: Record<PostType, string> = {
  update: "General",
  doing: "Hiring",
  looking: "Looking for Job",
};

export const POST_TYPE_FROM_LABEL: Record<string, PostType> = {
  General: "update",
  Hiring: "doing",
  "Looking for Job": "looking",
};

export const DISPLAY_CATEGORIES = ["General", "Hiring", "Looking for Job"] as const;
export type DisplayCategory = (typeof DISPLAY_CATEGORIES)[number];

export function expertiseTags(domain: string | null | undefined): string[] {
  if (!domain) return [];
  return domain
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
