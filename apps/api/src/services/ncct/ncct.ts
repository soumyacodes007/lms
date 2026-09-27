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
  listNcctInstitutionMembers,
  listNcctJobs,
  listNcctJobApplications,
  listNcctJobApplicationEvents,
  listNcctProgrammeSteps,
  listNcctProgrammes,
  listNcctNominations,
  listNcctResources,
  listNcctSessions,
  listNcctTrainees,
  updateNcctTrainee as updateNcctTraineeQuery,
  updateNcctInstitutionMember,
  upsertNcctInstitutionMember,
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
  TUpsertNcctInstitutionMember,
  TUpdateNcctInstitutionMember,
  TCreateNcctJob,
  TCreateNcctNomination,
  TCreateNcctProgramme,
  TCreateNcctTrainee,
  TUpdateNcctTrainee,
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
import { ZCreateNcctNomination, ZUpdateNcctProgress } from '@cio/utils/validation/ncct';
import { ROLE } from '@cio/utils/constants';
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

async function assertNcctInstitutionAccess(
  organizationId: string,
  institutionId: string,
  actorProfileId?: string,
  orgRole?: number
) {
  if (orgRole !== ROLE.TUTOR || !actorProfileId) return;

  const institutionMembers = await listNcctInstitutionMembers(organizationId);
  const hasAccess = institutionMembers.some(
    ({ member }) => member.institutionId === institutionId && member.profileId === actorProfileId && member.active
  );
  if (!hasAccess) {
    throw new AppError('You do not have access to this training centre', 'NCCT_CENTRE_ACCESS_REQUIRED', 403);
  }
}

