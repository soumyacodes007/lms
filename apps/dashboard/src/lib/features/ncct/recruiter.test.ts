import { describe, expect, it } from 'vitest';
import { summarizeRecruiterApplications } from './recruiter';

describe('summarizeRecruiterApplications', () => {
  it('counts the recruiter pipeline states', () => {
    expect(
      summarizeRecruiterApplications([
        { application: { status: 'APPLIED' } },
        { application: { status: 'SHORTLISTED' } },
        { application: { status: 'SELECTED' } },
        { application: { status: 'REJECTED' } }
      ])
    ).toEqual({ total: 4, pending: 1, shortlisted: 1, selected: 1 });
  });

  it('returns an empty summary for a vacancy without applications', () => {
    expect(summarizeRecruiterApplications([])).toEqual({ total: 0, pending: 0, shortlisted: 0, selected: 0 });
  });
});
