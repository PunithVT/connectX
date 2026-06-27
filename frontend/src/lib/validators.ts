export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function minLen(value: string, n: number): boolean {
  return value.trim().length >= n;
}

export const EXPERTISE_DOMAINS = [
  "Cloud / DevOps",
  "Data Science / AI",
  "Full-Stack Development",
  "Frontend Development",
  "Backend Development",
  "Cybersecurity",
  "Mobile Development",
  "QA / Testing",
  "Networking",
  "Product / Design",
  "Other",
];
