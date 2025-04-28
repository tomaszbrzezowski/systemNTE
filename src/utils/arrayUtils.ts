export function groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
  return array.reduce((result, currentValue) => {
    const groupKey = String(currentValue[key] || 'unassigned');
    (result[groupKey] = result[groupKey] || []).push(currentValue);
    return result;
  }, {} as { [key: string]: T[] });
}

/**
 * Sorts an array of objects by a specified key
 * @param array The array to sort
 * @param key The key to sort by
 * @returns A new sorted array
 */
export function sortBy<T>(array: T[], key: keyof T): T[] {
  return [...array].sort((a, b) => {
    const valueA = a[key];
    const valueB = b[key];
    
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return valueA - valueB;
    }
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return valueA.localeCompare(valueB);
    }
    
    return 0;
  });
}