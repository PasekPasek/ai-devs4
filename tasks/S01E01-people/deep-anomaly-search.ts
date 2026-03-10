import 'dotenv/config';
import { parseCSV } from './csv-processor.js';
import { logProgress } from './utils.js';

async function main() {
  const records = parseCSV();
  logProgress(`Loaded ${records.length} records`);

  // 1. Analiza imion
  const nameCounts = new Map<string, number>();
  records.forEach((r) => {
    nameCounts.set(r.name, (nameCounts.get(r.name) || 0) + 1);
  });

  const rareNames = Array.from(nameCounts.entries())
    .filter(([_, count]) => count === 1)
    .map(([name]) => name);

  console.log(`\n=== ANALIZA IMION ===`);
  console.log(`Unikalne imiona (występują tylko raz): ${rareNames.length}`);
  console.log(`Przykłady:`, rareNames.slice(0, 20));

  // 2. Analiza krajów
  const countryCounts = new Map<string, number>();
  records.forEach((r) => {
    countryCounts.set(r.birthCountry, (countryCounts.get(r.birthCountry) || 0) + 1);
  });

  console.log(`\n=== ANALIZA KRAJÓW ===`);
  console.log(`Kraje i liczba osób:`);
  Array.from(countryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      console.log(`  ${country}: ${count}`);
    });

  // 3. Znajdź osoby z unikalnymi imionami
  const uniqueNamePeople = records.filter((r) => rareNames.includes(r.name));

  console.log(`\n=== OSOBY Z UNIKALNYMI IMIONAMI ===`);
  uniqueNamePeople.slice(0, 30).forEach((person) => {
    console.log(`\n${person.name} ${person.surname}`);
    console.log(`  Płeć: ${person.gender}, Data: ${person.birthDate}`);
    console.log(`  Miejsce: ${person.birthPlace}, ${person.birthCountry}`);
    console.log(`  Zawód: ${person.job.substring(0, 120)}...`);
  });

  // 4. Znajdź osoby z nietypowych krajów
  const nonPolishPeople = records.filter((r) => r.birthCountry !== 'Polska');

  console.log(`\n=== OSOBY SPOZA POLSKI ===`);
  console.log(`Liczba: ${nonPolishPeople.length}`);
  nonPolishPeople.forEach((person) => {
    console.log(`\n${person.name} ${person.surname}`);
    console.log(`  Płeć: ${person.gender}, Data: ${person.birthDate}`);
    console.log(`  Miejsce: ${person.birthPlace}, ${person.birthCountry}`);
    console.log(`  Zawód: ${person.job.substring(0, 120)}...`);
  });

  // 5. Kombinacja czynników
  const potentialAnomalies = uniqueNamePeople.filter(
    (person) =>
      // Unikalne imię + niezgodność zaimków
      (person.gender === 'M' &&
       (person.job.toLowerCase().includes(' jej ') ||
        person.job.toLowerCase().includes(' ją ') ||
        person.job.toLowerCase().includes(' ona '))) ||
      (person.gender === 'F' &&
       (person.job.toLowerCase().includes(' jego ') ||
        person.job.toLowerCase().includes(' go ') ||
        person.job.toLowerCase().includes(' on ')))
  );

  console.log(`\n=== POTENCJALNE ANOMALIE (unikalne imię + niezgodność zaimków) ===`);
  console.log(`Liczba: ${potentialAnomalies.length}`);
  potentialAnomalies.forEach((person) => {
    console.log(`\n${person.name} ${person.surname}`);
    console.log(`  Płeć: ${person.gender}, Data: ${person.birthDate}`);
    console.log(`  Miejsce: ${person.birthPlace}, ${person.birthCountry}`);
    console.log(`  Zawód: ${person.job}`);
  });
}

main();
