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

export function assertNcctCredentialPrerequisites(enrollmentStatus: string, passedAssessment: boolean) {
  if (enrollmentStatus !== 'COMPLETED') {
    throw new AppError(
      'Complete the required programme steps before issuing a credential',
      'NCCT_COMPLETION_REQUIRED',
      409
    );
  }
  if (!passedAssessment) {
    throw new AppError('A passed assessment is required before issuing a credential', 'NCCT_ASSESSMENT_REQUIRED', 409);
  }
}
