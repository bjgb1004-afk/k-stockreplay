export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function ddayLabel(days: number): string {
  if (days === 0) return 'D-DAY';
  if (days < 0) return `D+${-days}`;
  return `D-${days}`;
}
