/**
 * Input validation utilities
 */

import { ValidationError } from './errors';

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate and throw if URL is invalid
 */
export function requireValidUrl(url: string, fieldName = 'URL'): void {
  if (!validateUrl(url)) {
    throw new ValidationError(`Invalid ${fieldName}: ${url}`);
  }
}

/**
 * Detect if input is a feed ID (numeric) or feed URL
 */
export function detectFeedIdOrUrl(input: string): { type: 'id' | 'url'; value: string | number } {
  const trimmed = input.trim();

  // Check if it's a number
  if (/^\d+$/.test(trimmed)) {
    return { type: 'id', value: parseInt(trimmed, 10) };
  }

  // Assume it's a URL
  return { type: 'url', value: trimmed };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDateFormat(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate and throw if date format is invalid
 */
export function requireValidDate(dateString: string, fieldName = 'Date'): void {
  if (!validateDateFormat(dateString)) {
    throw new ValidationError(
      `Invalid ${fieldName} format: ${dateString}. Expected format: YYYY-MM-DD`
    );
  }
}

/**
 * Validate number is within range
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName = 'Value'
): void {
  if (value < min || value > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max}, got ${value}`
    );
  }
}

/**
 * Validate language code format (2-letter ISO 639-1 code)
 */
export function validateLanguageCode(code: string): boolean {
  return /^[a-z]{2}$/i.test(code);
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query.trim();
}
