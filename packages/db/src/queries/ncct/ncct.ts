import * as schema from '@db/schema';
import { and, asc, count, desc, eq, gt, inArray, lt } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';

export type TNcctInstitution = typeof schema.ncctInstitution.$inferSelect;
export type TNcctTrainee = typeof schema.ncctTrainee.$inferSelect;
export type TNcctProgramme = typeof schema.ncctProgramme.$inferSelect;
export type TNcctBatch = typeof schema.ncctBatch.$inferSelect;
export type TNcctNomination = typeof schema.ncctNomination.$inferSelect;
export type TNcctJob = typeof schema.ncctJob.$inferSelect;

export async function listNcctNominations(organizationId: string) {
  return db
    .select({
      nomination: schema.ncctNomination,
      batch: schema.ncctBatch,
      trainee: schema.ncctTrainee,
      programme: schema.ncctProgramme,
      institution: schema.ncctInstitution
    })
    .from(schema.ncctNomination)
    .innerJoin(schema.ncctBatch, eq(schema.ncctNomination.batchId, schema.ncctBatch.id))
    .innerJoin(schema.ncctInstitution, eq(schema.ncctBatch.institutionId, schema.ncctInstitution.id))
    .innerJoin(schema.ncctTrainee, eq(schema.ncctNomination.traineeId, schema.ncctTrainee.id))
    .innerJoin(schema.ncctProgramme, eq(schema.ncctBatch.programmeId, schema.ncctProgramme.id))
    .where(eq(schema.ncctInstitution.organizationId, organizationId))
    .orderBy(desc(schema.ncctNomination.createdAt));
}

export async function getNcctNomination(organizationId: string, nominationId: string) {
  const [row] = await db
    .select({
      nomination: schema.ncctNomination,
      batch: schema.ncctBatch,
      trainee: schema.ncctTrainee,
      institution: schema.ncctInstitution
    })
    .from(schema.ncctNomination)
    .innerJoin(schema.ncctBatch, eq(schema.ncctNomination.batchId, schema.ncctBatch.id))
    .innerJoin(schema.ncctInstitution, eq(schema.ncctBatch.institutionId, schema.ncctInstitution.id))
    .innerJoin(schema.ncctTrainee, eq(schema.ncctNomination.traineeId, schema.ncctTrainee.id))
    .where(and(eq(schema.ncctNomination.id, nominationId), eq(schema.ncctInstitution.organizationId, organizationId)))
    .limit(1);

  return row ?? null;
}

export async function countNcctApprovedNominations(batchId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(schema.ncctNomination)
    .where(and(eq(schema.ncctNomination.batchId, batchId), eq(schema.ncctNomination.status, 'APPROVED')));

  return Number(row?.value ?? 0);
}

export async function listNcctInstitutions(organizationId: string): Promise<TNcctInstitution[]> {
  return db
    .select()
    .from(schema.ncctInstitution)
    .where(eq(schema.ncctInstitution.organizationId, organizationId))
    .orderBy(asc(schema.ncctInstitution.name));
}

export async function createNcctInstitution(
  data: typeof schema.ncctInstitution.$inferInsert,
  client: DbOrTxClient = db
): Promise<TNcctInstitution> {
  const [institution] = await client.insert(schema.ncctInstitution).values(data).returning();
  if (!institution) throw new Error('Failed to create institution');
  return institution;
}

export async function listNcctTrainees(organizationId: string, institutionId?: string): Promise<TNcctTrainee[]> {
  const conditions = [eq(schema.ncctTrainee.organizationId, organizationId)];
  if (institutionId) conditions.push(eq(schema.ncctTrainee.institutionId, institutionId));

  return db
    .select()
    .from(schema.ncctTrainee)
    .where(and(...conditions))
    .orderBy(asc(schema.ncctTrainee.traineeNumber));
}

