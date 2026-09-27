import { AppError } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';

export function assertNcctJobApplicationAllowed(jobStatus: string, existingStatus?: string) {
  if (jobStatus !== 'OPEN') {
    throw new AppError('Applications can only be submitted for open vacancies', 'NCCT_JOB_NOT_OPEN', 409);
  }
  if (existingStatus && existingStatus !== 'WITHDRAWN') {
    throw new AppError('This trainee has already applied for the vacancy', 'NCCT_APPLICATION_ALREADY_EXISTS', 409);
  }
}

export function assertNcctApplicationTransition(
  currentStatus: string,
  nextStatus: string,
  actorRole?: number,
  isOwner = false
) {
  if (actorRole === ROLE.STUDENT) {
    if (!isOwner)
      throw new AppError('Students can only update their own applications', 'NCCT_TRAINEE_ACCESS_REQUIRED', 403);
    if (nextStatus !== 'WITHDRAWN') {
      throw new AppError('Students can only withdraw an application', 'NCCT_APPLICATION_STATUS_FORBIDDEN', 403);
    }
    if (!['APPLIED', 'SHORTLISTED'].includes(currentStatus)) {
      throw new AppError('This application can no longer be withdrawn', 'NCCT_APPLICATION_STATUS_LOCKED', 409);
    }
    return;
  }

  if (currentStatus === 'APPLIED' && !['SHORTLISTED', 'REJECTED'].includes(nextStatus)) {
    throw new AppError(
      'An applied vacancy must be shortlisted or rejected first',
      'NCCT_APPLICATION_TRANSITION_INVALID',
      409
    );
  }
  if (currentStatus === 'SHORTLISTED' && !['SELECTED', 'REJECTED'].includes(nextStatus)) {
    throw new AppError(
      'A shortlisted vacancy must be selected or rejected',
      'NCCT_APPLICATION_TRANSITION_INVALID',
      409
    );
  }
  if (['SELECTED', 'REJECTED', 'WITHDRAWN'].includes(currentStatus)) {
    throw new AppError('This application is already closed', 'NCCT_APPLICATION_STATUS_LOCKED', 409);
  }
}
