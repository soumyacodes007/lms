import { ROLE } from '@cio/utils/constants';
import { describe, expect, it } from 'vitest';
import { canAccessNcctInstitution, canAccessNcctTrainee, type NcctMemberAccess } from './access';

const members: NcctMemberAccess[] = [
  { institutionId: 'centre-a', profileId: 'tutor-a', active: true },
  { institutionId: 'centre-b', profileId: 'tutor-a', active: false },
  { institutionId: 'centre-b', profileId: 'tutor-b', active: true }
];

describe('NCCT access policy', () => {
  it('allows administrators to work across centres', () => {
    expect(canAccessNcctInstitution(members, 'centre-b', 'admin', ROLE.ADMIN)).toBe(true);
  });

  it('limits tutors to active centre memberships', () => {
    expect(canAccessNcctInstitution(members, 'centre-a', 'tutor-a', ROLE.TUTOR)).toBe(true);
    expect(canAccessNcctInstitution(members, 'centre-b', 'tutor-a', ROLE.TUTOR)).toBe(false);
    expect(canAccessNcctInstitution(members, 'centre-b', 'tutor-b', ROLE.TUTOR)).toBe(true);
  });

  it('limits students to their linked trainee profile', () => {
    const trainee = { institutionId: 'centre-a', profileId: 'student-a' };
    expect(canAccessNcctTrainee(trainee, members, 'student-a', ROLE.STUDENT)).toBe(true);
    expect(canAccessNcctTrainee(trainee, members, 'student-b', ROLE.STUDENT)).toBe(false);
  });
});
