import { describe, expect, it } from 'vitest';
import { assertNcctBatchInstructorRole, assertNcctBatchProgramme } from './batches';

describe('NCCT batch setup', () => {
  it('requires a programme from the current organization', () => {
    expect(() => assertNcctBatchProgramme(['programme-1'], 'programme-1')).not.toThrow();
    expect(() => assertNcctBatchProgramme(['programme-1'], 'programme-2')).toThrowError(
      'Programme does not belong to this organization'
    );
  });

  it('requires an active instructor member', () => {
    expect(() => assertNcctBatchInstructorRole('INSTRUCTOR', true)).not.toThrow();
    expect(() => assertNcctBatchInstructorRole('EVALUATOR', true)).toThrowError(
      'The instructor must be an active instructor at the selected institution'
    );
  });
});
