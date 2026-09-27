import {
  addNcctProgrammeStep,
  applyToNcctJob,
  createNcctBatch,
  createNcctAssessment,
  createNcctCareerMessage,
  createNcctInstitution,
  createNcctJob,
  createNcctNomination,
  createNcctProgramme,
  createNcctResource,
  createNcctSession,
  createNcctSyncDevice,
  createNcctTrainee,
  countNcctApprovedNominations,
  decideNcctNomination,
  getNcctDashboardSummary,
  getNcctNomination,
  getNcctProgrammeProgress,
  issueNcctCredential,
  listNcctAssessments,
  listNcctBatches,
  listNcctInstitutions,
  listNcctJobs,
  listNcctJobApplications,
  listNcctProgrammeSteps,
  listNcctProgrammes,
  listNcctNominations,
  listNcctResources,
  listNcctSessions,
  listNcctTrainees,
  listNcctCredentials,
  listNcctCareerMessages,
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
  TNcctCareerChat,
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
  const [
    summary,
    institutions,
    trainees,
    programmes,
    batches,
    jobs,
    sessions,
    resources,
    nominations,
    credentials,
    applications,
    assessments
  ] = await Promise.all([
    getNcctDashboardSummary(organizationId),
    listNcctInstitutions(organizationId),
    listNcctTrainees(organizationId),
    listNcctProgrammes(organizationId),
    listNcctBatches(organizationId),
    listNcctJobs(organizationId),
    listNcctSessions(organizationId),
    listNcctResources(organizationId),
    listNcctNominations(organizationId),
    listNcctCredentials(organizationId),
    listNcctJobApplications(organizationId),
    listNcctAssessments(organizationId)
  ]);

  return {
    summary,
    institutions,
    trainees,
    programmes,
    batches,
    jobs,
    sessions: sessions.map(({ session }) => session),
    resources: resources.map(({ resource }) => resource),
    nominations,
    credentials,
    applications,
    assessments: assessments.map(({ assessment }) => assessment)
  };
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

export async function getProgrammeProgress(organizationId: string, programmeId: string, traineeId: string) {
  const [programme, trainee] = await Promise.all([
    listNcctProgrammes(organizationId).then((programmes) => programmes.find((item) => item.id === programmeId)),
    listNcctTrainees(organizationId).then((trainees) => trainees.find((item) => item.id === traineeId))
  ]);

  if (!programme) throw new AppError('Programme does not belong to this organization', 'NCCT_PROGRAMME_NOT_FOUND', 404);
  if (!trainee) throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);

  return getNcctProgrammeProgress(programmeId, trainee.profileId);
}

export async function scheduleNcctBatch(organizationId: string, data: TCreateNcctBatch) {
  const institutions = await listNcctInstitutions(organizationId);
  if (!institutions.some((institution) => institution.id === data.institutionId)) {
    throw new AppError('Institution does not belong to this organization', 'NCCT_INSTITUTION_NOT_FOUND', 404);
  }

  return createNcctBatch({ ...data, status: 'OPEN' });
}

export async function submitNcctNomination(organizationId: string, profileId: string, data: TCreateNcctNomination) {
  const trainees = await listNcctTrainees(organizationId);
  if (!trainees.some((trainee) => trainee.id === data.traineeId)) {
    throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  }

  return createNcctNomination({ ...data, nominatedByProfileId: profileId });
}

export async function decideNomination(
  organizationId: string,
  nominationId: string,
  profileId: string,
  data: TDecideNcctNomination
) {
  const row = await getNcctNomination(organizationId, nominationId);
  if (!row) throw new AppError('Nomination does not belong to this organization', 'NCCT_NOMINATION_NOT_FOUND', 404);
  if (row.nomination.status !== 'PENDING') {
    throw new AppError('Only pending nominations can be decided', 'NCCT_NOMINATION_ALREADY_DECIDED', 409);
  }

  if (data.status === 'APPROVED') {
    const approved = await countNcctApprovedNominations(row.batch.id);
    if (approved >= row.batch.capacity) {
      throw new AppError('This batch has no available seats', 'NCCT_BATCH_CAPACITY_REACHED', 409);
    }
  }

  return decideNcctNomination(nominationId, data.status, profileId, data.decisionNote);
}

