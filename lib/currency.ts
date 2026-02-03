/**
 * Currency Formatting Utilities
 *
 * ⚠️ IMPORTANT: All monetary values in the app are stored as INTEGER CENTS
 * to avoid floating-point precision errors.
 *
 * Use these functions to convert between cents and display format:
 * - Storage: 10000 cents
 * - Display: $100.00
 */

/**
 * Format cents as dollars with 2 decimal places
 * @param cents - Amount in cents (integer)
 * @returns Formatted string like "$100.00"
 *
 * @example
 * formatCents(10000) // "$100.00"
 * formatCents(1550) // "$15.50"
 * formatCents(99) // "$0.99"
 */
export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Format cents as dollars without the dollar sign
 * @param cents - Amount in cents (integer)
 * @returns Formatted number string like "100.00"
 *
 * @example
 * formatCentsPlain(10000) // "100.00"
 * formatCentsPlain(1550) // "15.50"
 */
export function formatCentsPlain(cents: number): string {
  const dollars = cents / 100;
  return dollars.toFixed(2);
}

/**
 * Convert dollars to cents (for user input)
 * @param dollars - Amount in dollars (can be float)
 * @returns Amount in cents (integer)
 *
 * @example
 * dollarsToCents(100.00) // 10000
 * dollarsToCents(15.50) // 1550
 * dollarsToCents(0.99) // 99
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars (for calculations/display)
 * @param cents - Amount in cents (integer)
 * @returns Amount in dollars (float)
 *
 * @example
 * centsToDollars(10000) // 100.00
 * centsToDollars(1550) // 15.50
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Validate that a value is a positive integer (for cents validation)
 * @param value - Value to validate
 * @returns true if value is a positive integer
 */
export function isValidCents(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/**
 * Format cents compactly (K for thousands, M for millions)
 * @param cents - Amount in cents (integer)
 * @returns Compact formatted string like "$1.5K" or "$2.3M"
 *
 * @example
 * formatCentsCompact(150000) // "$1.5K" (1500.00)
 * formatCentsCompact(2500000) // "$25K"
 * formatCentsCompact(123456789) // "$1.2M"
 */
export function formatCentsCompact(cents: number): string {
  const dollars = cents / 100;

  if (dollars >= 1000000) {
    return `$${(dollars / 1000000).toFixed(1)}M`;
  } else if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}K`;
  } else {
    return formatCents(cents);
  }
}