export async function createNcctTrainee(
  data: typeof schema.ncctTrainee.$inferInsert,
  client: DbOrTxClient = db
): Promise<TNcctTrainee> {
  const [trainee] = await client.insert(schema.ncctTrainee).values(data).returning();
  if (!trainee) throw new Error('Failed to create trainee');
  return trainee;
}

export async function listNcctProgrammes(organizationId: string): Promise<TNcctProgramme[]> {
  return db
    .select()
    .from(schema.ncctProgramme)
    .where(eq(schema.ncctProgramme.organizationId, organizationId))
    .orderBy(desc(schema.ncctProgramme.createdAt));
}

export async function createNcctProgramme(
  data: typeof schema.ncctProgramme.$inferInsert,
  client: DbOrTxClient = db
): Promise<TNcctProgramme> {
  const [programme] = await client.insert(schema.ncctProgramme).values(data).returning();
  if (!programme) throw new Error('Failed to create programme');
  return programme;
}

export async function addNcctProgrammeStep(
  data: typeof schema.ncctProgrammeStep.$inferInsert,
  client: DbOrTxClient = db
) {
  const [step] = await client.insert(schema.ncctProgrammeStep).values(data).returning();
  if (!step) throw new Error('Failed to add programme step');
  return step;
}

export async function listNcctProgrammeSteps(programmeId: string) {
  return db
    .select()
    .from(schema.ncctProgrammeStep)
    .where(eq(schema.ncctProgrammeStep.programmeId, programmeId))
    .orderBy(asc(schema.ncctProgrammeStep.position));
}

export async function getNcctProgrammeProgress(programmeId: string, profileId: string | null) {
  const steps = await listNcctProgrammeSteps(programmeId);
  const courseIds = steps.map((step) => step.courseId);
  const records =
    profileId && courseIds.length > 0
      ? await db
          .select({
            courseId: schema.courseCompletionRecord.courseId,
            status: schema.courseCompletionRecord.status,
            completedAt: schema.courseCompletionRecord.completedAt,
            cycleNumber: schema.courseCompletionRecord.cycleNumber
          })
          .from(schema.courseCompletionRecord)
          .where(
            and(
              eq(schema.courseCompletionRecord.profileId, profileId),
              inArray(schema.courseCompletionRecord.courseId, courseIds)
            )
          )
          .orderBy(desc(schema.courseCompletionRecord.cycleNumber))
      : [];

  const latestRecords = new Map<string, (typeof records)[number]>();
  for (const record of records) {
    if (!latestRecords.has(record.courseId)) latestRecords.set(record.courseId, record);
  }

  const completedCourses = new Set(
    steps
      .filter((step) => {
        const record = latestRecords.get(step.courseId);
        return Boolean(record?.completedAt);
      })
      .map((step) => step.id)
  );

  return steps.map((step) => {
    const record = latestRecords.get(step.courseId);
    const completed = Boolean(record?.completedAt);
    const prerequisiteComplete = !step.prerequisiteStepId || completedCourses.has(step.prerequisiteStepId);
    const status = completed ? 'COMPLETED' : prerequisiteComplete ? 'AVAILABLE' : 'LOCKED';

    return {
      step,
      status,
      completionStatus: record?.status ?? 'not_started',
      completedAt: record?.completedAt ?? null
    };
  });
}

export async function listNcctBatches(organizationId: string): Promise<TNcctBatch[]> {
  return db
    .select({ batch: schema.ncctBatch })
    .from(schema.ncctBatch)
    .innerJoin(schema.ncctInstitution, eq(schema.ncctBatch.institutionId, schema.ncctInstitution.id))
    .where(eq(schema.ncctInstitution.organizationId, organizationId))
    .orderBy(desc(schema.ncctBatch.startsOn), asc(schema.ncctBatch.name))
    .then((rows) => rows.map(({ batch }) => batch));
}

export async function createNcctBatch(
  data: typeof schema.ncctBatch.$inferInsert,
  client: DbOrTxClient = db
): Promise<TNcctBatch> {
  if (data.capacity !== undefined && data.capacity < 1) throw new Error('Batch capacity must be positive');
  const [batch] = await client.insert(schema.ncctBatch).values(data).returning();
  if (!batch) throw new Error('Failed to create batch');
  return batch;
}

