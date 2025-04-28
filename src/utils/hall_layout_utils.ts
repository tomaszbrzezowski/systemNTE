/**
 * Utility functions for hall layout management
 */

/**
 * Safely checks if a value is an object
 * @param value The value to check
 * @returns True if the value is a non-null object, false otherwise
 */
export function isObject(value: any): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safely checks if a value is an array and has elements
 * @param value The value to check
 * @returns True if the value is a non-empty array, false otherwise
 */
export function isNonEmptyArray(value: any): boolean {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Safely gets the length of an array
 * @param arr The array to get the length of
 * @returns The length of the array, or 0 if the array is null or undefined
 */
export function safeArrayLength(arr: any[] | null | undefined): number {
  if (!arr || !Array.isArray(arr)) {
    return 0;
  }
  return arr.length;
}

/**
 * Safely iterates over an array, handling null or undefined arrays
 * @param arr The array to iterate over
 * @param callback The callback function to call for each element
 */
export function safeArrayForEach<T>(
  arr: T[] | null | undefined, 
  callback: (item: T, index: number) => void
): void {
  if (!arr || !Array.isArray(arr)) {
    return;
  }
  
  arr.forEach(callback);
}

/**
 * Converts a layout_blocks array to a safe format that won't cause FOR loop errors
 * @param layoutBlocks The layout_blocks array from the database
 * @returns A safe version of the layout_blocks array
 */
export function sanitizeLayoutBlocks(layoutBlocks: any): any[] {
  // If null or undefined, return empty array
  if (!layoutBlocks) {
    return [];
  }
  
  // If not an array, wrap in array
  if (!Array.isArray(layoutBlocks)) {
    return [layoutBlocks];
  }
  
  // Filter out any null or undefined blocks
  return layoutBlocks.filter(block => block !== null && block !== undefined).map(block => {
    // If this is a seat_assignments block, ensure it has proper structure
    if (block && block.type === 'seat_assignments') {
      // Ensure sections is an object and sanitize each section
      const sections = isObject(block.sections) ? block.sections : {};
      const sanitizedSections = Object.entries(sections).reduce((acc, [key, section]) => ({
        ...acc,
        [key]: sanitizeSectionData(section)
      }), {});

      return {
        type: 'seat_assignments',
        sections: sanitizedSections,
        assignments: isObject(block.assignments) ? block.assignments : {},
        schools: Array.isArray(block.schools) ? block.schools : []
      };
    }
    return block;
  });
}

/**
 * Safely extracts sections from layout blocks
 * @param layoutBlocks The layout_blocks array from the database
 * @returns An object containing the sections data
 */
export function extractSectionsFromLayoutBlocks(layoutBlocks: any): Record<string, any> {
  if (!layoutBlocks) {
    return {};
  }
  
  // Ensure layout blocks is an array
  const blocks = sanitizeLayoutBlocks(layoutBlocks);
  
  // Find the seat_assignments block
  const seatAssignmentsBlock = blocks.find(block => block && block.type === 'seat_assignments');
  
  if (!seatAssignmentsBlock || !isObject(seatAssignmentsBlock.sections)) {
    return {};
  }
  
  // Sanitize each section before returning
  return Object.entries(seatAssignmentsBlock.sections).reduce((acc, [key, section]) => ({
    ...acc,
    [key]: sanitizeSectionData(section)
  }), {});
}

/**
 * Safely extracts assignments from layout blocks
 * @param layoutBlocks The layout_blocks array from the database
 * @returns An object containing the assignments data
 */
export function extractAssignmentsFromLayoutBlocks(layoutBlocks: any): Record<string, string> {
  if (!layoutBlocks) {
    return {};
  }
  
  // Ensure layout blocks is an array
  const blocks = sanitizeLayoutBlocks(layoutBlocks);
  
  // Find the seat_assignments block
  const seatAssignmentsBlock = blocks.find(block => block && block.type === 'seat_assignments');
  
  if (!seatAssignmentsBlock || !isObject(seatAssignmentsBlock.assignments)) {
    return {};
  }
  
  return seatAssignmentsBlock.assignments;
}

/**
 * Safely ensures that section data has valid rowSeats arrays
 * @param section The section data to sanitize
 * @returns The sanitized section data
 */
export function sanitizeSectionData(section: any): any {
  if (!section) return {
    rows: 0,
    seatsPerRow: 0,
    rowSeats: [],
    removedSeats: {},
    emptyRows: [],
    seatGaps: {},
    orientation: 'horizontal',
    numbering_style: 'arabic',
    numbering_direction: 'ltr',
    alignment: 'center',
    position: 'center'
  };
  
  // Create a copy to avoid modifying the original
  const sanitizedSection = { ...section };
  
  // Ensure rows is a valid number
  sanitizedSection.rows = typeof sanitizedSection.rows === 'number' && !isNaN(sanitizedSection.rows) 
    ? Math.max(0, Math.floor(sanitizedSection.rows))
    : 0;
  
  // Ensure seatsPerRow is a valid number
  sanitizedSection.seatsPerRow = typeof sanitizedSection.seatsPerRow === 'number' && !isNaN(sanitizedSection.seatsPerRow)
    ? Math.max(0, Math.floor(sanitizedSection.seatsPerRow))
    : 0;
  
  // Ensure rowSeats is a valid array of numbers
  if (!Array.isArray(sanitizedSection.rowSeats)) {
    sanitizedSection.rowSeats = Array(sanitizedSection.rows).fill(sanitizedSection.seatsPerRow);
  } else {
    // Filter out any non-numeric values and ensure proper length
    sanitizedSection.rowSeats = sanitizedSection.rowSeats
      .map(seats => typeof seats === 'number' && !isNaN(seats) ? Math.max(0, Math.floor(seats)) : sanitizedSection.seatsPerRow)
      .slice(0, sanitizedSection.rows);
    
    // If array is too short, extend it
    while (sanitizedSection.rowSeats.length < sanitizedSection.rows) {
      sanitizedSection.rowSeats.push(sanitizedSection.seatsPerRow);
    }
  }
  
  // Ensure other properties have valid default values
  sanitizedSection.removedSeats = isObject(sanitizedSection.removedSeats) ? sanitizedSection.removedSeats : {};
  sanitizedSection.emptyRows = Array.isArray(sanitizedSection.emptyRows) ? sanitizedSection.emptyRows : [];
  sanitizedSection.seatGaps = isObject(sanitizedSection.seatGaps) ? sanitizedSection.seatGaps : {};
  
  // Ensure orientation has a valid value
  sanitizedSection.orientation = ['horizontal', 'vertical'].includes(sanitizedSection.orientation)
    ? sanitizedSection.orientation
    : 'horizontal';
  
  // Ensure numbering_style has a valid value
  sanitizedSection.numbering_style = ['arabic', 'roman', 'letters'].includes(sanitizedSection.numbering_style)
    ? sanitizedSection.numbering_style
    : 'arabic';
  
  // Ensure numbering_direction has a valid value
  sanitizedSection.numbering_direction = ['ltr', 'rtl'].includes(sanitizedSection.numbering_direction)
    ? sanitizedSection.numbering_direction
    : 'ltr';
  
  // Ensure alignment has a valid value
  sanitizedSection.alignment = ['left', 'center', 'right'].includes(sanitizedSection.alignment)
    ? sanitizedSection.alignment
    : 'center';
  
  // Ensure position has a valid value
  sanitizedSection.position = ['center', 'left', 'right', 'back'].includes(sanitizedSection.position)
    ? sanitizedSection.position
    : 'center';
  
  return sanitizedSection;
}