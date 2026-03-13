import 'dotenv/config';
import { parseCSV } from './csv-processor.js';
import { config } from './config.js';
import { logProgress } from './utils.js';
import type { PersonRecord } from './types.js';

interface AnomalyAnalysis {
  anomalousPerson: {
    name: string;
    surname: string;
    gender: string;
    birthDate: string;
    birthPlace: string;
    birthCountry: string;
    job: string;
  };
  reasoning: string;
  patterns: {
    mostCommonGender?: string;
    mostCommonCountry?: string;
    namePatterns?: string;
    otherObservations?: string;
  };
}

async function analyzeWithGPT4(records: PersonRecord[]): Promise<AnomalyAnalysis> {
  logProgress('Preparing data summary for GPT-4 analysis...');

  // Przygotuj statystyki
  const genderCounts = records.reduce((acc, r) => {
    acc[r.gender] = (acc[r.gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countryCounts = records.reduce((acc, r) => {
    acc[r.birthCountry] = (acc[r.birthCountry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const nameCounts = records.reduce((acc, r) => {
    acc[r.name] = (acc[r.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Pobierz próbkę danych (pierwszych 100 i ostatnich 100 rekordów)
  const sampleSize = 100;
  const firstRecords = records.slice(0, sampleSize);
  const lastRecords = records.slice(-sampleSize);
  const middleIndex = Math.floor(records.length / 2);
  const middleRecords = records.slice(middleIndex - 50, middleIndex + 50);

  const prompt = `Jesteś detektywem danych. Otrzymujesz dataset z ${records.length} rekordami ludzi z następującymi polami:
- name (imię)
- surname (nazwisko)
- gender (M/F)
- birthDate (YYYY-MM-DD)
- birthPlace (miasto)
- birthCountry (kraj)
- job (opis zawodu)

STATYSTYKI DATASETU:
- Płeć: ${JSON.stringify(genderCounts)}
- Kraj urodzenia: ${JSON.stringify(countryCounts)}
- Najczęstsze imiona: ${JSON.stringify(Object.entries(nameCounts).sort((a, b) => b[1] - a[1]).slice(0, 10))}

PRÓBKA DANYCH (pierwsze ${sampleSize} rekordów):
${JSON.stringify(firstRecords, null, 2)}

PRÓBKA DANYCH (środkowe 100 rekordów):
${JSON.stringify(middleRecords, null, 2)}

PRÓBKA DANYCH (ostatnie ${sampleSize} rekordów):
${JSON.stringify(lastRecords, null, 2)}

ZADANIE:
Znajdź jedną osobę, która jest ANOMALIĄ - nie pasuje do reszty danych. Może to być:
- Niezgodność płci z opisem zawodu (używane zaimki "jej/jego")
- Nietypowe imię
- Nietypowy kraj urodzenia
- Nietypowa kombinacja danych
- Cokolwiek innego, co odstaje od wzorców

Przeanalizuj dane bardzo dokładnie i zwróć TYLKO JSON z następującą strukturą:
{
  "anomalousPerson": {
    "name": "...",
    "surname": "...",
    "gender": "...",
    "birthDate": "...",
    "birthPlace": "...",
    "birthCountry": "...",
    "job": "..."
  },
  "reasoning": "Szczegółowe wyjaśnienie, dlaczego ta osoba jest anomalią",
  "patterns": {
    "mostCommonGender": "...",
    "mostCommonCountry": "...",
    "namePatterns": "...",
    "otherObservations": "..."
  }
}`;

  logProgress('Sending request to GPT-4...');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openRouterToken}`
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a data anomaly detection expert. Analyze datasets and find patterns and outliers. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
  }

  const result = await response.json() as any;
  const content = result.choices[0].message.content;

  // Usuń markdown code blocks jeśli są
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(cleanContent);
}

async function main() {
  try {
    logProgress('=== Finding Anomaly in People Dataset ===');

    const records = parseCSV();
    logProgress(`Loaded ${records.length} records`);

    const analysis = await analyzeWithGPT4(records);

    logProgress('\n=== ANOMALY FOUND ===');
    console.log('\nAnomalous Person:');
    console.log(JSON.stringify(analysis.anomalousPerson, null, 2));

    console.log('\nReasoning:');
    console.log(analysis.reasoning);

    console.log('\nPatterns Observed:');
    console.log(JSON.stringify(analysis.patterns, null, 2));

    logProgress('\n=== Analysis Complete ===');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
