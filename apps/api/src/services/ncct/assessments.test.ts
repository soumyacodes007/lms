import { describe, expect, it } from 'vitest';
import { assertNcctAssessmentResultAllowed } from './assessments';

describe('NCCT assessment results', () => {
  it('allows an assigned tutor to submit a scheduled result', () => {
    expect(() => assertNcctAssessmentResultAllowed('SCHEDULED', 'SUBMITTED', 'tutor-1', 'tutor-1', 2)).not.toThrow();
  });

  it('locks final results and rejects another evaluator', () => {
    expect(() => assertNcctAssessmentResultAllowed('PASSED', 'FAILED', 'tutor-1', 'tutor-1', 2)).toThrowError(
      'This assessment result is already final'
    );
    expect(() => assertNcctAssessmentResultAllowed('SCHEDULED', 'PASSED', 'tutor-1', 'tutor-2', 2)).toThrowError(
      'Only the assigned evaluator can submit this assessment'
    );
  });
});