export async function createEmploymentJob(organizationId: string, profileId: string, data: TCreateNcctJob) {
  return createNcctJob({ ...data, organizationId, createdByProfileId: profileId, status: 'OPEN' });
}

export async function submitJobApplication(organizationId: string, jobId: string, data: TApplyToNcctJob) {
  const [job, trainee] = await Promise.all([
    listNcctJobs(organizationId).then((jobs) => jobs.find((item) => item.id === jobId)),
    listNcctTrainees(organizationId).then((trainees) => trainees.find((item) => item.id === data.traineeId))
  ]);
  if (!job) throw new AppError('Job does not belong to this organization', 'NCCT_JOB_NOT_FOUND', 404);
  if (!trainee) throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);

  return applyToNcctJob({ ...data, jobId });
}

async function getNcctCareerTrainee(organizationId: string, traineeId: string) {
  const trainee = (await listNcctTrainees(organizationId)).find((item) => item.id === traineeId);
  if (!trainee) throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  return trainee;
}

export async function getCareerSnapshot(organizationId: string, traineeId: string) {
  const trainee = await getNcctCareerTrainee(organizationId, traineeId);
  const [jobs, credentials, messages] = await Promise.all([
    listNcctJobs(organizationId),
    listNcctCredentials(organizationId),
    listNcctCareerMessages(traineeId)
  ]);
  const traineeSkills = new Set(trainee.skills.map((skill) => skill.trim().toLowerCase()));
  const matchedJobs = jobs
    .filter((job) => job.status === 'OPEN')
    .map((job) => ({
      job,
      matchedSkills: job.skills.filter((skill) => traineeSkills.has(skill.trim().toLowerCase()))
    }))
    .filter(({ matchedSkills }) => matchedSkills.length > 0);

  return {
    trainee,
    skills: trainee.skills,
    credentialCount: credentials.filter(({ credential }) => credential.traineeId === traineeId).length,
    matchedJobs,
    messages
  };
}

export async function chatCareer(organizationId: string, traineeId: string, data: TNcctCareerChat) {
  const trainee = await getNcctCareerTrainee(organizationId, traineeId);
  await createNcctCareerMessage({ traineeId, role: 'USER', message: data.message });
  const snapshot = await getCareerSnapshot(organizationId, traineeId);
  const assistantMessage =
    snapshot.matchedJobs.length > 0
      ? `You have ${snapshot.matchedJobs.length} matching open ${snapshot.matchedJobs.length === 1 ? 'role' : 'roles'}. Start with ${snapshot.matchedJobs[0]!.job.title}; your matching skills are ${snapshot.matchedJobs[0]!.matchedSkills.join(', ')}.`
      : trainee.skills.length > 0
        ? `Your current skills are ${trainee.skills.join(', ')}. No open role matches them yet. Add more verified skills through your training programme and check the exchange again.`
        : 'Add your skills to your trainee profile to get personalised job matches.';
  await createNcctCareerMessage({ traineeId, role: 'ASSISTANT', message: assistantMessage });
  return getCareerSnapshot(organizationId, traineeId);
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

export async function issueCredential(organizationId: string, data: TIssueNcctCredential) {
  const [trainees, programmes, batches, assessments] = await Promise.all([
    listNcctTrainees(organizationId),
    listNcctProgrammes(organizationId),
    listNcctBatches(organizationId),
    listNcctAssessments(organizationId)
  ]);
  if (!trainees.some((trainee) => trainee.id === data.traineeId)) {
    throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  }
  const programme = programmes.find((item) => item.id === data.programmeId);
  if (!programme) throw new AppError('Programme does not belong to this organization', 'NCCT_PROGRAMME_NOT_FOUND', 404);
  const batch = batches.find((item) => item.id === data.batchId);
  if (!batch) throw new AppError('Batch does not belong to this organization', 'NCCT_BATCH_NOT_FOUND', 404);
  if (batch.programmeId !== data.programmeId) {
    throw new AppError('Batch does not belong to the selected programme', 'NCCT_BATCH_PROGRAMME_MISMATCH', 409);
  }
  const passed = assessments.some(
    ({ assessment }) =>
      assessment.traineeId === data.traineeId && assessment.batchId === data.batchId && assessment.status === 'PASSED'
  );
  if (!passed)
    throw new AppError('A passed assessment is required before issuing a credential', 'NCCT_ASSESSMENT_REQUIRED', 409);

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
