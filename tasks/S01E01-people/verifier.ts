import { TaggedPerson, VerificationPayload } from './types.js';
import { config } from './config.js';
import { logProgress, retry, extractBirthYear } from './utils.js';

export function prepareVerificationPayload(
  people: TaggedPerson[]
): VerificationPayload {
  return {
    task: 'people',
    apikey: config.apiKey,
    answer: people.map((person) => ({
      name: person.name,
      surname: person.surname,
      gender: person.gender,
      born: extractBirthYear(person.birthDate),
      city: person.birthPlace,
      tags: person.tags
    }))
  };
}

export async function submitVerification(
  payload: VerificationPayload
): Promise<any> {
  logProgress(`Submitting ${payload.answer.length} records for verification...`);

  const response = await retry(async () => {
    const res = await fetch(config.verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Verification failed ${res.status}: ${errorText}`);
    }

    return res.json();
  });

  logProgress('Verification response received');
  return response;
}
