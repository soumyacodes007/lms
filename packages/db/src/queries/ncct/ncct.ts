import * as schema from '@db/schema';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';

export type TNcctInstitution = typeof schema.ncctInstitution.$inferSelect;
export type TNcctTrainee = typeof schema.ncctTrainee.$inferSelect;
export type TNcctProgramme = typeof schema.ncctProgramme.$inferSelect;
export type TNcctBatch = typeof schema.ncctBatch.$inferSelect;
export type TNcctNomination = typeof schema.ncctNomination.$inferSelect;
export type TNcctJob = typeof schema.ncctJob.$inferSelect;

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
