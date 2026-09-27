import { ROLE } from '@cio/utils/constants';

export type NcctMemberAccess = {
  institutionId: string;
  profileId: string;
  active: boolean;
};

export type NcctTraineeAccess = {
  institutionId: string;
  profileId: string | null;
};

export function canAccessNcctInstitution(
  members: NcctMemberAccess[],
  institutionId: string,
  actorProfileId?: string,
  orgRole?: number
) {
  if (orgRole !== ROLE.TUTOR || !actorProfileId) return true;
  return members.some(
    (member) => member.institutionId === institutionId && member.profileId === actorProfileId && member.active
  );
}

export function canAccessNcctTrainee(
  trainee: NcctTraineeAccess,
  members: NcctMemberAccess[],
  actorProfileId?: string,
  orgRole?: number
) {
  if (orgRole === ROLE.STUDENT) return Boolean(actorProfileId && trainee.profileId === actorProfileId);
  return canAccessNcctInstitution(members, trainee.institutionId, actorProfileId, orgRole);
}
