// GMT+5:30 (IST - Indian Standard Time)
const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds

/**
 * Convert a date to IST (GMT+5:30) and return date string (dd/mm/yyyy)
 */
export function formatDateIST(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const istDate = new Date(d.getTime() + IST_OFFSET);
  
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  
  return `${day}/${month}/${year}`;
}

/**
 * Convert a date to IST (GMT+5:30) and return date string (YYYY-MM-DD) for HTML date input
 */
export function formatDateISTForInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const istDate = new Date(d.getTime() + IST_OFFSET);
  
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

/**
 * Convert a date to IST (GMT+5:30) and return time string (12-hour format with AM/PM)
 */
export function formatTimeIST(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const istDate = new Date(d.getTime() + IST_OFFSET);
  
  let hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");
  
  return `${hoursStr}:${minutesStr} ${ampm}`;
}

/**
 * Convert a date to IST (GMT+5:30) and return time string (HH:MM) for HTML time input
 */
export function formatTimeISTForInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const istDate = new Date(d.getTime() + IST_OFFSET);
  
  const hours = String(istDate.getUTCHours()).padStart(2, "0");
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  
  return `${hours}:${minutes}`;
}

/**
 * Convert dd/mm/yyyy date string to YYYY-MM-DD for HTML input
 */
export function convertDateToInputFormat(dateStr: string): string {
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Convert from dd/mm/yyyy to YYYY-MM-DD
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day}`;
}

/**
 * Convert YYYY-MM-DD date string to dd/mm/yyyy
 */
export function convertDateToDisplayFormat(dateStr: string): string {
  // If already in dd/mm/yyyy format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Convert from YYYY-MM-DD to dd/mm/yyyy
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Convert 12-hour time string (HH:MM AM/PM) to 24-hour format (HH:MM) for HTML input
 */
export function convertTimeToInputFormat(timeStr: string): string {
  // If already in 24-hour format (HH:MM), return as is
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  
  // Convert from 12-hour format (HH:MM AM/PM) to 24-hour format
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return timeStr;
  }
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  
  if (ampm === "PM" && hours !== 12) {
    hours += 12;
  } else if (ampm === "AM" && hours === 12) {
    hours = 0;
  }
  
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

/**
 * Convert 24-hour time string (HH:MM) to 12-hour format (HH:MM AM/PM)
 */
export function convertTimeToDisplayFormat(timeStr: string): string {
  // If already in 12-hour format, return as is
  if (/^\d{2}:\d{2}\s*(AM|PM)$/i.test(timeStr)) {
    return timeStr;
  }
  
  // Convert from 24-hour format (HH:MM) to 12-hour format
  const [hoursStr, minutes] = timeStr.split(":");
  let hours = parseInt(hoursStr, 10);
  
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

/**
 * Convert IST date and time strings to a Date object
 * Accepts dd/mm/yyyy and HH:MM AM/PM formats
 */
export function parseISTDateTime(dateStr: string, timeStr: string): Date {
  // Convert date from dd/mm/yyyy to YYYY-MM-DD if needed
  const dateForParsing = convertDateToInputFormat(dateStr);
  const [year, month, day] = dateForParsing.split("-").map(Number);
  
  // Convert time from 12-hour to 24-hour if needed
  const timeForParsing = convertTimeToInputFormat(timeStr);
  const [hours, minutes] = timeForParsing.split(":").map(Number);
  
  // Create date in UTC (IST - 5:30)
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  
  // Convert back to UTC by subtracting IST offset
  return new Date(utcDate.getTime() - IST_OFFSET);
}

/**
 * Get current date in IST format (dd/mm/yyyy)
 */
export function getCurrentDateIST(): string {
  return formatDateIST(new Date());
}

/**
 * Get current time in IST format (12-hour with AM/PM)
 */
export function getCurrentTimeIST(): string {
  return formatTimeIST(new Date());
}

/**
 * Get current date in IST format (YYYY-MM-DD) for HTML input
 */
export function getCurrentDateISTForInput(): string {
  return formatDateISTForInput(new Date());
}

/**
 * Get current time in IST format (HH:MM) for HTML input
 */
export function getCurrentTimeISTForInput(): string {
  return formatTimeISTForInput(new Date());
}