export async function getNcctOverview(organizationId: string, actorProfileId?: string, orgRole?: number) {
  const [
    summary,
    institutions,
    institutionMembers,
    trainees,
    programmes,
    batches,
    jobs,
    sessions,
    resources,
    nominations,
    credentials,
    applications,
    applicationEvents,
    assessments,
    enrollments,
    auditEvents
  ] = await Promise.all([
    getNcctDashboardSummary(organizationId),
    listNcctInstitutions(organizationId),
    listNcctInstitutionMembers(organizationId),
    listNcctTrainees(organizationId),
    listNcctProgrammes(organizationId),
    listNcctBatches(organizationId),
    listNcctJobs(organizationId),
    listNcctSessions(organizationId),
    listNcctResources(organizationId),
    listNcctNominations(organizationId),
    listNcctCredentials(organizationId),
    listNcctJobApplications(organizationId),
    listNcctJobApplicationEvents(organizationId),
    listNcctAssessments(organizationId),
    listNcctEnrollments(organizationId),
    listNcctAuditEvents(organizationId)
  ]);

  const hasTutorScope = orgRole === ROLE.TUTOR && Boolean(actorProfileId);
  const hasStudentScope = orgRole === ROLE.STUDENT && Boolean(actorProfileId);
  const assignedInstitutionIds = hasTutorScope
    ? new Set(
        institutionMembers
          .filter(({ member }) => member.profileId === actorProfileId && member.active)
          .map(({ member }) => member.institutionId)
      )
    : null;
  const tutorCentreIds = assignedInstitutionIds ?? new Set<string>();
  const studentTraineeIds = new Set(
    hasStudentScope
      ? trainees.filter((trainee) => trainee.profileId === actorProfileId).map((trainee) => trainee.id)
      : []
  );
  const studentInstitutionIds = new Set(
    hasStudentScope
      ? trainees.filter((trainee) => studentTraineeIds.has(trainee.id)).map((trainee) => trainee.institutionId)
      : []
  );
  const studentBatchIds = new Set(
    hasStudentScope
      ? enrollments
          .filter(({ enrollment }) => studentTraineeIds.has(enrollment.traineeId))
          .map(({ enrollment }) => enrollment.batchId)
      : []
  );
  const hasScopedView = hasTutorScope || hasStudentScope;
  const visibleInstitutions = hasTutorScope
    ? institutions.filter((institution) => tutorCentreIds.has(institution.id))
    : hasStudentScope
      ? institutions.filter((institution) => studentInstitutionIds.has(institution.id))
      : institutions;
  const visibleTrainees = hasTutorScope
    ? trainees.filter((trainee) => tutorCentreIds.has(trainee.institutionId))
    : hasStudentScope
      ? trainees.filter((trainee) => studentTraineeIds.has(trainee.id))
      : trainees;
  const visibleBatches = hasTutorScope
    ? batches.filter((batch) => tutorCentreIds.has(batch.institutionId))
    : hasStudentScope
      ? batches.filter((batch) => studentBatchIds.has(batch.id))
      : batches;
  const visibleNominations = hasTutorScope
    ? nominations.filter(({ institution }) => tutorCentreIds.has(institution.id))
    : hasStudentScope
      ? nominations.filter(({ trainee }) => studentTraineeIds.has(trainee.id))
      : nominations;
  const visibleSessions = hasScopedView
    ? sessions.filter(({ session }) => visibleBatches.some((batch) => batch.id === session.batchId))
    : sessions;
  const visibleResources = hasTutorScope
    ? resources.filter(({ resource }) => tutorCentreIds.has(resource.institutionId))
    : hasStudentScope
      ? resources.filter(({ resource }) => studentInstitutionIds.has(resource.institutionId))
      : resources;
  const visibleAssessments = hasTutorScope
    ? assessments.filter(({ assessment }) => visibleTrainees.some((trainee) => trainee.id === assessment.traineeId))
    : hasStudentScope
      ? assessments.filter(({ assessment }) => studentTraineeIds.has(assessment.traineeId))
      : assessments;
  const visibleEnrollments = hasTutorScope
    ? enrollments.filter(({ batch }) => tutorCentreIds.has(batch.institutionId))
    : hasStudentScope
      ? enrollments.filter(({ enrollment }) => studentTraineeIds.has(enrollment.traineeId))
      : enrollments;
  const visibleCredentials = hasTutorScope
    ? credentials.filter(({ trainee }) => tutorCentreIds.has(trainee.institutionId))
    : hasStudentScope
      ? credentials.filter(({ trainee }) => studentTraineeIds.has(trainee.id))
      : credentials;
  const visibleApplications = hasTutorScope
    ? applications.filter(({ trainee }) => visibleTrainees.some((item) => item.id === trainee.id))
    : hasStudentScope
      ? applications.filter(({ trainee }) => studentTraineeIds.has(trainee.id))
      : applications;
  const visibleApplicationIds = new Set(visibleApplications.map(({ application }) => application.id));
  const visibleApplicationEvents = hasScopedView
    ? applicationEvents.filter(({ application }) => visibleApplicationIds.has(application.id))
    : applicationEvents;
  const visibleAuditEvents = hasTutorScope
    ? auditEvents.filter((event) => event.institutionId && tutorCentreIds.has(event.institutionId))
    : hasStudentScope
      ? []
      : auditEvents;
  const visibleSummary = hasScopedView
    ? {
        institutions: visibleInstitutions.length,
        trainees: visibleTrainees.length,
        programmes: programmes.length,
        batches: visibleBatches.length,
        pendingNominations: visibleNominations.filter(({ nomination }) => nomination.status === 'PENDING').length,
        credentials: visibleCredentials.length,
        jobs: jobs.length
      }
    : summary;

  return {
    summary: visibleSummary,
    institutions: visibleInstitutions,
    institutionMembers: hasTutorScope
      ? institutionMembers.filter(({ member }) => tutorCentreIds.has(member.institutionId))
      : hasStudentScope
        ? []
        : institutionMembers,
    trainees: visibleTrainees,
    programmes,
    batches: visibleBatches,
    jobs,
    sessions: visibleSessions.map(({ session }) => session),
    resources: visibleResources.map(({ resource }) => resource),
    nominations: visibleNominations,
    credentials: visibleCredentials,
    applications: visibleApplications,
    applicationEvents: visibleApplicationEvents,
    assessments: visibleAssessments.map(({ assessment }) => assessment),
    enrollments: visibleEnrollments,
    auditEvents: visibleAuditEvents,
    reports: {
      traineesByState: Object.entries(
        visibleTrainees.reduce<Record<string, number>>((counts, trainee) => {
          counts[trainee.state] = (counts[trainee.state] ?? 0) + 1;
          return counts;
        }, {})
      )
        .map(([state, total]) => ({ state, total }))
        .sort((a, b) => b.total - a.total || a.state.localeCompare(b.state)),
      nominationsByStatus: Object.entries(
        visibleNominations.reduce<Record<string, number>>((counts, row) => {
          counts[row.nomination.status] = (counts[row.nomination.status] ?? 0) + 1;
          return counts;
        }, {})
      ).map(([status, total]) => ({ status, total })),
      batchesByStatus: Object.entries(
        visibleBatches.reduce<Record<string, number>>((counts, batch) => {
          counts[batch.status] = (counts[batch.status] ?? 0) + 1;
          return counts;
        }, {})
      ).map(([status, total]) => ({ status, total })),
      placements: {
        applications: visibleApplications.length,
        shortlisted: visibleApplications.filter(({ application }) => application.status === 'SHORTLISTED').length,
        selected: visibleApplications.filter(({ application }) => application.status === 'SELECTED').length,
        openJobs: jobs.filter((job) => job.status === 'OPEN').length
      }
    }
  };
}

