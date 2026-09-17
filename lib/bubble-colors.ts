export const TYPE_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

export const HUB_COLOR = "#e0f2fe";
export const DIMMED_COLOR = "rgba(140, 140, 140, 0.2)";

export function colorForType(type: string): string {
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = (hash << 5) - hash + type.charCodeAt(i);
    hash |= 0;
  }
  return TYPE_COLORS[Math.abs(hash) % TYPE_COLORS.length];
}
