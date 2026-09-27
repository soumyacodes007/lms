import { describe, expect, it } from 'vitest';
import { getNcctAssessmentPassRate } from './reports';

describe('NCCT assessment reports', () => {
  it('calculates the pass rate from evaluated assessments only', () => {
    expect(getNcctAssessmentPassRate(['SCHEDULED', 'PASSED', 'FAILED', 'PASSED'])).toBe(67);
  });

  it('returns zero when no assessment has a result', () => {
    expect(getNcctAssessmentPassRate(['SCHEDULED', 'SUBMITTED'])).toBe(0);
  });
});