export async function createNcctNomination(
  data: typeof schema.ncctNomination.$inferInsert,
  client: DbOrTxClient = db
): Promise<TNcctNomination> {
  const [nomination] = await client.insert(schema.ncctNomination).values(data).returning();
  if (!nomination) throw new Error('Failed to create nomination');
  return nomination;
}

export async function decideNcctNomination(
  nominationId: string,
  status: 'APPROVED' | 'REJECTED' | 'WAITLISTED',
  decisionByProfileId: string,
  decisionNote?: string,
  client: DbOrTxClient = db
): Promise<TNcctNomination> {
  const [nomination] = await client
    .update(schema.ncctNomination)
    .set({
      status,
      decisionByProfileId,
      decisionAt: new Date().toISOString(),
      decisionNote,
      updatedAt: new Date().toISOString()
    })
    .where(eq(schema.ncctNomination.id, nominationId))
    .returning();
  if (!nomination) throw new Error('Nomination not found');
  return nomination;
}

export async function decideNcctNominationAndEnroll(
  nominationId: string,
  status: 'APPROVED' | 'REJECTED' | 'WAITLISTED',
  decisionByProfileId: string,
  decisionNote?: string
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ nomination: schema.ncctNomination, batch: schema.ncctBatch })
      .from(schema.ncctNomination)
      .innerJoin(schema.ncctBatch, eq(schema.ncctNomination.batchId, schema.ncctBatch.id))
      .where(eq(schema.ncctNomination.id, nominationId))
      .limit(1);

    if (!row) throw new Error('NOMINATION_NOT_FOUND');
    if (row.nomination.status !== 'PENDING') throw new Error('NOMINATION_ALREADY_DECIDED');

    if (status === 'APPROVED') {
      const [seatCount] = await tx
        .select({ value: count() })
        .from(schema.ncctEnrollment)
        .where(and(eq(schema.ncctEnrollment.batchId, row.batch.id), eq(schema.ncctEnrollment.status, 'ENROLLED')));
      if (Number(seatCount?.value ?? 0) >= row.batch.capacity) throw new Error('BATCH_CAPACITY_REACHED');
    }

    const [nomination] = await tx
      .update(schema.ncctNomination)
      .set({
        status,
        decisionByProfileId,
        decisionAt: new Date().toISOString(),
        decisionNote,
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(schema.ncctNomination.id, nominationId), eq(schema.ncctNomination.status, 'PENDING')))
      .returning();
    if (!nomination) throw new Error('NOMINATION_ALREADY_DECIDED');

    let enrollment: typeof schema.ncctEnrollment.$inferSelect | null = null;
    if (status === 'APPROVED') {
      const [created] = await tx
        .insert(schema.ncctEnrollment)
        .values({ batchId: row.batch.id, traineeId: row.nomination.traineeId })
        .onConflictDoNothing()
        .returning();
      enrollment = created ?? null;
    }

    return { nomination, enrollment };
  });
}

export async function listNcctEnrollments(organizationId: string) {
  return db
    .select({
      enrollment: schema.ncctEnrollment,
      batch: schema.ncctBatch,
      trainee: schema.ncctTrainee,
      programme: schema.ncctProgramme
    })
    .from(schema.ncctEnrollment)
    .innerJoin(schema.ncctBatch, eq(schema.ncctEnrollment.batchId, schema.ncctBatch.id))
    .innerJoin(schema.ncctInstitution, eq(schema.ncctBatch.institutionId, schema.ncctInstitution.id))
    .innerJoin(schema.ncctTrainee, eq(schema.ncctEnrollment.traineeId, schema.ncctTrainee.id))
    .innerJoin(schema.ncctProgramme, eq(schema.ncctBatch.programmeId, schema.ncctProgramme.id))
    .where(eq(schema.ncctInstitution.organizationId, organizationId))
    .orderBy(desc(schema.ncctEnrollment.enrolledAt));
}

