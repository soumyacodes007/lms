import { describe, expect, it } from 'vitest';
import { assertNcctAssessmentResultAllowed, assertNcctAssessmentSlotAvailable } from './assessments';

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

  it('rejects an evaluator or trainee already booked at the same time', () => {
    const assessment = {
      evaluatorProfileId: 'tutor-1',
      traineeId: 'trainee-1',
      batchId: 'batch-1',
      scheduledAt: '2026-09-27T10:00:00.000Z',
      status: 'SCHEDULED'
    };
    expect(() =>
      assertNcctAssessmentSlotAvailable([assessment], {
        evaluatorProfileId: 'tutor-1',
        traineeId: 'trainee-2',
        batchId: 'batch-1',
        scheduledAt: assessment.scheduledAt
      })
    ).toThrowError('The evaluator or trainee is already scheduled at this time');
  });
});
