import { AppError } from '@api/utils/errors';

export function assertNcctBatchProgramme(programmeIds: string[], programmeId: string) {
  if (!programmeIds.includes(programmeId)) {
    throw new AppError('Programme does not belong to this organization', 'NCCT_PROGRAMME_NOT_FOUND', 404);
  }
}

export function assertNcctBatchInstructorRole(role: string, active: boolean) {
  if (role !== 'INSTRUCTOR' || !active) {
    throw new AppError(
      'The instructor must be an active instructor at the selected institution',
      'NCCT_INSTRUCTOR_ACCESS_REQUIRED',
      422
    );
  }
}
