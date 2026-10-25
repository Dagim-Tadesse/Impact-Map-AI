/**
 * Value formatters for probabilities, populations, times, and distances.
 */

export function formatPercent(val: number, decimals: number = 1): string {
  const clamped = Math.max(0, Math.min(1, val));
  return `${(clamped * 100).toFixed(decimals)}%`;
}

export function formatPeople(val: number, withLabel: boolean = true): string {
  const rounded = Math.round(val);
  const formatted = rounded.toLocaleString();
  return withLabel ? `${formatted} estimated people` : formatted;
}

export function formatMinutes(val: number): string {
  return `${val.toFixed(1)} min`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
