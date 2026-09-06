/** Indian rupee + measurement formatting helpers. */

export function formatINR(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

export function formatAge(months: number | null | undefined): string {
  if (!months) return "—";
  if (months < 12) return `${months} ${months === 1 ? "Month" : "Months"}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years}y ${rest}m` : `${years} ${years === 1 ? "Year" : "Years"}`;
}

export function formatWeight(kg: number | null | undefined): string {
  if (!kg) return "—";
  return `${Number(kg) % 1 === 0 ? Number(kg) : Number(kg).toFixed(1)} kg`;
}

export function shortPlace(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).slice(0, 2).join(", ") || "India";
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function normalisePhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(-10);
  return `+91${digits}`;
}

export function isValidIndianMobile(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(digits.slice(-10)) && digits.length >= 10;
}
