export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function formatNairaRange(min: number, max: number): string {
  if (min === 0 && max === 0) return 'Free Assessment';
  if (min === 0) return `Up to ${formatNaira(max)}`;
  return `${formatNaira(min)} – ${formatNaira(max)}`;
}

export function formatTurnaround(hours: number): string {
  if (hours < 24) return `Resolved in ${hours} Hours`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Resolved in 1 Day';
  return `Resolved in ${days} Days`;
}
