import {
  DEST_LIST_KEY,
  DEST_LIST_TTL,
  DEST_CONTENT_KEY,
  DEST_CONTENT_TTL,
  DEST_ATTRACTIONS_KEY,
  DEST_ATTRACTIONS_TTL,
  DEST_FOOD_KEY,
  DEST_FOOD_TTL,
  DEST_MAP_KEY,
  DEST_MAP_TTL,
  PLAN_KEY,
  PLAN_TTL,
  PRICE_KEY,
  PRICE_TTL,
  WEATHER_KEY,
  WEATHER_TTL,
} from '../../src/cache/cache.constants';

describe('cache.constants', () => {
  it('DEST_LIST_KEY is a string constant', () => {
    expect(typeof DEST_LIST_KEY).toBe('string');
    expect(DEST_LIST_KEY).toBe('dest:list');
  });

  it('DEST_LIST_TTL is 300 seconds', () => {
    expect(DEST_LIST_TTL).toBe(300);
  });

  it('DEST_CONTENT_KEY generates keyed string', () => {
    expect(DEST_CONTENT_KEY('paris')).toBe('dest:paris:content');
  });

  it('DEST_CONTENT_TTL is 21600 seconds', () => {
    expect(DEST_CONTENT_TTL).toBe(21600);
  });

  it('DEST_ATTRACTIONS_KEY generates keyed string', () => {
    expect(DEST_ATTRACTIONS_KEY('paris')).toBe('dest:paris:attractions');
  });

  it('DEST_FOOD_KEY generates keyed string', () => {
    expect(DEST_FOOD_KEY('paris')).toBe('dest:paris:food-spots');
  });

  it('DEST_MAP_KEY generates keyed string', () => {
    expect(DEST_MAP_KEY('paris')).toBe('dest:paris:map-data');
  });

  it('PLAN_KEY generates keyed string', () => {
    expect(PLAN_KEY('plan-1')).toBe('plan:plan-1');
  });

  it('PRICE_KEY generates keyed string', () => {
    expect(PRICE_KEY('dest-1', 'VNO')).toBe('price:dest-1:VNO');
  });

  it('WEATHER_KEY generates keyed string', () => {
    expect(WEATHER_KEY('paris')).toBe('weather:paris');
  });

  it('TTL values are positive numbers', () => {
    expect(DEST_ATTRACTIONS_TTL).toBe(604800);
    expect(DEST_FOOD_TTL).toBe(604800);
    expect(DEST_MAP_TTL).toBe(604800);
    expect(PLAN_TTL).toBe(21600);
    expect(PRICE_TTL).toBe(1800);
    expect(WEATHER_TTL).toBe(1800);
  });
});
