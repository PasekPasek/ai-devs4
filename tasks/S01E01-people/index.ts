import 'dotenv/config';
import { downloadAndCacheCSV, parseCSV, filterByDemographics } from './csv-processor.js';
import { tagJobsWithLLM } from './llm-tagger.js';
import { prepareVerificationPayload, submitVerification } from './verifier.js';
import { config } from './config.js';
import { logProgress } from './utils.js';

async function main() {
  try {
    logProgress('=== AI_DEVS 4 - People Task Started ===');

    await downloadAndCacheCSV();

    const allRecords = parseCSV();
    logProgress(`Total records loaded: ${allRecords.length}`);

    const filteredRecords = filterByDemographics(allRecords);
    logProgress(`Records after demographic filter: ${filteredRecords.length}`);

    if (filteredRecords.length === 0) {
      throw new Error('No records match demographic criteria');
    }

    const taggedRecords = await tagJobsWithLLM(filteredRecords);

    const transportWorkers = taggedRecords.filter((person) =>
      person.tags.includes(config.targetTag)
    );

    logProgress(`Records with '${config.targetTag}' tag: ${transportWorkers.length}`);

    if (transportWorkers.length === 0) {
      throw new Error('No transport workers found after tagging');
    }

    logProgress('Sample transport workers:', transportWorkers.slice(0, 3));

    const payload = prepareVerificationPayload(transportWorkers);
    const result = await submitVerification(payload);

    logProgress('=== Verification Result ===');
    console.log(JSON.stringify(result, null, 2));

    if (result.flag) {
      logProgress(`🎉 Flag received: ${result.flag}`);
    }

    logProgress('=== Task Completed Successfully ===');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
