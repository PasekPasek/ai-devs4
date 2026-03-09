import { z } from 'zod';

export const PersonRecordSchema = z.object({
  name: z.string(),
  surname: z.string(),
  gender: z.enum(['M', 'F']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthPlace: z.string(),
  birthCountry: z.string(),
  job: z.string()
});

export const JobTagSchema = z.enum([
  'IT',
  'transport',
  'edukacja',
  'medycyna',
  'praca z ludźmi',
  'praca z pojazdami',
  'praca fizyczna'
]);

export const TaggedPersonSchema = PersonRecordSchema.extend({
  tags: z.array(JobTagSchema)
});

export const LLMBatchResultSchema = z.object({
  results: z.array(
    z.object({
      index: z.number(),
      tags: z.array(JobTagSchema)
    })
  )
});

export type PersonRecord = z.infer<typeof PersonRecordSchema>;
export type JobTag = z.infer<typeof JobTagSchema>;
export type TaggedPerson = z.infer<typeof TaggedPersonSchema>;
export type LLMBatchResult = z.infer<typeof LLMBatchResultSchema>;

export interface VerificationPayload {
  task: string;
  apikey: string;
  answer: Array<{
    name: string;
    surname: string;
    gender: string;
    born: number;
    city: string;
    tags: string[];
  }>;
}
