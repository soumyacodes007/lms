import {
  addNcctProgrammeStep,
  applyToNcctJob,
  createNcctBatch,
  createNcctInstitution,
  createNcctJob,
  createNcctNomination,
  createNcctProgramme,
  createNcctTrainee,
  decideNcctNomination,
  getNcctDashboardSummary,
  listNcctBatches,
  listNcctInstitutions,
  listNcctJobs,
  listNcctProgrammeSteps,
  listNcctProgrammes,
  listNcctTrainees
} from '@cio/db/queries/ncct';
import type {
  TAddNcctProgrammeStep,
  TApplyToNcctJob,
  TCreateNcctBatch,
  TCreateNcctInstitution,
  TCreateNcctJob,
  TCreateNcctNomination,
  TCreateNcctProgramme,
  TCreateNcctTrainee,
  TDecideNcctNomination
} from '@cio/utils/validation/ncct';
import { AppError } from '@api/utils/errors';

export async function getNcctOverview(organizationId: string) {
  const [summary, institutions, trainees, programmes, batches, jobs] = await Promise.all([
    getNcctDashboardSummary(organizationId),
    listNcctInstitutions(organizationId),
    listNcctTrainees(organizationId),
    listNcctProgrammes(organizationId),
    listNcctBatches(organizationId),
    listNcctJobs(organizationId)
  ]);

  return { summary, institutions, trainees, programmes, batches, jobs };
}

export async function registerNcctInstitution(organizationId: string, data: TCreateNcctInstitution) {
  return createNcctInstitution({ ...data, organizationId });
}

export async function registerNcctTrainee(organizationId: string, data: TCreateNcctTrainee) {
  const institutions = await listNcctInstitutions(organizationId);
  if (!institutions.some((institution) => institution.id === data.institutionId)) {
    throw new AppError('Institution does not belong to this organization', 'NCCT_INSTITUTION_NOT_FOUND', 404);
  }

  return createNcctTrainee({ ...data, organizationId });
}

export async function publishNcctProgramme(organizationId: string, data: TCreateNcctProgramme) {
  return createNcctProgramme({ ...data, organizationId, status: 'PUBLISHED', publishedAt: new Date().toISOString() });
}

export async function addProgrammeStep(data: TAddNcctProgrammeStep) {
  return addNcctProgrammeStep(data);
}

export async function scheduleNcctBatch(organizationId: string, data: TCreateNcctBatch) {
  const institutions = await listNcctInstitutions(organizationId);
  if (!institutions.some((institution) => institution.id === data.institutionId)) {
    throw new AppError('Institution does not belong to this organization', 'NCCT_INSTITUTION_NOT_FOUND', 404);
  }

  return createNcctBatch({ ...data, status: 'OPEN' });
}

export async function submitNcctNomination(organizationId: string, data: TCreateNcctNomination) {
  const trainees = await listNcctTrainees(organizationId);
  if (!trainees.some((trainee) => trainee.id === data.traineeId)) {
    throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  }

  return createNcctNomination(data);
}

export async function decideNomination(nominationId: string, profileId: string, data: TDecideNcctNomination) {
  return decideNcctNomination(nominationId, data.status, profileId, data.decisionNote);
}

export async function createEmploymentJob(organizationId: string, profileId: string, data: TCreateNcctJob) {
  return createNcctJob({ ...data, organizationId, createdByProfileId: profileId, status: 'OPEN' });
}

export async function submitJobApplication(jobId: string, data: TApplyToNcctJob) {
  return applyToNcctJob({ ...data, jobId });
}

export { listNcctProgrammeSteps };
