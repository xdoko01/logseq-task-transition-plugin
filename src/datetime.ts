const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

/**
 * Formats a Date as a LogSeq journal page link with optional HH:mm time.
 * Example (includeTime=true):  [[Apr 17th, 2026]] 12:05
 * Example (includeTime=false): [[Apr 17th, 2026]]
 */
export function formatDatetime(date: Date, includeTime: boolean): string {
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const link = `[[${month} ${day}${ordinal(day)}, ${year}]]`;
  if (!includeTime) return link;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${link} ${hh}:${mm}`;
}
