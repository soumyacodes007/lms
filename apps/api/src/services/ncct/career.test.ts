import { describe, expect, it } from 'vitest';
import { buildNcctCareerResponse, matchNcctJobs } from './career';

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

  it('answers credential questions with the trainee verification state', () => {
    expect(buildNcctCareerResponse('How do I verify my certificate?', ['dairy'], 1, [])).toContain(
      '1 verified credential'
    );
  });

  it('explains a matching role when the trainee asks about jobs', () => {
    expect(
      buildNcctCareerResponse('Which job should I apply for?', ['dairy'], 0, [
        { job: { title: 'Dairy Operations Assistant' }, matchedSkills: ['dairy'] }
      ])
    ).toContain('Dairy Operations Assistant');
  });

  it('gives a useful next step when no vacancy matches', () => {
    expect(buildNcctCareerResponse('What should I do next?', ['bookkeeping'], 0, [])).toContain(
      'Complete your next programme step'
    );
  });
});
