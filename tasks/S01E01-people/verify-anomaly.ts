import 'dotenv/config';
import { parseCSV } from './csv-processor.js';
import { logProgress } from './utils.js';

async function main() {
  const records = parseCSV();
  logProgress(`Loaded ${records.length} records`);

  // Znajdź wszystkie przypadki niezgodności płci z zaimkami
  const anomalies = records.filter((record) => {
    const jobLower = record.job.toLowerCase();

    if (record.gender === 'M') {
      // Mężczyzna, ale w opisie są zaimki żeńskie
      return (
        jobLower.includes(' jej ') ||
        jobLower.includes(' ją ') ||
        jobLower.includes(' ona ') ||
        jobLower.startsWith('jej ')
      );
    } else if (record.gender === 'F') {
      // Kobieta, ale w opisie są zaimki męskie
      return (
        jobLower.includes(' jego ') ||
        jobLower.includes(' go ') ||
        jobLower.includes(' on ') ||
        jobLower.startsWith('jego ')
      );
    }

    return false;
  });

  console.log(`\nZnaleziono ${anomalies.length} anomalii (niezgodność płci z zaimkami):\n`);

  anomalies.forEach((person, index) => {
    console.log(`${index + 1}. ${person.name} ${person.surname}`);
    console.log(`   Płeć: ${person.gender}`);
    console.log(`   Data urodzenia: ${person.birthDate}`);
    console.log(`   Miejsce: ${person.birthPlace}, ${person.birthCountry}`);
    console.log(`   Zawód: ${person.job.substring(0, 150)}...`);
    console.log('');
  });
}

main();
