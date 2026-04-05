import { normalizeToHub } from '../../../src/modules/pricing/hub-lookup';

describe('normalizeToHub', () => {
  it('maps VNO to VNO', () => {
    expect(normalizeToHub('VNO')).toBe('VNO');
  });

  it('maps KUN (Kaunas) to VNO hub', () => {
    expect(normalizeToHub('KUN')).toBe('VNO');
  });

  it('maps WAW (Warsaw) to WAW hub', () => {
    expect(normalizeToHub('WAW')).toBe('WAW');
  });

  it('maps KRK (Krakow) to WAW hub', () => {
    expect(normalizeToHub('KRK')).toBe('WAW');
  });

  it('falls back to VNO for unknown code', () => {
    expect(normalizeToHub('XYZ')).toBe('VNO');
  });

  it('is case-insensitive', () => {
    expect(normalizeToHub('vno')).toBe('VNO');
    expect(normalizeToHub('waw')).toBe('WAW');
  });
});
