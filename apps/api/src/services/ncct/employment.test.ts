import { describe, expect, it } from 'vitest';
import { assertNcctJobApplicationAllowed } from './employment';

describe('NCCT job applications', () => {
  it('allows a trainee to apply to an open vacancy once', () => {
    expect(() => assertNcctJobApplicationAllowed('OPEN', false)).not.toThrow();
  });

  it('rejects closed vacancies and duplicate applications', () => {
    expect(() => assertNcctJobApplicationAllowed('CLOSED', false)).toThrowError(
      'Applications can only be submitted for open vacancies'
    );
    expect(() => assertNcctJobApplicationAllowed('OPEN', true)).toThrowError(
      'This trainee has already applied for the vacancy'
    );
  });
});
