import { describe, expect, it } from 'vitest';
import { summarizeNcctApplications } from './application-summary';

describe('NCCT application summaries', () => {
  it('counts the employment pipeline by status', () => {
    expect(
      summarizeNcctApplications([
        { application: { status: 'APPLIED' } },
        { application: { status: 'SHORTLISTED' } },
        { application: { status: 'SHORTLISTED' } },
        { application: { status: 'SELECTED' } }
      ])
    ).toEqual([
      { status: 'APPLIED', total: 1 },
      { status: 'SELECTED', total: 1 },
      { status: 'SHORTLISTED', total: 2 }
    ]);
  });
});
