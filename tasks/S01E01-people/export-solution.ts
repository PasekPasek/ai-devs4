import 'dotenv/config';
import { downloadAndCacheCSV, parseCSV, filterByDemographics } from './csv-processor.js';
import { tagJobsWithLLM } from './llm-tagger.js';
import { config } from './config.js';
import { logProgress, extractBirthYear } from './utils.js';
import { TaggedPerson } from './types.js';
import { writeFileSync } from 'fs';

async function main() {
  try {
    logProgress('=== Exporting Solution to CSV ===');

    // Download and parse CSV
    await downloadAndCacheCSV();
    const allRecords = parseCSV();
    logProgress(`Total records loaded: ${allRecords.length}`);

    // Filter by demographics
    const filteredRecords = filterByDemographics(allRecords);
    logProgress(`Records after demographic filter: ${filteredRecords.length}`);

    if (filteredRecords.length === 0) {
      throw new Error('No records match demographic criteria');
    }

    // Tag jobs with LLM
    const taggedRecords = await tagJobsWithLLM(filteredRecords);

    // Filter transport workers (same as sent in verification)
    const transportWorkers = taggedRecords.filter((person) =>
      person.tags.includes(config.targetTag)
    );

    logProgress(`Transport workers found: ${transportWorkers.length}`);

    if (transportWorkers.length === 0) {
      throw new Error('No transport workers found');
    }

    // Convert to CSV format
    const csvHeader = 'name,surname,gender,born,city,tags\n';
    const csvRows = transportWorkers.map((person: TaggedPerson) => {
      const born = extractBirthYear(person.birthDate);
      const tags = person.tags.join(';');
      return `${person.name},${person.surname},${person.gender},${born},${person.birthPlace},"${tags}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Save to file
    const outputPath = 'tasks/S01E01-people/solution-people.csv';
    writeFileSync(outputPath, csvContent, 'utf-8');

    logProgress(`✅ Exported ${transportWorkers.length} people to: ${outputPath}`);
    logProgress('=== Export Completed Successfully ===');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
