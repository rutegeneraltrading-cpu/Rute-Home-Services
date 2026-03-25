// Utility to parse time label like '09:00' or '09:00 to 10:00' to minutes since midnight
export function parseTimeLabelToMinutes(label: string): number | null {
  if (!label) return null;
  const match = label.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, hours, minutes] = match;
  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
}
