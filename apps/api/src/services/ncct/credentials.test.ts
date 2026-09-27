import { describe, expect, it } from 'vitest';
import { assertNcctCredentialIssuanceAllowed, assertNcctCredentialPrerequisites } from './credentials';

const candidate = { traineeId: 'trainee-1', programmeId: 'programme-1', batchId: 'batch-1' };

describe('NCCT credentials', () => {
  it('allows issuance when no active matching credential exists', () => {
    expect(() => assertNcctCredentialIssuanceAllowed([], candidate)).not.toThrow();
    expect(() =>
      assertNcctCredentialIssuanceAllowed([{ ...candidate, revokedAt: '2026-09-27T10:00:00.000Z' }], candidate)
    ).not.toThrow();
  });

  it('rejects a duplicate active credential', () => {
    expect(() => assertNcctCredentialIssuanceAllowed([{ ...candidate, revokedAt: null }], candidate)).toThrowError(
      'An active credential already exists for this trainee and batch'
    );
  });

  it('requires programme completion and a passed assessment', () => {
    expect(() => assertNcctCredentialPrerequisites('ENROLLED', true)).toThrowError(
      'Complete the required programme steps before issuing a credential'
    );
    expect(() => assertNcctCredentialPrerequisites('COMPLETED', false)).toThrowError(
      'A passed assessment is required before issuing a credential'
    );
    expect(() => assertNcctCredentialPrerequisites('COMPLETED', true)).not.toThrow();
  });
});