export async function listNcctJobs(organizationId: string): Promise<TNcctJob[]> {
  return db
    .select()
    .from(schema.ncctJob)
    .where(eq(schema.ncctJob.organizationId, organizationId))
    .orderBy(desc(schema.ncctJob.createdAt));
}

export async function createNcctJob(
  data: typeof schema.ncctJob.$inferInsert,
  client: DbOrTxClient = db
): Promise<TNcctJob> {
  const [job] = await client.insert(schema.ncctJob).values(data).returning();
  if (!job) throw new Error('Failed to create job');
  return job;
}

export async function applyToNcctJob(data: typeof schema.ncctJobApplication.$inferInsert, client: DbOrTxClient = db) {
  const [application] = await client.insert(schema.ncctJobApplication).values(data).returning();
  if (!application) throw new Error('Failed to apply for job');
  return application;
}

export async function listNcctJobApplications(organizationId: string) {
  return db
    .select({ application: schema.ncctJobApplication, job: schema.ncctJob, trainee: schema.ncctTrainee })
    .from(schema.ncctJobApplication)
    .innerJoin(schema.ncctJob, eq(schema.ncctJobApplication.jobId, schema.ncctJob.id))
    .innerJoin(schema.ncctTrainee, eq(schema.ncctJobApplication.traineeId, schema.ncctTrainee.id))
    .where(eq(schema.ncctJob.organizationId, organizationId))
    .orderBy(desc(schema.ncctJobApplication.createdAt));
}

export async function listNcctCareerMessages(traineeId: string) {
  return db
    .select()
    .from(schema.ncctCareerMessage)
    .where(eq(schema.ncctCareerMessage.traineeId, traineeId))
    .orderBy(asc(schema.ncctCareerMessage.createdAt));
}

export async function createNcctCareerMessage(
  data: typeof schema.ncctCareerMessage.$inferInsert,
  client: DbOrTxClient = db
) {
  const [message] = await client.insert(schema.ncctCareerMessage).values(data).returning();
  if (!message) throw new Error('Failed to create career message');
  return message;
}

export async function listNcctCredentials(organizationId: string) {
  return db
    .select({ credential: schema.ncctCredential, trainee: schema.ncctTrainee, programme: schema.ncctProgramme })
    .from(schema.ncctCredential)
    .innerJoin(schema.ncctTrainee, eq(schema.ncctCredential.traineeId, schema.ncctTrainee.id))
    .innerJoin(schema.ncctProgramme, eq(schema.ncctCredential.programmeId, schema.ncctProgramme.id))
    .where(eq(schema.ncctTrainee.organizationId, organizationId))
    .orderBy(desc(schema.ncctCredential.issuedAt));
}

export async function listNcctSessions(organizationId: string) {
  return db
    .select({ session: schema.ncctSession })
    .from(schema.ncctSession)
    .innerJoin(schema.ncctBatch, eq(schema.ncctSession.batchId, schema.ncctBatch.id))
    .innerJoin(schema.ncctInstitution, eq(schema.ncctBatch.institutionId, schema.ncctInstitution.id))
    .where(eq(schema.ncctInstitution.organizationId, organizationId))
    .orderBy(asc(schema.ncctSession.startsAt));
}

export async function createNcctSession(data: typeof schema.ncctSession.$inferInsert, client: DbOrTxClient = db) {
  if (data.endsAt <= data.startsAt) throw new Error('Session end must be after its start');
  const [session] = await client.insert(schema.ncctSession).values(data).returning();
  if (!session) throw new Error('Failed to create session');
  return session;
}

export async function listNcctResources(organizationId: string) {
  return db
    .select({ resource: schema.ncctResource })
    .from(schema.ncctResource)
    .innerJoin(schema.ncctInstitution, eq(schema.ncctResource.institutionId, schema.ncctInstitution.id))
    .where(eq(schema.ncctInstitution.organizationId, organizationId))
    .orderBy(asc(schema.ncctResource.name));
}

