/**
 * Parse a datetime-local input string to a timestamp (milliseconds since epoch)
 */
export function parseDate(value: string): number | null {
  if (!value || value.trim() === "") return null;
  
  // Try parsing as ISO date string first
  const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?/);
  if (isoMatch) {
    try {
      const date = new Date(isoMatch[0]);
      return Number.isNaN(date.getTime()) ? null : Number(date.getTime());
    } catch {
      // Ignore parse errors
    }
  }
  
  // Try parsing as display format: DD-MM-YYYY or DD-MM-YYYY HH:mm:ss
  const parts = value.split(/[\s,]+/).map((p) => p.trim());
  
  for (const part of parts) {
    const match = part.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}:\d{2}))?$/);
    if (match) {
      const [, day, month, year, time] = match;
      try {
        let date = new Date(`${year}-${month}-${day}`);
        if (time) {
          const [hours, minutes] = time.split(":");
          date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
        }
        return Number(date.getTime());
      } catch {
        // Ignore parse errors
      }
    }
  }
  
  return null;
}

/**
 * Parse a timestamp (milliseconds since epoch) to an ISO datetime-local input string
 */
export function formatTimestampForInput(timestamp: number | null): string {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Parse a timestamp (milliseconds since epoch) to a display format: DD-MM-YYYY
 */
export function formatTimestampForDisplay(timestamp: number | null): string {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  
  return `${day}-${month}-${year}`;
}
