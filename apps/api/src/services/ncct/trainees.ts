import { AppError } from '@api/utils/errors';

export function assertNcctTraineeNumberAvailable(traineeNumbers: string[], traineeNumber: string) {
  if (traineeNumbers.includes(traineeNumber.trim())) {
    throw new AppError(
      'The trainee number is already registered in this organization',
      'NCCT_TRAINEE_NUMBER_EXISTS',
      409
    );
  }
}
