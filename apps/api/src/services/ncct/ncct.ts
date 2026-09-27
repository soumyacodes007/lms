import {
  addNcctProgrammeStep,
  applyToNcctJob,
  createNcctBatch,
  createNcctAssessment,
  createNcctInstitution,
  createNcctJob,
  createNcctNomination,
  createNcctProgramme,
  createNcctResource,
  createNcctSession,
  createNcctSyncDevice,
  createNcctTrainee,
  decideNcctNomination,
  getNcctDashboardSummary,
  issueNcctCredential,
  listNcctAssessments,
  listNcctBatches,
  listNcctInstitutions,
  listNcctJobs,
  listNcctProgrammeSteps,
  listNcctProgrammes,
  listNcctTrainees,
  bookNcctResource,
  recordNcctSyncEvents,
  saveNcctTraineeLogistics,
  submitNcctAssessment as submitNcctAssessmentQuery
} from '@cio/db/queries/ncct';
import type {
  TAddNcctProgrammeStep,
  TApplyToNcctJob,
  TCreateNcctBatch,
  TCreateNcctAssessment,
  TCreateNcctInstitution,
  TCreateNcctJob,
  TCreateNcctNomination,
  TCreateNcctProgramme,
  TCreateNcctTrainee,
  TDecideNcctNomination,
  TIssueNcctCredential,
  TSubmitNcctAssessment,
  TBookNcctResource,
  TCreateNcctResource,
  TCreateNcctSession,
  TCreateNcctSyncDevice,
  TRecordNcctSyncEvents,
  TSaveNcctTraineeLogistics
} from '@cio/utils/validation/ncct';
import { AppError } from '@api/utils/errors';
import { randomUUID } from 'node:crypto';

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

export async function scheduleAssessment(organizationId: string, data: TCreateNcctAssessment) {
  const trainees = await listNcctTrainees(organizationId);
  if (!trainees.some((trainee) => trainee.id === data.traineeId)) {
    throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  }

  return createNcctAssessment(data);
}

export async function submitAssessment(assessmentId: string, data: TSubmitNcctAssessment) {
  return submitNcctAssessmentQuery(assessmentId, data);
}

export async function issueCredential(data: TIssueNcctCredential) {
  const verificationToken = randomUUID().replaceAll('-', '');
  const certificateNumber =
    data.certificateNumber ?? `NCCT-${new Date().getUTCFullYear()}-${verificationToken.slice(0, 10).toUpperCase()}`;

  return issueNcctCredential({ ...data, certificateNumber, verificationToken });
}

export async function scheduleSession(organizationId: string, data: TCreateNcctSession) {
  const batches = await listNcctBatches(organizationId);
  if (!batches.some((batch) => batch.id === data.batchId)) {
    throw new AppError('Batch does not belong to this organization', 'NCCT_BATCH_NOT_FOUND', 404);
  }

  return createNcctSession(data);
}

export async function registerResource(organizationId: string, data: TCreateNcctResource) {
  const institutions = await listNcctInstitutions(organizationId);
  if (!institutions.some((institution) => institution.id === data.institutionId)) {
    throw new AppError('Institution does not belong to this organization', 'NCCT_INSTITUTION_NOT_FOUND', 404);
  }

  return createNcctResource(data);
}

export async function bookResource(data: TBookNcctResource) {
  return bookNcctResource(data);
}

export async function saveTraineeLogistics(data: TSaveNcctTraineeLogistics) {
  return saveNcctTraineeLogistics(data);
}

export async function registerSyncDevice(organizationId: string, data: TCreateNcctSyncDevice) {
  const institutions = await listNcctInstitutions(organizationId);
  if (!institutions.some((institution) => institution.id === data.institutionId)) {
    throw new AppError('Institution does not belong to this organization', 'NCCT_INSTITUTION_NOT_FOUND', 404);
  }

  return createNcctSyncDevice({ ...data, organizationId });
}

export async function receiveSyncEvents(deviceId: string, data: TRecordNcctSyncEvents) {
  return recordNcctSyncEvents(deviceId, data.events);
}

export { listNcctAssessments, listNcctProgrammeSteps };
