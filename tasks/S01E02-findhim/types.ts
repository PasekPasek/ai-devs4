import { z } from 'zod';

// Suspect from S01E01
export const SuspectSchema = z.object({
  name: z.string(),
  surname: z.string(),
  gender: z.string(),
  born: z.number(), // Year as integer
  city: z.string(),
  tags: z.string()
});

export type Suspect = z.infer<typeof SuspectSchema>;

// Power plant (actual API format)
export const PowerPlantDataSchema = z.object({
  is_active: z.boolean(),
  power: z.string(),
  code: z.string()
});

export const PowerPlantsResponseSchema = z.object({
  power_plants: z.record(PowerPlantDataSchema)
});

export type PowerPlantData = z.infer<typeof PowerPlantDataSchema>;

// Internal power plant with coordinates
export const PowerPlantSchema = z.object({
  city: z.string(),
  code: z.string(),
  lat: z.number(),
  lon: z.number(),
  is_active: z.boolean(),
  power: z.string()
});

export type PowerPlant = z.infer<typeof PowerPlantSchema>;

// Location coordinates (actual API format uses latitude/longitude)
export const CoordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number()
});

export type Coordinates = z.infer<typeof CoordinatesSchema>;

// API Responses - location API returns array directly
export const LocationResponseSchema = z.array(CoordinatesSchema);

export const AccessLevelResponseSchema = z.object({
  name: z.string(),
  surname: z.string(),
  accessLevel: z.number()
});

export const VerifyResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  flag: z.string().optional()
});

// Tool call types
export const ToolCallSchema = z.object({
  id: z.string(),
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    arguments: z.string()
  })
});

export type ToolCall = z.infer<typeof ToolCallSchema>;
