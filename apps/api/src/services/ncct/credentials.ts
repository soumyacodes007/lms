import { AppError } from '@api/utils/errors';

export function assertNcctCredentialIssuanceAllowed(
  credentials: Array<{ traineeId: string; programmeId: string; batchId: string; revokedAt: string | null }>,
  candidate: { traineeId: string; programmeId: string; batchId: string }
) {
  const activeCredential = credentials.some(
    (credential) =>
      credential.revokedAt === null &&
      credential.traineeId === candidate.traineeId &&
      credential.programmeId === candidate.programmeId &&
      credential.batchId === candidate.batchId
  );
  if (activeCredential) {
    throw new AppError(
      'An active credential already exists for this trainee and batch',
      'NCCT_CREDENTIAL_ALREADY_ISSUED',
      409
    );
  }
}
