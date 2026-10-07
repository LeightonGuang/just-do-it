export function formatDateForApi(value: string) {
  const [datePart, timePart] = value.split("T");

  if (!datePart) return "";

  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) return "";

  if (!timePart) return `${Number(day)}-${Number(month)}-${Number(year)}`;

  return `${Number(day)}-${Number(month)}-${Number(year)} ${timePart}`;
}
