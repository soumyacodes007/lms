import {
  addNcctProgrammeStep,
  applyToNcctJob,
  createNcctBatch,
  createNcctAssessment,
  createNcctAuditEvent,
  createNcctCareerMessage,
  createNcctInstitution,
  createNcctJob,
  createNcctNomination,
  createNcctProgramme,
  createNcctResource,
  createNcctSession,
  createNcctSyncDevice,
  createNcctTrainee,
  decideNcctNominationAndEnroll,
  getNcctDashboardSummary,
  getNcctNomination,
  getNcctProgrammeProgress,
  getNcctSyncDevice,
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
  listNcctEnrollments,
  listNcctCareerMessages,
  listNcctAuditEvents,
  listNcctEnrollmentProgress,
  markNcctEnrollmentCompleted,
  searchNcctCertifiedTrainees,
  upsertNcctEnrollmentProgress,
  bookNcctResource,
  recordNcctSyncEvents,
  revokeNcctCredential,
  saveNcctTraineeLogistics,
  submitNcctAssessment as submitNcctAssessmentQuery,
  updateNcctSyncEventStatus,
  updateNcctJobApplication
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
  TSaveNcctTraineeLogistics,
  TUpdateNcctProgress,
  TUpdateNcctJobApplication
} from '@cio/utils/validation/ncct';
import { ZCreateNcctNomination } from '@cio/utils/validation/ncct';
import { AppError } from '@api/utils/errors';
import { randomUUID } from 'node:crypto';

async function recordNcctAudit(data: {
  organizationId: string;
  institutionId?: string | null;
  actorProfileId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await createNcctAuditEvent({ ...data, metadata: data.metadata ?? {} });
  } catch (error) {
    console.error('NCCT audit event failed', error);
  }
}

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
    assessments,
    enrollments,
    auditEvents
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
    listNcctAssessments(organizationId),
    listNcctEnrollments(organizationId),
    listNcctAuditEvents(organizationId)
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
    assessments: assessments.map(({ assessment }) => assessment),
    enrollments,
    auditEvents,
    reports: {
      traineesByState: Object.entries(
        trainees.reduce<Record<string, number>>((counts, trainee) => {
          counts[trainee.state] = (counts[trainee.state] ?? 0) + 1;
          return counts;
        }, {})
      )
        .map(([state, total]) => ({ state, total }))
        .sort((a, b) => b.total - a.total || a.state.localeCompare(b.state)),
      nominationsByStatus: Object.entries(
        nominations.reduce<Record<string, number>>((counts, row) => {
          counts[row.nomination.status] = (counts[row.nomination.status] ?? 0) + 1;
          return counts;
        }, {})
      ).map(([status, total]) => ({ status, total })),
      batchesByStatus: Object.entries(
        batches.reduce<Record<string, number>>((counts, batch) => {
          counts[batch.status] = (counts[batch.status] ?? 0) + 1;
          return counts;
        }, {})
      ).map(([status, total]) => ({ status, total })),
      placements: {
        applications: applications.length,
        shortlisted: applications.filter(({ application }) => application.status === 'SHORTLISTED').length,
        selected: applications.filter(({ application }) => application.status === 'SELECTED').length,
        openJobs: jobs.filter((job) => job.status === 'OPEN').length
      }
    }
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

