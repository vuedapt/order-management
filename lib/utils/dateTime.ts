export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentTime(): string {
  const now = new Date();
  const hoursNum = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hoursNum >= 12 ? "PM" : "AM";
  const displayHours = hoursNum > 12 ? hoursNum - 12 : hoursNum === 0 ? 12 : hoursNum;
  return `${String(displayHours).padStart(2, "0")}:${minutes} ${ampm}`;
}

export function getDateRangeFilter(timeRange: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  let start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (timeRange) {
    case "today":
      // Already set above
      break;
    case "7d":
      start.setDate(now.getDate() - 7);
      break;
    case "1m":
      start.setMonth(now.getMonth() - 1);
      break;
    case "1y":
      start.setFullYear(now.getFullYear() - 1);
      break;
    case "all":
    default:
      start = new Date(0); // Beginning of time
      break;
  }

  return { start, end };
}
