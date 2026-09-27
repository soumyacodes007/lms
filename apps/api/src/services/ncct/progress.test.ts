import { describe, expect, it } from 'vitest';
import { assertNcctProgressUpdateAllowed } from './progress';

describe('NCCT progress updates', () => {
  it('allows forward progress', () => {
    expect(() => assertNcctProgressUpdateAllowed('IN_PROGRESS', 'COMPLETED', 'ENROLLED')).not.toThrow();
  });

  it('locks completed steps and enrolments', () => {
    expect(() => assertNcctProgressUpdateAllowed('COMPLETED', 'IN_PROGRESS', 'ENROLLED')).toThrowError(
      'Completed programme steps cannot be rolled back'
    );
    expect(() => assertNcctProgressUpdateAllowed('COMPLETED', 'COMPLETED', 'COMPLETED')).not.toThrow();
  });
});
