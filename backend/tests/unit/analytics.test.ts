import { describe, it, expect } from 'vitest';

describe('Data Honesty & Analytics Null Handling Rule', () => {
  function computeMetricTotal(observations: Array<number | null | undefined>): {
    total: number | null;
    contributingCount: number;
  } {
    let sum: number | null = null;
    let count = 0;

    for (const val of observations) {
      if (val !== null && val !== undefined) {
        sum = (sum ?? 0) + val;
        count += 1;
      }
    }

    return { total: sum, contributingCount: count };
  }

  it('should return null when no observations are recorded (never fake zero)', () => {
    const unrecorded = [null, null, null];
    const result = computeMetricTotal(unrecorded);

    expect(result.total).toBeNull();
    expect(result.contributingCount).toBe(0);
  });

  it('should preserve genuine zero when zero was observed', () => {
    const zeroRecorded = [0];
    const result = computeMetricTotal(zeroRecorded);

    expect(result.total).toBe(0);
    expect(result.contributingCount).toBe(1);
  });

  it('should aggregate only recorded values and ignore unrecorded nulls', () => {
    const mixed = [15, null, 25, null, 10];
    const result = computeMetricTotal(mixed);

    expect(result.total).toBe(50);
    expect(result.contributingCount).toBe(3);
  });
});
