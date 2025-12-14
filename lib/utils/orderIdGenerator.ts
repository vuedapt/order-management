/**
 * Generate order IDs in the format AAA001 to ZZZ999
 * Format: 3 uppercase letters + 3 digits
 */

/**
 * Convert a number (0-17575) to a 3-letter code (AAA-ZZZ)
 */
function numberToLetters(num: number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const third = num % 26;
  const second = Math.floor(num / 26) % 26;
  const first = Math.floor(num / (26 * 26)) % 26;
  return letters[first] + letters[second] + letters[third];
}

/**
 * Convert a 3-letter code (AAA-ZZZ) to a number (0-17575)
 */
function lettersToNumber(letters: string): number {
  const lettersUpper = letters.toUpperCase();
  const first = lettersUpper.charCodeAt(0) - 65;
  const second = lettersUpper.charCodeAt(1) - 65;
  const third = lettersUpper.charCodeAt(2) - 65;
  return first * 26 * 26 + second * 26 + third;
}

/**
 * Parse an order ID (e.g., "AAA001") into its components
 */
function parseOrderId(orderId: string): { letters: string; number: number } {
  const match = orderId.match(/^([A-Z]{3})(\d{3})$/);
  if (!match) {
    throw new Error(`Invalid order ID format: ${orderId}`);
  }
  return {
    letters: match[1],
    number: parseInt(match[2], 10),
  };
}

/**
 * Generate the next order ID based on the last order ID
 */
export function generateNextOrderId(lastOrderId: string | null): string {
  console.log("[OrderIdGenerator] generateNextOrderId called", { lastOrderId, type: typeof lastOrderId });
  
  if (!lastOrderId) {
    console.log("[OrderIdGenerator] No lastOrderId, returning AAA001");
    return "AAA001";
  }

  try {
    console.log("[OrderIdGenerator] Parsing lastOrderId", { lastOrderId });
    const { letters, number } = parseOrderId(lastOrderId);
    console.log("[OrderIdGenerator] Parsed components", { letters, number });

    let nextNumber = number + 1;
    let nextLetters = letters;

    // If number exceeds 999, increment letters and reset to 001
    if (nextNumber > 999) {
      console.log("[OrderIdGenerator] Number exceeds 999, incrementing letters");
      nextNumber = 1;
      const letterNum = lettersToNumber(letters);
      const nextLetterNum = letterNum + 1;

      // Check if we've exceeded ZZZ
      if (nextLetterNum > 17575) {
        throw new Error("Order ID limit reached (ZZZ999)");
      }

      nextLetters = numberToLetters(nextLetterNum);
      console.log("[OrderIdGenerator] New letters", { nextLetters });
    }

    // Format number with leading zeros
    const formattedNumber = String(nextNumber).padStart(3, "0");
    const result = nextLetters + formattedNumber;
    
    console.log("[OrderIdGenerator] Generated orderId", { result, nextLetters, formattedNumber });
    return result;
  } catch (error) {
    // If parsing fails, start from AAA001
    console.error("[OrderIdGenerator] Error parsing last order ID, starting from AAA001:", error);
    return "AAA001";
  }
}

/**
 * Validate an order ID format
 */
export function isValidOrderId(orderId: string): boolean {
  return /^[A-Z]{3}\d{3}$/.test(orderId);
}

