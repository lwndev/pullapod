/**
 * Text and output formatting utilities
 */

/**
 * Truncate text at word boundaries
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @param suffix Suffix to add when truncated (default: "...")
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Find the last space before maxLength
  const truncateAt = text.lastIndexOf(' ', maxLength - suffix.length);

  // If no space found, truncate at maxLength
  if (truncateAt === -1) {
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  return text.substring(0, truncateAt) + suffix;
}

/**
 * Strip HTML tags from text
 * @param html HTML string
 * @returns Plain text
 */
export function stripHtml(html: string): string {
  if (!html) {
    return '';
  }

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Format number with thousands separators
 * @param num Number to format
 * @returns Formatted string
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Ensure URL doesn't wrap by truncating if needed
 * @param url URL string
 * @param maxLength Maximum length
 * @returns Formatted URL
 */
export function formatUrl(url: string, maxLength?: number): string {
  if (!maxLength || url.length <= maxLength) {
    return url;
  }

  // Truncate in the middle to preserve protocol and domain
  const prefixLength = Math.floor(maxLength * 0.4);
  const suffixLength = Math.floor(maxLength * 0.4);

  return url.substring(0, prefixLength) + '...' + url.substring(url.length - suffixLength);
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format boolean as Yes/No
 */
export function formatBoolean(value: boolean): string {
  return value ? 'Yes' : 'No';
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return singular;
  }
  return plural || `${singular}s`;
}
