/**
 * Safely parses a JSON string and returns the parsed object or null if parsing fails
 * @param jsonString The JSON string to parse
 * @param defaultValue The default value to return if parsing fails (default: null)
 * @returns The parsed object or the default value if parsing fails
 */
export function safeJsonParse<T = any>(jsonString: string, defaultValue: T | null = null): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    return defaultValue;
  }
}

/**
 * Safely stringifies an object to JSON
 * @param value The value to stringify
 * @param defaultValue The default value to return if stringify fails (default: 'null')
 * @returns The JSON string or the default value if stringify fails
 */
export function safeJsonStringify(value: any, defaultValue: string = 'null'): string {
  try {
    return JSON.stringify(value);
  } catch (e) {
    console.error('Failed to stringify JSON:', e);
    return defaultValue;
  }
}