export async function createNcctResource(data: typeof schema.ncctResource.$inferInsert, client: DbOrTxClient = db) {
  if (data.capacity !== undefined && data.capacity < 1) throw new Error('Resource capacity must be positive');
  const [resource] = await client.insert(schema.ncctResource).values(data).returning();
  if (!resource) throw new Error('Failed to create resource');
  return resource;
}

export async function bookNcctResource(
  data: typeof schema.ncctResourceBooking.$inferInsert,
  client: DbOrTxClient = db
) {
  const [conflict] = await client
    .select({ id: schema.ncctResourceBooking.id })
    .from(schema.ncctResourceBooking)
    .where(
      and(
        eq(schema.ncctResourceBooking.resourceId, data.resourceId),
        lt(schema.ncctResourceBooking.startsAt, data.endsAt),
        gt(schema.ncctResourceBooking.endsAt, data.startsAt)
      )
    )
    .limit(1);
  if (conflict) throw new Error('Resource is already booked for this time');

  const [booking] = await client.insert(schema.ncctResourceBooking).values(data).returning();
  if (!booking) throw new Error('Failed to book resource');
  return booking;
}

export async function saveNcctTraineeLogistics(
  data: typeof schema.ncctTraineeLogistics.$inferInsert,
  client: DbOrTxClient = db
) {
  const [logistics] = await client
    .insert(schema.ncctTraineeLogistics)
    .values(data)
    .onConflictDoUpdate({
      target: [schema.ncctTraineeLogistics.batchId, schema.ncctTraineeLogistics.traineeId],
      set: {
        hostelResourceId: data.hostelResourceId,
        mealRequired: data.mealRequired,
        transportRequired: data.transportRequired,
        notes: data.notes,
        updatedAt: new Date().toISOString()
      }
    })
    .returning();
  if (!logistics) throw new Error('Failed to save trainee logistics');
  return logistics;
}

export async function createNcctSyncDevice(data: typeof schema.ncctSyncDevice.$inferInsert, client: DbOrTxClient = db) {
  const [device] = await client.insert(schema.ncctSyncDevice).values(data).returning();
  if (!device) throw new Error('Failed to register sync device');
  return device;
}

export async function recordNcctSyncEvents(
  deviceId: string,
  events: Array<Pick<typeof schema.ncctSyncEvent.$inferInsert, 'eventId' | 'eventType' | 'payload'>>,
  client: DbOrTxClient = db
) {
  if (events.length === 0) return [];
  const received = await client
    .insert(schema.ncctSyncEvent)
    .values(events.map((event) => ({ ...event, deviceId, status: 'RECEIVED' as const })))
    .onConflictDoNothing({ target: schema.ncctSyncEvent.eventId })
    .returning({ eventId: schema.ncctSyncEvent.eventId });
  await client
    .update(schema.ncctSyncDevice)
    .set({ lastSeenAt: new Date().toISOString() })
    .where(eq(schema.ncctSyncDevice.id, deviceId));
  return received;
}

export async function listNcctAssessments(organizationId: string) {
  return db
    .select({ assessment: schema.ncctAssessment })
    .from(schema.ncctAssessment)
    .innerJoin(schema.ncctTrainee, eq(schema.ncctAssessment.traineeId, schema.ncctTrainee.id))
    .where(eq(schema.ncctTrainee.organizationId, organizationId))
    .orderBy(desc(schema.ncctAssessment.scheduledAt));
}

export async function createNcctAssessment(data: typeof schema.ncctAssessment.$inferInsert, client: DbOrTxClient = db) {
  const [assessment] = await client.insert(schema.ncctAssessment).values(data).returning();
  if (!assessment) throw new Error('Failed to create assessment');
  return assessment;
}

