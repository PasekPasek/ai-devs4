import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { config } from './config.js';
import { Suspect, SuspectSchema } from './types.js';
import { z } from 'zod';

/**
 * Load suspects from S01E01 people-list.csv
 * Format: name,surname,gender,born,city,tags
 * born is already a year as integer
 */
export function loadSuspects(): Suspect[] {
  try {
    const csvContent = readFileSync(config.peopleListPath, 'utf-8');

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      cast: true, // Auto-cast numbers
      cast_date: false
    });

    // Validate each record
    const suspects = records.map((record: any) => {
      // Ensure born is a number
      const suspect = {
        ...record,
        born: typeof record.born === 'string' ? parseInt(record.born, 10) : record.born
      };

      return SuspectSchema.parse(suspect);
    });

    console.log(`✓ Loaded ${suspects.length} suspects from CSV`);
    return suspects;

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error in suspects data:', error.errors);
    } else {
      console.error('Error loading suspects:', error);
    }
    throw error;
  }
}
