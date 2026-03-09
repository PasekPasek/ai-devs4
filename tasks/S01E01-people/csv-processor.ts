import { parse } from 'csv-parse/sync';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { PersonRecord, PersonRecordSchema } from './types.js';
import { config } from './config.js';
import { logProgress, retry, extractBirthYear } from './utils.js';

export async function downloadAndCacheCSV(): Promise<void> {
  if (existsSync(config.csvCachePath)) {
    logProgress('CSV file already cached, skipping download');
    return;
  }

  logProgress('Downloading CSV file...');

  const csvContent = await retry(async () => {
    const response = await fetch(config.csvUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.text();
  });

  writeFileSync(config.csvCachePath, csvContent, 'utf-8');
  logProgress('CSV file downloaded and cached', { path: config.csvCachePath });
}

export function parseCSV(): PersonRecord[] {
  logProgress('Parsing CSV file...');

  const csvContent = readFileSync(config.csvCachePath, 'utf-8');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const validatedRecords: PersonRecord[] = [];
  let invalidCount = 0;

  for (const record of records) {
    try {
      const validated = PersonRecordSchema.parse(record);
      validatedRecords.push(validated);
    } catch (error) {
      invalidCount++;
      if (invalidCount <= 5) {
        console.warn('Invalid record:', record, error);
      }
    }
  }

  if (invalidCount > 0) {
    logProgress(`Skipped ${invalidCount} invalid records`);
  }

  logProgress(`Parsed ${validatedRecords.length} valid records`);
  return validatedRecords;
}

export function filterByDemographics(records: PersonRecord[]): PersonRecord[] {
  logProgress('Filtering by demographics...');

  const filtered = records.filter((record) => {
    if (record.gender !== config.targetGender) return false;
    if (record.birthPlace !== config.targetCity) return false;

    const birthYear = extractBirthYear(record.birthDate);
    if (birthYear < config.minBirthYear || birthYear > config.maxBirthYear) {
      return false;
    }

    return true;
  });

  logProgress(`Filtered to ${filtered.length} records`, {
    gender: config.targetGender,
    city: config.targetCity,
    ageRange: `${config.minBirthYear}-${config.maxBirthYear}`
  });

  return filtered;
}
