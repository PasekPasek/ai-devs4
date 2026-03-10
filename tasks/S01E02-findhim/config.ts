export const config = {
  hubToken: process.env.HUB_AGENTS_TOKEN!,
  powerPlantsUrl: `https://hub.ag3nts.org/data/${process.env.HUB_AGENTS_TOKEN}/findhim_locations.json`,
  locationApiUrl: 'https://hub.ag3nts.org/api/location',
  accessLevelApiUrl: 'https://hub.ag3nts.org/api/accesslevel',
  verifyUrl: 'https://hub.ag3nts.org/verify',
  openRouterToken: process.env.OPEN_ROUTER_TOKEN!,

  // Model selection
  model: 'openai/gpt-5-mini',  // Using gpt-5-mini as per hints for better accuracy

  // Agent limits
  maxIterations: 15,
  apiCallDelayMs: 100,

  // Cache paths
  powerPlantsCachePath: 'tasks/S01E02-findhim/power_plants.json',
  peopleListPath: 'tasks/S01E02-findhim/people-list.csv'
};
