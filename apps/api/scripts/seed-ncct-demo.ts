import 'dotenv/config';

import { and, eq } from 'drizzle-orm';
import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';

const organizationId = process.env.NCCT_ORGANIZATION_ID?.trim();

if (!organizationId) {
  throw new Error('Set NCCT_ORGANIZATION_ID to the organization that should receive demo data.');
}

async function firstOrCreateInstitution(data: typeof schema.ncctInstitution.$inferInsert) {
  const [existing] = await db
    .select()
    .from(schema.ncctInstitution)
    .where(and(eq(schema.ncctInstitution.organizationId, organizationId!), eq(schema.ncctInstitution.code, data.code)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db.insert(schema.ncctInstitution).values(data).returning();
  if (!created) throw new Error(`Could not create institution ${data.code}`);
  return created;
}

async function firstOrCreateTrainee(data: typeof schema.ncctTrainee.$inferInsert) {
  const [existing] = await db
    .select()
    .from(schema.ncctTrainee)
    .where(
      and(
        eq(schema.ncctTrainee.organizationId, organizationId!),
        eq(schema.ncctTrainee.traineeNumber, data.traineeNumber)
      )
    )
    .limit(1);
  if (existing) return existing;
  const [created] = await db.insert(schema.ncctTrainee).values(data).returning();
  if (!created) throw new Error(`Could not create trainee ${data.traineeNumber}`);
  return created;
}

async function main() {
  const [institution, secondInstitution] = await Promise.all([
    firstOrCreateInstitution({
      organizationId,
      code: 'VAM-DEMO',
      name: 'VAMNICOM Demo Centre',
      type: 'VAMNICOM',
      district: 'Pune',
      state: 'Maharashtra',
      contactEmail: 'vam-demo@example.org'
    }),
    firstOrCreateInstitution({
      organizationId,
      code: 'RICM-DEMO',
      name: 'RICM Demo Centre',
      type: 'RICM',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      contactEmail: 'ricm-demo@example.org'
    })
  ]);

  const trainees = await Promise.all([
    firstOrCreateTrainee({
      organizationId,
      institutionId: institution.id,
      traineeNumber: 'NCCT-DEMO-001',
      cooperativeName: 'Sahyadri Farmers Cooperative',
      district: 'Pune',
      state: 'Maharashtra',
      phone: '+91 9000000001',
      skills: ['bookkeeping', 'cooperative management'],
      directoryVisible: true
    }),
    firstOrCreateTrainee({
      organizationId,
      institutionId: institution.id,
      traineeNumber: 'NCCT-DEMO-002',
      cooperativeName: 'Mangal Dairy Cooperative',
      district: 'Nashik',
      state: 'Maharashtra',
      phone: '+91 9000000002',
      skills: ['dairy operations', 'digital literacy'],
      directoryVisible: true
    }),
    firstOrCreateTrainee({
      organizationId,
      institutionId: secondInstitution.id,
      traineeNumber: 'NCCT-DEMO-003',
      cooperativeName: 'Namma Women SHG Federation',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      phone: '+91 9000000003',
      skills: ['bookkeeping', 'digital literacy'],
      directoryVisible: true
    })
  ]);

  const [programme] = await db
    .select()
    .from(schema.ncctProgramme)
    .where(
      and(
        eq(schema.ncctProgramme.organizationId, organizationId),
        eq(schema.ncctProgramme.title, 'Cooperative Digital Operations')
      )
    )
    .limit(1);
  const savedProgramme =
    programme ??
    (
      await db
        .insert(schema.ncctProgramme)
        .values({
          organizationId,
          title: 'Cooperative Digital Operations',
          description: 'Practical training for cooperative administration, digital records, and employment readiness.',
          language: 'en',
          status: 'PUBLISHED',
          publishedAt: new Date().toISOString()
        })
        .returning()
    )[0];
  if (!savedProgramme) throw new Error('Could not create demo programme');

  const [batch] = await db
    .select()
    .from(schema.ncctBatch)
    .where(and(eq(schema.ncctBatch.programmeId, savedProgramme.id), eq(schema.ncctBatch.name, 'April 2026 Demo Batch')))
    .limit(1);
  const savedBatch =
    batch ??
    (
      await db
        .insert(schema.ncctBatch)
        .values({
          programmeId: savedProgramme.id,
          institutionId: institution.id,
          name: 'April 2026 Demo Batch',
          startsOn: '2026-04-01',
          endsOn: '2026-05-15',
          capacity: 30,
          status: 'OPEN'
        })
        .returning()
    )[0];
  if (!savedBatch) throw new Error('Could not create demo batch');

  const [job] = await db
    .select()
    .from(schema.ncctJob)
    .where(
      and(eq(schema.ncctJob.organizationId, organizationId), eq(schema.ncctJob.title, 'Cooperative Accounts Assistant'))
    )
    .limit(1);
  const savedJob =
    job ??
    (
      await db
        .insert(schema.ncctJob)
        .values({
          organizationId,
          employerName: 'Sahyadri Cooperative Union',
          title: 'Cooperative Accounts Assistant',
          description: 'Support monthly books, member records, and digital reporting for a district cooperative union.',
          location: 'Pune, Maharashtra',
          skills: ['bookkeeping', 'digital literacy'],
          status: 'OPEN'
        })
        .returning()
    )[0];
  if (!savedJob) throw new Error('Could not create demo job');

  const [nomination] = await db
    .select()
    .from(schema.ncctNomination)
    .where(and(eq(schema.ncctNomination.batchId, savedBatch.id), eq(schema.ncctNomination.traineeId, trainees[0]!.id)))
    .limit(1);
  const savedNomination =
    nomination ??
    (
      await db
        .insert(schema.ncctNomination)
        .values({ batchId: savedBatch.id, traineeId: trainees[0]!.id, status: 'PENDING' })
        .returning()
    )[0];

  console.log(
    JSON.stringify(
      {
        organizationId,
        institutions: [institution.code, secondInstitution.code],
        trainees: trainees.map((trainee) => trainee.traineeNumber),
        programme: savedProgramme.title,
        batch: savedBatch.name,
        job: savedJob.title,
        nominationId: savedNomination?.id,
        generatedAt: new Date().toISOString()
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
