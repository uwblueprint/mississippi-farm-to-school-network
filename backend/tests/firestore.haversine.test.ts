import { arraysOverlap, haversineKm } from '@/utilities/firestore';

describe('haversineKm', () => {
  test('returns ~0 for the same point', () => {
    expect(haversineKm(32.3, -90.18, 32.3, -90.18)).toBeLessThan(0.001);
  });

  test('returns a positive distance between Jackson and nearby point', () => {
    const km = haversineKm(32.3, -90.18, 32.35, -90.1);
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(20);
  });
});

describe('arraysOverlap', () => {
  test('detects shared values', () => {
    expect(arraysOverlap(['a', 'b'], ['b', 'c'])).toBe(true);
    expect(arraysOverlap(['a'], ['b'])).toBe(false);
    expect(arraysOverlap([], ['a'])).toBe(false);
  });
});
