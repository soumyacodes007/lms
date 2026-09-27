import { AppError } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';

export function assertNcctAssessmentResultAllowed(
  currentStatus: string,
  nextStatus: string,
  evaluatorProfileId: string | null,
  actorProfileId?: string,
  actorRole?: number
) {
  if (actorRole === ROLE.TUTOR && evaluatorProfileId && evaluatorProfileId !== actorProfileId) {
    throw new AppError('Only the assigned evaluator can submit this assessment', 'NCCT_EVALUATOR_ACCESS_REQUIRED', 403);
  }
  if (currentStatus === 'SCHEDULED' && !['SUBMITTED', 'PASSED', 'FAILED'].includes(nextStatus)) {
    throw new AppError('A scheduled assessment needs a result', 'NCCT_ASSESSMENT_TRANSITION_INVALID', 409);
  }
  if (currentStatus === 'SUBMITTED' && !['PASSED', 'FAILED'].includes(nextStatus)) {
    throw new AppError('A submitted assessment must be passed or failed', 'NCCT_ASSESSMENT_TRANSITION_INVALID', 409);
  }
  if (['PASSED', 'FAILED'].includes(currentStatus)) {
    throw new AppError('This assessment result is already final', 'NCCT_ASSESSMENT_RESULT_LOCKED', 409);
  }
}
