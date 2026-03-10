import { loadSuspects } from './suspects-loader.js';
import { calculateHaversine } from './geo-calculator.js';
import { config } from './config.js';
import {
  PowerPlant,
  PowerPlantSchema,
  PowerPlantsResponseSchema,
  LocationResponseSchema,
  AccessLevelResponseSchema,
  VerifyResponseSchema
} from './types.js';
import { getCityCoordinates } from './city-coordinates.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { z } from 'zod';

/**
 * Retry helper for API calls
 */
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 500
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  throw new Error('Retry failed');
}

/**
 * Tool handler implementations
 */
export const toolHandlers: Record<string, (args: any) => Promise<string>> = {
  /**
   * Load suspects from S01E01
   */
  async load_suspects() {
    try {
      const suspects = loadSuspects();
      console.log(`[TOOL] load_suspects → ${suspects.length} suspects loaded`);

      return JSON.stringify({
        success: true,
        count: suspects.length,
        suspects: suspects
      });
    } catch (error: any) {
      console.error('[TOOL] load_suspects ERROR:', error.message);
      return JSON.stringify({
        success: false,
        error: `Nie można wczytać podejrzanych: ${error.message}`
      });
    }
  },

  /**
   * Fetch power plants from Hub (with caching)
   */
  async fetch_power_plants() {
    try {
      let powerPlants: PowerPlant[];

      // Check cache first
      if (existsSync(config.powerPlantsCachePath)) {
        const cached = JSON.parse(readFileSync(config.powerPlantsCachePath, 'utf-8'));
        powerPlants = z.array(PowerPlantSchema).parse(cached);
        console.log(`[TOOL] fetch_power_plants → ${powerPlants.length} from cache`);
      } else {
        // Fetch from API
        const response = await retry(async () => {
          const res = await fetch(config.powerPlantsUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        });

        // Validate and transform response
        const validated = PowerPlantsResponseSchema.parse(response);

        // Transform object to array with coordinates
        powerPlants = Object.entries(validated.power_plants).map(([city, data]) => {
          const coords = getCityCoordinates(city);
          if (!coords) {
            throw new Error(`No coordinates found for city: ${city}`);
          }

          return {
            city,
            code: data.code,
            lat: coords.lat,
            lon: coords.lon,
            is_active: data.is_active,
            power: data.power
          };
        });

        // Save to cache
        writeFileSync(
          config.powerPlantsCachePath,
          JSON.stringify(powerPlants, null, 2)
        );

        console.log(`[TOOL] fetch_power_plants → ${powerPlants.length} from API (cached)`);
      }

      return JSON.stringify({
        success: true,
        count: powerPlants.length,
        powerPlants: powerPlants
      });
    } catch (error: any) {
      console.error('[TOOL] fetch_power_plants ERROR:', error.message);
      return JSON.stringify({
        success: false,
        error: `Nie można pobrać elektrowni: ${error.message}`
      });
    }
  },

  /**
   * Get person locations from API
   */
  async get_person_locations(args: { name: string; surname: string }) {
    try {
      const { name, surname } = args;

      const response = await retry(async () => {
        const res = await fetch(config.locationApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apikey: config.hubToken,
            name,
            surname
          })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      });

      // API returns array directly
      const validated = LocationResponseSchema.parse(response);

      console.log(
        `[TOOL] get_person_locations(${name} ${surname}) → ${validated.length} locations`
      );

      return JSON.stringify({
        success: true,
        count: validated.length,
        coordinates: validated
      });
    } catch (error: any) {
      console.error('[TOOL] get_person_locations ERROR:', error.message);
      return JSON.stringify({
        success: false,
        error: `Nie można pobrać lokalizacji dla ${args.name} ${args.surname}: ${error.message}`
      });
    }
  },

  /**
   * Calculate distance using Haversine
   */
  async calculate_distance(args: {
    lat1: number;
    lon1: number;
    lat2: number;
    lon2: number;
  }) {
    try {
      const { lat1, lon1, lat2, lon2 } = args;
      const distance = calculateHaversine(lat1, lon1, lat2, lon2);

      console.log(
        `[TOOL] calculate_distance(${lat1},${lon1} → ${lat2},${lon2}) → ${distance} km`
      );

      return JSON.stringify({
        success: true,
        distance: distance,
        unit: 'km'
      });
    } catch (error: any) {
      console.error('[TOOL] calculate_distance ERROR:', error.message);
      return JSON.stringify({
        success: false,
        error: `Błąd obliczania odległości: ${error.message}`
      });
    }
  },

  /**
   * Get access level for person
   */
  async get_access_level(args: {
    name: string;
    surname: string;
    birthYear: number;
  }) {
    try {
      const { name, surname, birthYear } = args;

      const response = await retry(async () => {
        const res = await fetch(config.accessLevelApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apikey: config.hubToken,
            name,
            surname,
            birthYear
          })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      });

      const validated = AccessLevelResponseSchema.parse(response);

      console.log(
        `[TOOL] get_access_level(${name} ${surname}, ${birthYear}) → level ${validated.accessLevel}`
      );

      return JSON.stringify({
        success: true,
        level: validated.accessLevel,
        accessLevel: validated.accessLevel
      });
    } catch (error: any) {
      console.error('[TOOL] get_access_level ERROR:', error.message);
      return JSON.stringify({
        success: false,
        error: `Nie można pobrać poziomu dostępu dla ${args.name} ${args.surname}: ${error.message}`
      });
    }
  },

  /**
   * Submit final answer to Hub
   */
  async submit_answer(args: {
    name: string;
    surname: string;
    accessLevel: number;
    powerPlant: string;
  }) {
    try {
      const { name, surname, accessLevel, powerPlant } = args;

      console.log(
        `[TOOL] submit_answer(${name} ${surname}, level=${accessLevel}, plant=${powerPlant})`
      );

      const response = await retry(async () => {
        const payload = {
          task: 'findhim',
          apikey: config.hubToken,
          answer: {
            name,
            surname,
            accessLevel,
            powerPlant
          }
        };

        console.log('[TOOL] submit_answer payload:', JSON.stringify(payload, null, 2));

        const res = await fetch(config.verifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const responseText = await res.text();
        console.log('[TOOL] submit_answer response:', responseText);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${responseText}`);
        }

        return JSON.parse(responseText);
      });

      const validated = VerifyResponseSchema.parse(response);

      console.log(`[TOOL] submit_answer → code=${validated.code}, message=${validated.message}`);

      if (validated.flag) {
        console.log(`🎉 FLAG RECEIVED: ${validated.flag}`);
      }

      return JSON.stringify({
        success: validated.code === 0,
        code: validated.code,
        message: validated.message,
        flag: validated.flag
      });
    } catch (error: any) {
      console.error('[TOOL] submit_answer ERROR:', error.message);
      return JSON.stringify({
        success: false,
        error: `Błąd wysyłania odpowiedzi: ${error.message}`
      });
    }
  }
};

/**
 * Execute tool call by name
 */
export async function executeToolCall(toolCall: {
  id: string;
  function: { name: string; arguments: string };
}): Promise<string> {
  const { name, arguments: argsStr } = toolCall.function;

  const handler = toolHandlers[name];
  if (!handler) {
    return JSON.stringify({
      success: false,
      error: `Unknown tool: ${name}`
    });
  }

  try {
    const args = argsStr ? JSON.parse(argsStr) : {};
    return await handler(args);
  } catch (error: any) {
    console.error(`[TOOL] ${name} execution error:`, error.message);
    return JSON.stringify({
      success: false,
      error: `Tool execution failed: ${error.message}`
    });
  }
}