export async function registerNcctInstitution(organizationId: string, data: TCreateNcctInstitution) {
  return createNcctInstitution({ ...data, organizationId });
}

export async function getNcctInstitutionMembers(organizationId: string) {
  return listNcctInstitutionMembers(organizationId);
}

export async function saveNcctInstitutionMember(
  organizationId: string,
  data: TUpsertNcctInstitutionMember,
  actorProfileId?: string
) {
  const institutions = await listNcctInstitutions(organizationId);
  const institution = institutions.find((item) => item.id === data.institutionId);
  if (!institution)
    throw new AppError('Institution does not belong to this organization', 'NCCT_INSTITUTION_NOT_FOUND', 404);

  const member = await upsertNcctInstitutionMember(data);
  await recordNcctAudit({
    organizationId,
    actorProfileId,
    institutionId: institution.id,
    action: 'INSTITUTION_MEMBER_SAVED',
    entityType: 'institution_member',
    entityId: member.id,
    metadata: { profileId: data.profileId, role: data.role }
  });
  return member;
}

export async function updateNcctInstitutionMemberRole(
  organizationId: string,
  memberId: string,
  data: TUpdateNcctInstitutionMember,
  actorProfileId?: string
) {
  const member = (await listNcctInstitutionMembers(organizationId)).find(({ member: item }) => item.id === memberId);
  if (!member)
    throw new AppError('Institution member does not belong to this organization', 'NCCT_MEMBER_NOT_FOUND', 404);
  const updated = await updateNcctInstitutionMember(memberId, {
    role: data.role ?? member.member.role,
    active: data.active ?? member.member.active
  });
  await recordNcctAudit({
    organizationId,
    actorProfileId,
    institutionId: member.institution.id,
    action: 'INSTITUTION_MEMBER_UPDATED',
    entityType: 'institution_member',
    entityId: memberId,
    metadata: { role: updated.role, active: updated.active }
  });
  return updated;
}

export async function registerNcctTrainee(
  organizationId: string,
  data: TCreateNcctTrainee,
  actorProfileId?: string,
  orgRole?: number
) {
  const institutions = await listNcctInstitutions(organizationId);
  if (!institutions.some((institution) => institution.id === data.institutionId)) {
    throw new AppError('Institution does not belong to this organization', 'NCCT_INSTITUTION_NOT_FOUND', 404);
  }
  await assertNcctInstitutionAccess(organizationId, data.institutionId, actorProfileId, orgRole);

  return createNcctTrainee({ ...data, organizationId });
}