export async function submitNcctNomination(
  organizationId: string,
  profileId: string | null | undefined,
  data: TCreateNcctNomination
) {
  const [trainees, batches] = await Promise.all([listNcctTrainees(organizationId), listNcctBatches(organizationId)]);
  const trainee = trainees.find((item) => item.id === data.traineeId);
  const batch = batches.find((item) => item.id === data.batchId);
  if (!trainee) {
    throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  }
  if (!batch) throw new AppError('Batch does not belong to this organization', 'NCCT_BATCH_NOT_FOUND', 404);
  if (trainee.institutionId !== batch.institutionId) {
    throw new AppError('Trainee and batch must belong to the same institution', 'NCCT_INSTITUTION_MISMATCH', 409);
  }

  const nomination = await createNcctNomination({ ...data, nominatedByProfileId: profileId ?? null });
  await recordNcctAudit({
    organizationId,
    actorProfileId: profileId,
    action: 'NOMINATION_SUBMITTED',
    entityType: 'nomination',
    entityId: nomination.id,
    metadata: { batchId: nomination.batchId, traineeId: nomination.traineeId, offline: !profileId }
  });
  return nomination;
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

  try {
    const result = await decideNcctNominationAndEnroll(nominationId, data.status, profileId, data.decisionNote);
    await recordNcctAudit({
      organizationId,
      actorProfileId: profileId,
      institutionId: row.institution.id,
      action: `NOMINATION_${data.status}`,
      entityType: 'nomination',
      entityId: nominationId,
      metadata: { batchId: row.batch.id, traineeId: row.trainee.id, enrolled: Boolean(result.enrollment) }
    });
    return result;
  } catch (error) {
    if (error instanceof Error && error.message === 'BATCH_CAPACITY_REACHED') {
      throw new AppError('This batch has no available seats', 'NCCT_BATCH_CAPACITY_REACHED', 409);
    }
    if (error instanceof Error && error.message === 'NOMINATION_ALREADY_DECIDED') {
      throw new AppError('Only pending nominations can be decided', 'NCCT_NOMINATION_ALREADY_DECIDED', 409);
    }
    throw error;
  }
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

export async function updateJobApplication(
  organizationId: string,
  applicationId: string,
  data: TUpdateNcctJobApplication
) {
  const application = (await listNcctJobApplications(organizationId)).find(
    ({ application: item }) => item.id === applicationId
  );
  if (!application) {
    throw new AppError('Job application does not belong to this organization', 'NCCT_APPLICATION_NOT_FOUND', 404);
  }
  const updated = await updateNcctJobApplication(applicationId, data.status);
  await recordNcctAudit({
    organizationId,
    action: `APPLICATION_${data.status}`,
    entityType: 'job_application',
    entityId: applicationId,
    metadata: { jobId: application.job.id, traineeId: application.trainee.id }
  });
  return updated;
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

async function getNcctEnrollment(organizationId: string, enrollmentId: string) {
  const enrollment = (await listNcctEnrollments(organizationId)).find(
    ({ enrollment: item }) => item.id === enrollmentId
  );
  if (!enrollment) {
    throw new AppError('Enrolment does not belong to this organization', 'NCCT_ENROLLMENT_NOT_FOUND', 404);
  }
  return enrollment;
}

export async function getEnrollmentProgress(organizationId: string, enrollmentId: string) {
  const enrollment = await getNcctEnrollment(organizationId, enrollmentId);
  const [steps, saved] = await Promise.all([
    listNcctProgrammeSteps(enrollment.batch.programmeId),
    listNcctEnrollmentProgress(enrollmentId)
  ]);
  const savedByStep = new Map(saved.map(({ progress }) => [progress.programmeStepId, progress]));
  const completedSteps = new Set(
    saved.filter(({ progress }) => progress.status === 'COMPLETED').map(({ progress }) => progress.programmeStepId)
  );

  return {
    enrollment,
    steps: steps.map((step) => ({
      step,
      progress: savedByStep.get(step.id) ?? null,
      status: savedByStep.get(step.id)?.status ?? 'NOT_STARTED',
      available: !step.prerequisiteStepId || completedSteps.has(step.prerequisiteStepId)
    }))
  };
}

export async function updateEnrollmentProgress(
  organizationId: string,
  enrollmentId: string,
  data: TUpdateNcctProgress
) {
  const enrollment = await getNcctEnrollment(organizationId, enrollmentId);
  const steps = await listNcctProgrammeSteps(enrollment.batch.programmeId);
  const step = steps.find((item) => item.id === data.programmeStepId);
  if (!step) throw new AppError('Programme step does not belong to this batch', 'NCCT_STEP_NOT_FOUND', 404);

  if (data.status !== 'NOT_STARTED' && step.prerequisiteStepId) {
    const saved = await listNcctEnrollmentProgress(enrollmentId);
    const prerequisite = saved.find(({ progress }) => progress.programmeStepId === step.prerequisiteStepId);
    if (prerequisite?.progress.status !== 'COMPLETED') {
      throw new AppError('Complete the prerequisite step first', 'NCCT_PREREQUISITE_REQUIRED', 409);
    }
  }

  const progress = await upsertNcctEnrollmentProgress({
    enrollmentId,
    programmeStepId: data.programmeStepId,
    status: data.status,
    score: data.score
  });

  if (data.status === 'COMPLETED') {
    const updated = await getEnrollmentProgress(organizationId, enrollmentId);
    const complete = updated.steps
      .filter(({ step: item }) => item.required)
      .every(({ status }) => status === 'COMPLETED');
    if (complete && enrollment.enrollment.status === 'ENROLLED') await markNcctEnrollmentCompleted(enrollmentId);
  }

  return { progress, ...(await getEnrollmentProgress(organizationId, enrollmentId)) };
}

export async function searchCertifiedTrainees(organizationId: string, search?: string) {
  return searchNcctCertifiedTrainees(organizationId, search);
}

export async function getAuditEvents(organizationId: string) {
  return listNcctAuditEvents(organizationId);
}

export async function scheduleAssessment(organizationId: string, data: TCreateNcctAssessment) {
  const trainees = await listNcctTrainees(organizationId);
  if (!trainees.some((trainee) => trainee.id === data.traineeId)) {
    throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  }

  return createNcctAssessment(data);
}

export async function submitAssessment(
  organizationId: string,
  assessmentId: string,
  data: TSubmitNcctAssessment,
  actorProfileId?: string
) {
  const existing = (await listNcctAssessments(organizationId)).find(({ assessment }) => assessment.id === assessmentId);
  if (!existing)
    throw new AppError('Assessment does not belong to this organization', 'NCCT_ASSESSMENT_NOT_FOUND', 404);
  const assessment = await submitNcctAssessmentQuery(assessmentId, data);
  await recordNcctAudit({
    organizationId,
    actorProfileId,
    action: `ASSESSMENT_${data.status}`,
    entityType: 'assessment',
    entityId: assessmentId,
    metadata: { batchId: existing.assessment.batchId, traineeId: existing.assessment.traineeId }
  });
  return assessment;
}

export async function issueCredential(organizationId: string, data: TIssueNcctCredential, actorProfileId?: string) {
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

  const credential = await issueNcctCredential({ ...data, certificateNumber, verificationToken });
  const trainee = trainees.find((item) => item.id === data.traineeId);
  await recordNcctAudit({
    organizationId,
    actorProfileId,
    institutionId: trainee?.institutionId,
    action: 'CREDENTIAL_ISSUED',
    entityType: 'credential',
    entityId: credential.id,
    metadata: { traineeId: data.traineeId, programmeId: data.programmeId, batchId: data.batchId }
  });
  return credential;
}

export async function revokeCredential(organizationId: string, credentialId: string, actorProfileId?: string) {
  const credential = (await listNcctCredentials(organizationId)).find(
    ({ credential: item }) => item.id === credentialId
  );
  if (!credential)
    throw new AppError('Credential does not belong to this organization', 'NCCT_CREDENTIAL_NOT_FOUND', 404);
  if (credential.credential.revokedAt) {
    throw new AppError('Credential is already revoked', 'NCCT_CREDENTIAL_ALREADY_REVOKED', 409);
  }
  const revoked = await revokeNcctCredential(credentialId);
  await recordNcctAudit({
    organizationId,
    actorProfileId,
    institutionId: credential.trainee.institutionId,
    action: 'CREDENTIAL_REVOKED',
    entityType: 'credential',
    entityId: credentialId,
    metadata: { traineeId: credential.trainee.id, certificateNumber: credential.credential.certificateNumber }
  });
  return revoked;
}

export async function scheduleSession(organizationId: string, data: TCreateNcctSession) {
  const batches = await listNcctBatches(organizationId);
  const batch = batches.find((item) => item.id === data.batchId);
  if (!batch) {
    throw new AppError('Batch does not belong to this organization', 'NCCT_BATCH_NOT_FOUND', 404);
  }

  const startsOn = new Date(`${batch.startsOn}T00:00:00.000Z`);
  const endsOn = new Date(`${batch.endsOn}T23:59:59.999Z`);
  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(data.endsAt);
  if (startsAt < startsOn || endsAt > endsOn) {
    throw new AppError('Session must be scheduled within the batch dates', 'NCCT_SESSION_OUTSIDE_BATCH', 409);
  }

  try {
    return await createNcctSession(data);
  } catch (error) {
    if (error instanceof Error && error.message === 'SESSION_BATCH_CONFLICT') {
      throw new AppError('This batch already has a session during that time', 'NCCT_SESSION_BATCH_CONFLICT', 409);
    }
    if (error instanceof Error && error.message === 'SESSION_INSTRUCTOR_CONFLICT') {
      throw new AppError('The instructor is already scheduled during that time', 'NCCT_SESSION_INSTRUCTOR_CONFLICT', 409);
    }
    throw error;
  }
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

export async function receiveSyncEvents(organizationId: string, deviceId: string, data: TRecordNcctSyncEvents) {
  const device = await getNcctSyncDevice(organizationId, deviceId);
  if (!device)
    throw new AppError('Sync device does not belong to this organization', 'NCCT_SYNC_DEVICE_NOT_FOUND', 404);

  const received = await recordNcctSyncEvents(deviceId, data.events);
  const acceptedIds = new Set(received.map(({ eventId }) => eventId));
  let acknowledged = 0;
  let conflicts = 0;
  const acknowledgedEventIds: string[] = [];

  for (const event of data.events) {
    if (!acceptedIds.has(event.eventId)) continue;
    try {
      if (event.eventType === 'nomination.submit') {
        const parsed = ZCreateNcctNomination.safeParse(event.payload);
        if (!parsed.success) throw new Error('Invalid nomination payload');
        const trainee = (await listNcctTrainees(organizationId)).find((item) => item.id === parsed.data.traineeId);
        if (!trainee || trainee.institutionId !== device.institutionId) {
          throw new Error('The queued trainee is not assigned to this centre');
        }
        const batch = (await listNcctBatches(organizationId)).find((item) => item.id === parsed.data.batchId);
        if (!batch || batch.institutionId !== device.institutionId) {
          throw new Error('The queued batch is not assigned to this centre');
        }
        await submitNcctNomination(organizationId, null, parsed.data);
      }
      await updateNcctSyncEventStatus(event.eventId, 'ACKNOWLEDGED');
      acknowledged += 1;
      acknowledgedEventIds.push(event.eventId);
    } catch (error) {
      await updateNcctSyncEventStatus(
        event.eventId,
        'CONFLICT',
        error instanceof Error ? error.message : 'Sync event could not be applied'
      );
      conflicts += 1;
    }
  }

  return { received: received.length, acknowledged, conflicts, acknowledgedEventIds };
}

export { listNcctAssessments, listNcctProgrammeSteps };
