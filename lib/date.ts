const DATE_REGEX =
  /^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/;

export function parseDate(input: string): Date | null {
  const match = input.trim().match(DATE_REGEX);

  if (!match) return null;

  let [, day, month, year, hour, minute] = match;

  const d = Number(day);
  const m = Number(month);

  let y = Number(year);

  // Convert 2-digit years
  if (year.length === 2) {
    y += 2000;
  }

  const h = hour ? Number(hour) : 0;
  const min = minute ? Number(minute) : 0;

  if (m < 1 || m > 12) return null;
  if (h < 0 || h > 23) return null;
  if (min < 0 || min > 59) return null;

  const date = new Date(y, m - 1, d, h, min);

  // Reject impossible dates (31 Feb, etc.)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }

  return date;
}
