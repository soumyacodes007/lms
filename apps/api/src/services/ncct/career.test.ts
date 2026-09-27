import { describe, expect, it } from 'vitest';
import { matchNcctJobs } from './career';

describe('NCCT career matching', () => {
  it('normalizes skills and ignores closed vacancies', () => {
    const matches = matchNcctJobs(
      [' Dairy ', 'Bookkeeping'],
      [
        { status: 'OPEN', skills: ['dairy', 'Driving'] },
        { status: 'CLOSED', skills: ['Bookkeeping'] }
      ]
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]?.matchedSkills).toEqual(['dairy']);
  });
});