export async function updateNcctTrainee(
  organizationId: string,
  traineeId: string,
  data: TUpdateNcctTrainee,
  actorProfileId?: string,
  orgRole?: number
) {
  const trainee = (await listNcctTrainees(organizationId)).find((item) => item.id === traineeId);
  if (!trainee) throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  await assertNcctInstitutionAccess(organizationId, trainee.institutionId, actorProfileId, orgRole);
  if (data.institutionId) {
    const institutions = await listNcctInstitutions(organizationId);
    if (!institutions.some((institution) => institution.id === data.institutionId)) {
      throw new AppError('Institution does not belong to this organization', 'NCCT_INSTITUTION_NOT_FOUND', 404);
    }
    await assertNcctInstitutionAccess(organizationId, data.institutionId, actorProfileId, orgRole);
  }

  const updated = await updateNcctTraineeQuery(traineeId, data);
  await recordNcctAudit({
    organizationId,
    actorProfileId,
    institutionId: updated.institutionId,
    action: 'TRAINEE_UPDATED',
    entityType: 'trainee',
    entityId: traineeId,
    metadata: { directoryVisible: updated.directoryVisible }
  });
  return updated;
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

export async function scheduleNcctBatch(
  organizationId: string,
  data: TCreateNcctBatch,
  actorProfileId?: string,
  orgRole?: number
) {
  const institutions = await listNcctInstitutions(organizationId);
  if (!institutions.some((institution) => institution.id === data.institutionId)) {
    throw new AppError('Institution does not belong to this organization', 'NCCT_INSTITUTION_NOT_FOUND', 404);
  }
  await assertNcctInstitutionAccess(organizationId, data.institutionId, actorProfileId, orgRole);

  return createNcctBatch({ ...data, status: 'OPEN' });
}

export async function submitNcctNomination(
  organizationId: string,
  profileId: string | null | undefined,
  data: TCreateNcctNomination,
  orgRole?: number
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
  await assertNcctInstitutionAccess(organizationId, batch.institutionId, profileId ?? undefined, orgRole);

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
  data: TDecideNcctNomination,
  orgRole?: number
) {
  const row = await getNcctNomination(organizationId, nominationId);
  if (!row) throw new AppError('Nomination does not belong to this organization', 'NCCT_NOMINATION_NOT_FOUND', 404);
  if (row.nomination.status !== 'PENDING') {
    throw new AppError('Only pending nominations can be decided', 'NCCT_NOMINATION_ALREADY_DECIDED', 409);
  }
  await assertNcctInstitutionAccess(organizationId, row.institution.id, profileId, orgRole);

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

export async function submitJobApplication(
  organizationId: string,
  jobId: string,
  data: TApplyToNcctJob,
  actorProfileId?: string,
  orgRole?: number
) {
  const [job, trainee] = await Promise.all([
    listNcctJobs(organizationId).then((jobs) => jobs.find((item) => item.id === jobId)),
    listNcctTrainees(organizationId).then((trainees) => trainees.find((item) => item.id === data.traineeId))
  ]);
  if (!job) throw new AppError('Job does not belong to this organization', 'NCCT_JOB_NOT_FOUND', 404);
  if (!trainee) throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  if (orgRole === ROLE.STUDENT && trainee.profileId !== actorProfileId) {
    throw new AppError('Students can only apply for themselves', 'NCCT_TRAINEE_ACCESS_REQUIRED', 403);
  }
  await assertNcctInstitutionAccess(organizationId, trainee.institutionId, actorProfileId, orgRole);

  return applyToNcctJob({ ...data, jobId });
}

export async function updateJobApplication(
  organizationId: string,
  applicationId: string,
  data: TUpdateNcctJobApplication,
  actorProfileId?: string,
  orgRole?: number
) {
  const application = (await listNcctJobApplications(organizationId)).find(
    ({ application: item }) => item.id === applicationId
  );
  if (!application) {
    throw new AppError('Job application does not belong to this organization', 'NCCT_APPLICATION_NOT_FOUND', 404);
  }
  await assertNcctInstitutionAccess(organizationId, application.trainee.institutionId, actorProfileId, orgRole);
  const updated = await updateNcctJobApplication(applicationId, data.status, actorProfileId, data.note);
  await recordNcctAudit({
    organizationId,
    actorProfileId,
    action: `APPLICATION_${data.status}`,
    entityType: 'job_application',
    entityId: applicationId,
    metadata: { jobId: application.job.id, traineeId: application.trainee.id }
  });
  return updated;
}

async function getNcctCareerTrainee(
  organizationId: string,
  traineeId: string,
  actorProfileId?: string,
  orgRole?: number
) {
  const trainee = (await listNcctTrainees(organizationId)).find((item) => item.id === traineeId);
  if (!trainee) throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  if (orgRole === ROLE.STUDENT && trainee.profileId !== actorProfileId) {
    throw new AppError('Students can only access their own career profile', 'NCCT_TRAINEE_ACCESS_REQUIRED', 403);
  }
  await assertNcctInstitutionAccess(organizationId, trainee.institutionId, actorProfileId, orgRole);
  return trainee;
}

export async function getCareerSnapshot(
  organizationId: string,
  traineeId: string,
  actorProfileId?: string,
  orgRole?: number
) {
  const trainee = await getNcctCareerTrainee(organizationId, traineeId, actorProfileId, orgRole);
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

export async function chatCareer(
  organizationId: string,
  traineeId: string,
  data: TNcctCareerChat,
  actorProfileId?: string,
  orgRole?: number
) {
  const trainee = await getNcctCareerTrainee(organizationId, traineeId, actorProfileId, orgRole);
  await createNcctCareerMessage({ traineeId, role: 'USER', message: data.message });
  const snapshot = await getCareerSnapshot(organizationId, traineeId, actorProfileId, orgRole);
  const assistantMessage =
    snapshot.matchedJobs.length > 0
      ? `You have ${snapshot.matchedJobs.length} matching open ${snapshot.matchedJobs.length === 1 ? 'role' : 'roles'}. Start with ${snapshot.matchedJobs[0]!.job.title}; your matching skills are ${snapshot.matchedJobs[0]!.matchedSkills.join(', ')}.`
      : trainee.skills.length > 0
        ? `Your current skills are ${trainee.skills.join(', ')}. No open role matches them yet. Add more verified skills through your training programme and check the exchange again.`
        : 'Add your skills to your trainee profile to get personalised job matches.';
  await createNcctCareerMessage({ traineeId, role: 'ASSISTANT', message: assistantMessage });
  return getCareerSnapshot(organizationId, traineeId, actorProfileId, orgRole);
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
  data: TUpdateNcctProgress,
  actorProfileId?: string,
  orgRole?: number
) {
  const enrollment = await getNcctEnrollment(organizationId, enrollmentId);
  await assertNcctInstitutionAccess(organizationId, enrollment.trainee.institutionId, actorProfileId, orgRole);
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

  await recordNcctAudit({
    organizationId,
    actorProfileId,
    institutionId: enrollment.trainee.institutionId,
    action: `PROGRESS_${data.status}`,
    entityType: 'enrollment_progress',
    entityId: progress.id,
    metadata: { enrollmentId, programmeStepId: data.programmeStepId, score: data.score ?? null }
  });

  return { progress, ...(await getEnrollmentProgress(organizationId, enrollmentId)) };
}

export async function searchCertifiedTrainees(organizationId: string, search?: string) {
  return searchNcctCertifiedTrainees(organizationId, search);
}

export async function getAuditEvents(organizationId: string) {
  return listNcctAuditEvents(organizationId);
}

export async function scheduleAssessment(
  organizationId: string,
  data: TCreateNcctAssessment,
  actorProfileId?: string,
  orgRole?: number
) {
  const [trainees, batches, enrollments] = await Promise.all([
    listNcctTrainees(organizationId),
    listNcctBatches(organizationId),
    listNcctEnrollments(organizationId)
  ]);
  const trainee = trainees.find((item) => item.id === data.traineeId);
  if (!trainee) {
    throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  }
  await assertNcctInstitutionAccess(organizationId, trainee.institutionId, actorProfileId, orgRole);
  const batch = batches.find((item) => item.id === data.batchId);
  if (!batch) throw new AppError('Batch does not belong to this organization', 'NCCT_BATCH_NOT_FOUND', 404);
  if (!enrollments.some(({ enrollment }) => enrollment.batchId === batch.id && enrollment.traineeId === trainee.id)) {
    throw new AppError('The trainee must be enrolled in this batch first', 'NCCT_ENROLLMENT_REQUIRED', 409);
  }
  const scheduledAt = new Date(data.scheduledAt);
  if (
    scheduledAt < new Date(`${batch.startsOn}T00:00:00.000Z`) ||
    scheduledAt > new Date(`${batch.endsOn}T23:59:59.999Z`)
  ) {
    throw new AppError('Assessment must be scheduled within the batch dates', 'NCCT_ASSESSMENT_OUTSIDE_BATCH', 409);
  }

  const assessment = await createNcctAssessment(data);
  await recordNcctAudit({
    organizationId,
    actorProfileId,
    institutionId: trainee.institutionId,
    action: 'ASSESSMENT_SCHEDULED',
    entityType: 'assessment',
    entityId: assessment.id,
    metadata: { batchId: batch.id, traineeId: trainee.id, scheduledAt: data.scheduledAt }
  });
  return assessment;
}

export async function submitAssessment(
  organizationId: string,
  assessmentId: string,
  data: TSubmitNcctAssessment,
  actorProfileId?: string,
  orgRole?: number
) {
  const existing = (await listNcctAssessments(organizationId)).find(({ assessment }) => assessment.id === assessmentId);
  if (!existing)
    throw new AppError('Assessment does not belong to this organization', 'NCCT_ASSESSMENT_NOT_FOUND', 404);
  const trainee = (await listNcctTrainees(organizationId)).find((item) => item.id === existing.assessment.traineeId);
  if (!trainee) throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  await assertNcctInstitutionAccess(organizationId, trainee.institutionId, actorProfileId, orgRole);
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

export async function issueCredential(
  organizationId: string,
  data: TIssueNcctCredential,
  actorProfileId?: string,
  orgRole?: number
) {
  const [trainees, programmes, batches, assessments, enrollments] = await Promise.all([
    listNcctTrainees(organizationId),
    listNcctProgrammes(organizationId),
    listNcctBatches(organizationId),
    listNcctAssessments(organizationId),
    listNcctEnrollments(organizationId)
  ]);
  if (!trainees.some((trainee) => trainee.id === data.traineeId)) {
    throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  }
  const trainee = trainees.find((item) => item.id === data.traineeId)!;
  await assertNcctInstitutionAccess(organizationId, trainee.institutionId, actorProfileId, orgRole);
  const programme = programmes.find((item) => item.id === data.programmeId);
  if (!programme) throw new AppError('Programme does not belong to this organization', 'NCCT_PROGRAMME_NOT_FOUND', 404);
  const batch = batches.find((item) => item.id === data.batchId);
  if (!batch) throw new AppError('Batch does not belong to this organization', 'NCCT_BATCH_NOT_FOUND', 404);
  if (batch.programmeId !== data.programmeId) {
    throw new AppError('Batch does not belong to the selected programme', 'NCCT_BATCH_PROGRAMME_MISMATCH', 409);
  }
  if (
    !enrollments.some(({ enrollment }) => enrollment.batchId === batch.id && enrollment.traineeId === data.traineeId)
  ) {
    throw new AppError('The trainee must be enrolled in this batch first', 'NCCT_ENROLLMENT_REQUIRED', 409);
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

export async function revokeCredential(
  organizationId: string,
  credentialId: string,
  actorProfileId?: string,
  orgRole?: number
) {
  const credential = (await listNcctCredentials(organizationId)).find(
    ({ credential: item }) => item.id === credentialId
  );
  if (!credential)
    throw new AppError('Credential does not belong to this organization', 'NCCT_CREDENTIAL_NOT_FOUND', 404);
  if (credential.credential.revokedAt) {
    throw new AppError('Credential is already revoked', 'NCCT_CREDENTIAL_ALREADY_REVOKED', 409);
  }
  await assertNcctInstitutionAccess(organizationId, credential.trainee.institutionId, actorProfileId, orgRole);
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

export async function scheduleSession(
  organizationId: string,
  data: TCreateNcctSession,
  actorProfileId?: string,
  orgRole?: number
) {
  const batches = await listNcctBatches(organizationId);
  const batch = batches.find((item) => item.id === data.batchId);
  if (!batch) {
    throw new AppError('Batch does not belong to this organization', 'NCCT_BATCH_NOT_FOUND', 404);
  }
  await assertNcctInstitutionAccess(organizationId, batch.institutionId, actorProfileId, orgRole);

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
      throw new AppError(
        'The instructor is already scheduled during that time',
        'NCCT_SESSION_INSTRUCTOR_CONFLICT',
        409
      );
    }
    throw error;
  }
}

export async function registerResource(
  organizationId: string,
  data: TCreateNcctResource,
  actorProfileId?: string,
  orgRole?: number
) {
  const institutions = await listNcctInstitutions(organizationId);
  if (!institutions.some((institution) => institution.id === data.institutionId)) {
    throw new AppError('Institution does not belong to this organization', 'NCCT_INSTITUTION_NOT_FOUND', 404);
  }
  await assertNcctInstitutionAccess(organizationId, data.institutionId, actorProfileId, orgRole);

  return createNcctResource(data);
}

export async function bookResource(
  organizationId: string,
  data: TBookNcctResource,
  actorProfileId?: string,
  orgRole?: number
) {
  const [sessions, resources] = await Promise.all([
    listNcctSessions(organizationId),
    listNcctResources(organizationId)
  ]);
  if (!sessions.some(({ session }) => session.id === data.sessionId)) {
    throw new AppError('Session does not belong to this organization', 'NCCT_SESSION_NOT_FOUND', 404);
  }
  const resource = resources.find(({ resource: item }) => item.id === data.resourceId)?.resource;
  if (!resource) {
    throw new AppError('Resource does not belong to this organization', 'NCCT_RESOURCE_NOT_FOUND', 404);
  }
  await assertNcctInstitutionAccess(organizationId, resource.institutionId, actorProfileId, orgRole);

  try {
    return await bookNcctResource(data);
  } catch (error) {
    if (error instanceof Error && error.message === 'RESOURCE_INSTITUTION_CONFLICT') {
      throw new AppError(
        'The resource belongs to a different training centre',
        'NCCT_RESOURCE_INSTITUTION_CONFLICT',
        409
      );
    }
    if (error instanceof Error && error.message === 'RESOURCE_OUTSIDE_SESSION') {
      throw new AppError('Resource booking must stay within the session time', 'NCCT_RESOURCE_OUTSIDE_SESSION', 409);
    }
    if (error instanceof Error && error.message === 'RESOURCE_CAPACITY_REACHED') {
      throw new AppError('The resource has no remaining capacity for this time', 'NCCT_RESOURCE_CAPACITY_REACHED', 409);
    }
    if (error instanceof Error && error.message === 'RESOURCE_INACTIVE') {
      throw new AppError('The resource is inactive', 'NCCT_RESOURCE_INACTIVE', 409);
    }
    throw error;
  }
}

export async function saveTraineeLogistics(
  organizationId: string,
  data: TSaveNcctTraineeLogistics,
  actorProfileId?: string,
  orgRole?: number
) {
  const [batches, trainees] = await Promise.all([listNcctBatches(organizationId), listNcctTrainees(organizationId)]);
  const batch = batches.find((item) => item.id === data.batchId);
  const trainee = trainees.find((item) => item.id === data.traineeId);
  if (!batch) throw new AppError('Batch does not belong to this organization', 'NCCT_BATCH_NOT_FOUND', 404);
  if (!trainee) throw new AppError('Trainee does not belong to this organization', 'NCCT_TRAINEE_NOT_FOUND', 404);
  if (batch.institutionId !== trainee.institutionId) {
    throw new AppError('Trainee and batch must belong to the same institution', 'NCCT_INSTITUTION_MISMATCH', 409);
  }
  await assertNcctInstitutionAccess(organizationId, batch.institutionId, actorProfileId, orgRole);
  return saveNcctTraineeLogistics(data);
}

export async function registerSyncDevice(
  organizationId: string,
  data: TCreateNcctSyncDevice,
  actorProfileId?: string,
  orgRole?: number
) {
  const institutions = await listNcctInstitutions(organizationId);
  if (!institutions.some((institution) => institution.id === data.institutionId)) {
    throw new AppError('Institution does not belong to this organization', 'NCCT_INSTITUTION_NOT_FOUND', 404);
  }
  await assertNcctInstitutionAccess(organizationId, data.institutionId, actorProfileId, orgRole);

  return createNcctSyncDevice({ ...data, organizationId });
}

export async function receiveSyncEvents(
  organizationId: string,
  deviceId: string,
  data: TRecordNcctSyncEvents,
  actorProfileId?: string,
  orgRole?: number
) {
  const device = await getNcctSyncDevice(organizationId, deviceId);
  if (!device)
    throw new AppError('Sync device does not belong to this organization', 'NCCT_SYNC_DEVICE_NOT_FOUND', 404);
  await assertNcctInstitutionAccess(organizationId, device.institutionId, actorProfileId, orgRole);

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
      } else if (event.eventType === 'progress.update') {
        const enrollmentId = event.payload.enrollmentId;
        if (typeof enrollmentId !== 'string') throw new Error('Invalid progress payload');
        const parsed = ZUpdateNcctProgress.safeParse(event.payload);
        if (!parsed.success) throw new Error('Invalid progress payload');
        await updateEnrollmentProgress(organizationId, enrollmentId, parsed.data);
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
