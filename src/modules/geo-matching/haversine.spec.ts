// src/modules/geo-matching/haversine.spec.ts
import { haversineDistanceKm } from './haversine';

describe('haversineDistanceKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistanceKm(41.3851, 2.1734, 41.3851, 2.1734)).toBe(0);
  });

  it('returns ~9200 km between Barcelona and Kyoto', () => {
    const dist = haversineDistanceKm(41.3851, 2.1734, 35.0116, 135.7681);
    expect(dist).toBeGreaterThan(10000);
    expect(dist).toBeLessThan(10500);
  });

  it('Sagrada Família is within 5 km of Barcelona center', () => {
    // Sagrada Família: 41.4036, 2.1744
    const dist = haversineDistanceKm(41.3851, 2.1734, 41.4036, 2.1744);
    expect(dist).toBeLessThan(5);
  });

  it('Paris to Versailles is within 30 km', () => {
    // Versailles: 48.8049, 2.1204
    const dist = haversineDistanceKm(48.8566, 2.3522, 48.8049, 2.1204);
    expect(dist).toBeLessThan(30);
  });
});
