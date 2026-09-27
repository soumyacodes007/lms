import { AppError } from '@api/utils/errors';

export function assertNcctJobApplicationAllowed(jobStatus: string, hasExistingApplication: boolean) {
  if (jobStatus !== 'OPEN') {
    throw new AppError('Applications can only be submitted for open vacancies', 'NCCT_JOB_NOT_OPEN', 409);
  }
  if (hasExistingApplication) {
    throw new AppError('This trainee has already applied for the vacancy', 'NCCT_APPLICATION_ALREADY_EXISTS', 409);
  }
}
