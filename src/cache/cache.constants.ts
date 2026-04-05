export const DEST_LIST_KEY = 'dest:list';
export const DEST_LIST_TTL = 300;

export const DEST_CONTENT_KEY = (id: string): string => `dest:${id}:content`;
export const DEST_CONTENT_TTL = 21600;

export const DEST_ATTRACTIONS_KEY = (id: string): string =>
  `dest:${id}:attractions`;
export const DEST_ATTRACTIONS_TTL = 604800;

export const DEST_FOOD_KEY = (id: string): string => `dest:${id}:food-spots`;
export const DEST_FOOD_TTL = 604800;

export const DEST_MAP_KEY = (id: string): string => `dest:${id}:map-data`;
export const DEST_MAP_TTL = 604800;

export const PLAN_KEY = (id: string): string => `plan:${id}`;
export const PLAN_TTL = 21600;

export const PRICE_KEY = (destId: string, hubCode: string): string =>
  `price:${destId}:${hubCode}`;
export const PRICE_TTL = 1800;

export const WEATHER_KEY = (id: string): string => `weather:${id}`;
export const WEATHER_TTL = 1800;
