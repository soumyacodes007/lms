import { AppError } from '@api/utils/errors';

export function assertNcctProgressUpdateAllowed(
  currentStatus: string | undefined,
  nextStatus: string,
  enrollmentStatus: string
) {
  if (enrollmentStatus === 'COMPLETED' && nextStatus !== 'COMPLETED') {
    throw new AppError('Completed enrolments cannot be rolled back', 'NCCT_ENROLLMENT_COMPLETED', 409);
  }
  if (currentStatus === 'COMPLETED' && nextStatus !== 'COMPLETED') {
    throw new AppError('Completed programme steps cannot be rolled back', 'NCCT_PROGRESS_COMPLETED', 409);
  }
}
