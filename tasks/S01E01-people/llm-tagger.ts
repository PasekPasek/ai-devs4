import { z } from 'zod';
import { PersonRecord, TaggedPerson, LLMBatchResultSchema } from './types.js';
import { config, llmConfig } from './config.js';
import { logProgress, retry, sleep } from './utils.js';

const SYSTEM_PROMPT = `You are a job classification expert. Analyze job descriptions and assign relevant tags.

Available tags:
- IT: Software development, programming, system administration, IT support
- transport: Driving, delivery, logistics, vehicle operation, transportation
- edukacja: Teaching, training, education
- medycyna: Healthcare, medical services, nursing
- praca z ludźmi: Customer service, sales, social work, HR
- praca z pojazdami: Vehicle repair, mechanics, automotive work
- praca fizyczna: Manual labor, construction, warehouse work

Rules:
- Assign ALL relevant tags (a job can have multiple tags)
- Be precise: "kierowca" = transport + praca z pojazdami
- Return tags in Polish as shown above
- For unclear jobs, assign most likely tags

CRITICAL: You MUST respond with valid JSON only, no explanatory text. Use this exact format:
{
  "results": [
    {"index": 0, "tags": ["transport", "praca z pojazdami"]},
    {"index": 1, "tags": ["IT"]}
  ]
}`;

interface OpenRouterMessage {
  role: 'system' | 'user';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature: number;
  max_tokens: number;
  response_format?: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict: boolean;
      schema: Record<string, any>;
    };
  };
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function callOpenRouter(batch: PersonRecord[]): Promise<z.infer<typeof LLMBatchResultSchema>> {
  const jobDescriptions = batch.map((person, index) => ({
    index,
    name: `${person.name} ${person.surname}`,
    job: person.job
  }));

  const requestBody: OpenRouterRequest = {
    model: llmConfig.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Classify these jobs:\n\n${JSON.stringify(jobDescriptions, null, 2)}`
      }
    ],
    temperature: llmConfig.temperature,
    max_tokens: llmConfig.maxTokens,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'job_classification',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'number' },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'string',
                      enum: [
                        'IT',
                        'transport',
                        'edukacja',
                        'medycyna',
                        'praca z ludźmi',
                        'praca z pojazdami',
                        'praca fizyczna'
                      ]
                    }
                  }
                },
                required: ['index', 'tags'],
                additionalProperties: false
              }
            }
          },
          required: ['results'],
          additionalProperties: false
        }
      }
    }
  };

  const response = await retry(async () => {
    const res = await fetch(llmConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openRouterToken}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter API error ${res.status}: ${errorText}`);
    }

    return res.json();
  }) as OpenRouterResponse;

  const content = response.choices[0].message.content;
  const parsed = JSON.parse(content);
  return LLMBatchResultSchema.parse(parsed);
}

export async function tagJobsWithLLM(records: PersonRecord[]): Promise<TaggedPerson[]> {
  logProgress(`Tagging ${records.length} jobs with LLM...`);

  const taggedRecords: TaggedPerson[] = [];
  const batchSize = config.batchSize;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(records.length / batchSize);

    logProgress(`Processing batch ${batchNum}/${totalBatches} (${batch.length} records)`);

    const result = await callOpenRouter(batch);

    for (const item of result.results) {
      const originalRecord = batch[item.index];
      taggedRecords.push({
        ...originalRecord,
        tags: item.tags
      });
    }

    if (i + batchSize < records.length) {
      await sleep(500);
    }
  }

  logProgress(`Successfully tagged ${taggedRecords.length} records`);
  return taggedRecords;
}
