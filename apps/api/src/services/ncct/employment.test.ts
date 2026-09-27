import { describe, expect, it } from 'vitest';
import { assertNcctApplicationTransition, assertNcctJobApplicationAllowed } from './employment';

describe('NCCT job applications', () => {
  it('allows a trainee to apply to an open vacancy once', () => {
    expect(() => assertNcctJobApplicationAllowed('OPEN')).not.toThrow();
  });

  it('rejects closed vacancies and duplicate applications', () => {
    expect(() => assertNcctJobApplicationAllowed('CLOSED')).toThrowError(
      'Applications can only be submitted for open vacancies'
    );
    expect(() => assertNcctJobApplicationAllowed('OPEN', 'APPLIED')).toThrowError(
      'This trainee has already applied for the vacancy'
    );
  });

  it('allows an application to be submitted again after withdrawal', () => {
    expect(() => assertNcctJobApplicationAllowed('OPEN', 'WITHDRAWN')).not.toThrow();
  });

  it('allows a trainee to withdraw only their active application', () => {
    expect(() => assertNcctApplicationTransition('SHORTLISTED', 'WITHDRAWN', 3, true)).not.toThrow();
    expect(() => assertNcctApplicationTransition('SHORTLISTED', 'WITHDRAWN', 3, false)).toThrowError(
      'Students can only update their own applications'
    );
    expect(() => assertNcctApplicationTransition('SELECTED', 'WITHDRAWN', 3, true)).toThrowError(
      'This application can no longer be withdrawn'
    );
  });
});