export async function submitNcctAssessment(
  assessmentId: string,
  data: Pick<typeof schema.ncctAssessment.$inferInsert, 'status' | 'score' | 'feedback'>,
  client: DbOrTxClient = db
) {
  const [assessment] = await client
    .update(schema.ncctAssessment)
    .set({ ...data, decidedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(schema.ncctAssessment.id, assessmentId))
    .returning();
  if (!assessment) throw new Error('Assessment not found');
  return assessment;
}

export async function issueNcctCredential(data: typeof schema.ncctCredential.$inferInsert, client: DbOrTxClient = db) {
  const [credential] = await client.insert(schema.ncctCredential).values(data).returning();
  if (!credential) throw new Error('Failed to issue credential');
  return credential;
}

export async function verifyNcctCredential(verificationToken: string) {
  const [row] = await db
    .select({
      credential: schema.ncctCredential,
      trainee: schema.ncctTrainee,
      programme: schema.ncctProgramme,
      institution: schema.ncctInstitution
    })
    .from(schema.ncctCredential)
    .innerJoin(schema.ncctTrainee, eq(schema.ncctCredential.traineeId, schema.ncctTrainee.id))
    .innerJoin(schema.ncctProgramme, eq(schema.ncctCredential.programmeId, schema.ncctProgramme.id))
    .innerJoin(schema.ncctInstitution, eq(schema.ncctTrainee.institutionId, schema.ncctInstitution.id))
    .where(eq(schema.ncctCredential.verificationToken, verificationToken))
    .limit(1);

  if (!row || row.credential.revokedAt) return null;

  return {
    certificateNumber: row.credential.certificateNumber,
    issuedAt: row.credential.issuedAt,
    traineeNumber: row.trainee.traineeNumber,
    traineeDistrict: row.trainee.district,
    traineeState: row.trainee.state,
    programmeTitle: row.programme.title,
    institutionName: row.institution.name,
    institutionCode: row.institution.code
  };
}

export async function getNcctDashboardSummary(organizationId: string) {
  const [institutions, trainees, programmes, batches, pendingNominations, credentials, jobs] = await Promise.all([
    db
      .select({ value: count() })
      .from(schema.ncctInstitution)
      .where(eq(schema.ncctInstitution.organizationId, organizationId)),
    db.select({ value: count() }).from(schema.ncctTrainee).where(eq(schema.ncctTrainee.organizationId, organizationId)),
    db
      .select({ value: count() })
      .from(schema.ncctProgramme)
      .where(eq(schema.ncctProgramme.organizationId, organizationId)),
    db
      .select({ value: count() })
      .from(schema.ncctBatch)
      .innerJoin(schema.ncctInstitution, eq(schema.ncctBatch.institutionId, schema.ncctInstitution.id))
      .where(eq(schema.ncctInstitution.organizationId, organizationId)),
    db
      .select({ value: count() })
      .from(schema.ncctNomination)
      .innerJoin(schema.ncctBatch, eq(schema.ncctNomination.batchId, schema.ncctBatch.id))
      .innerJoin(schema.ncctInstitution, eq(schema.ncctBatch.institutionId, schema.ncctInstitution.id))
      .where(
        and(eq(schema.ncctInstitution.organizationId, organizationId), eq(schema.ncctNomination.status, 'PENDING'))
      ),
    db
      .select({ value: count() })
      .from(schema.ncctCredential)
      .innerJoin(schema.ncctTrainee, eq(schema.ncctCredential.traineeId, schema.ncctTrainee.id))
      .where(eq(schema.ncctTrainee.organizationId, organizationId)),
    db.select({ value: count() }).from(schema.ncctJob).where(eq(schema.ncctJob.organizationId, organizationId))
  ]);

  return {
    institutions: Number(institutions[0]?.value ?? 0),
    trainees: Number(trainees[0]?.value ?? 0),
    programmes: Number(programmes[0]?.value ?? 0),
    batches: Number(batches[0]?.value ?? 0),
    pendingNominations: Number(pendingNominations[0]?.value ?? 0),
    credentials: Number(credentials[0]?.value ?? 0),
    jobs: Number(jobs[0]?.value ?? 0)
  };
}
