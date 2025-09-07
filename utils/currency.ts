/**
 * Indonesian Currency Utilities
 * Format numbers to Indonesian Rupiah (IDR)
 */

export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Format number to Indonesian Rupiah
 */
export function formatIDR(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  const formatted = Math.abs(amount).toLocaleString('id-ID', {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  let result = '';
  
  if (showSymbol) {
    result = `Rp ${formatted}`;
  } else if (showCode) {
    result = `${formatted} IDR`;
  } else {
    result = formatted;
  }

  // Add minus sign for negative amounts
  if (amount < 0) {
    result = `-${result}`;
  }

  return result;
}

/**
 * Format currency for compact display (e.g., 1.2M, 500K)
 */
export function formatCompactIDR(amount: number): string {
  const absAmount = Math.abs(amount);
  let result = '';

  if (absAmount >= 1_000_000_000) {
    result = `Rp ${(absAmount / 1_000_000_000).toFixed(1)}M`;
  } else if (absAmount >= 1_000_000) {
    result = `Rp ${(absAmount / 1_000_000).toFixed(1)}Jt`;
  } else if (absAmount >= 1_000) {
    result = `Rp ${(absAmount / 1_000).toFixed(1)}K`;
  } else {
    result = `Rp ${absAmount.toLocaleString('id-ID')}`;
  }

  // Add minus sign for negative amounts
  if (amount < 0) {
    result = `-${result}`;
  }

  return result;
}

/**
 * Parse IDR string back to number
 */
export function parseIDR(idrString: string): number {
  // Remove currency symbols and clean the string
  const cleaned = idrString
    .replace(/[Rp\s]/g, '')
    .replace(/\./g, '') // Remove thousands separators
    .replace(/,/g, '.'); // Convert decimal separator

  const number = parseFloat(cleaned);
  return isNaN(number) ? 0 : number;
}

/**
 * Format for input fields (without currency symbol)
 */
export function formatInputIDR(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  
  return numAmount.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format percentage for Indonesian locale
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Convert USD to IDR (static rate for demo - in real app, use API)
 */
export function convertUSDToIDR(usdAmount: number): number {
  const exchangeRate = 15000; // Example rate, should come from API
  return usdAmount * exchangeRate;
}

/**
 * Get currency display name
 */
export function getCurrencyName(): string {
  return 'Rupiah Indonesia';
}

/**
 * Get currency code
 */
export function getCurrencyCode(): string {
  return 'IDR';
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(): string {
  return 'Rp';
}
