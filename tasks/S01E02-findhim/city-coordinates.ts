/**
 * Coordinates for Polish cities where power plants are located
 * Source: Standard geographical data for Polish cities
 */
export const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Zabrze': { lat: 50.3249, lon: 18.7856 },
  'Piotrków Trybunalski': { lat: 51.4056, lon: 19.7031 },
  'Grudziądz': { lat: 53.4836, lon: 18.7536 },
  'Tczew': { lat: 54.0919, lon: 18.7781 },
  'Radom': { lat: 51.4027, lon: 21.1471 },
  'Chelmno': { lat: 53.3481, lon: 18.4253 },
  'Żarnowiec': { lat: 54.7333, lon: 18.1167 }
};

/**
 * Get coordinates for a city
 */
export function getCityCoordinates(cityName: string): { lat: number; lon: number } | null {
  const normalized = cityName.trim();
  return CITY_COORDINATES[normalized] || null;
}
