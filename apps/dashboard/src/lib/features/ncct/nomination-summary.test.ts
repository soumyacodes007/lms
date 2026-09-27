import { describe, expect, it } from 'vitest';
import { summarizeNcctNominations } from './nomination-summary';

describe('NCCT nomination summaries', () => {
  it('counts each decision status and sorts the result for stable rendering', () => {
    expect(
      summarizeNcctNominations([
        { nomination: { status: 'PENDING' } },
        { nomination: { status: 'APPROVED' } },
        { nomination: { status: 'PENDING' } },
        { nomination: { status: 'WAITLISTED' } }
      ])
    ).toEqual([
      { status: 'APPROVED', total: 1 },
      { status: 'PENDING', total: 2 },
      { status: 'WAITLISTED', total: 1 }
    ]);
  });
});
