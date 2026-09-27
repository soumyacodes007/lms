import 'dotenv/config';

import { and, asc, eq } from 'drizzle-orm';
import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';

const organizationId = process.env.NCCT_ORGANIZATION_ID?.trim();
const tutorProfileId = process.env.NCCT_TUTOR_PROFILE_ID?.trim();
const studentProfileId = process.env.NCCT_STUDENT_PROFILE_ID?.trim();

if (!organizationId) {
  throw new Error('Set NCCT_ORGANIZATION_ID to the organization that should receive demo data.');
}
const ncctOrganizationId = organizationId;

async function firstOrCreateInstitution(data: typeof schema.ncctInstitution.$inferInsert) {
  const [existing] = await db
    .select()
    .from(schema.ncctInstitution)
    .where(
      and(eq(schema.ncctInstitution.organizationId, ncctOrganizationId), eq(schema.ncctInstitution.code, data.code))
    )
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
        eq(schema.ncctTrainee.organizationId, ncctOrganizationId),
        eq(schema.ncctTrainee.traineeNumber, data.traineeNumber)
      )
    )
    .limit(1);
  if (existing) {
    if (data.profileId && existing.profileId !== data.profileId) {
      const [updated] = await db
        .update(schema.ncctTrainee)
        .set({ profileId: data.profileId, updatedAt: new Date().toISOString() })
        .where(eq(schema.ncctTrainee.id, existing.id))
        .returning();
      return updated ?? existing;
    }
    return existing;
  }
  const [created] = await db.insert(schema.ncctTrainee).values(data).returning();
  if (!created) throw new Error(`Could not create trainee ${data.traineeNumber}`);
  return created;
}

async function firstOrCreateLearningGroup() {
  const [existing] = await db
    .select()
    .from(schema.group)
    .where(and(eq(schema.group.organizationId, ncctOrganizationId), eq(schema.group.name, 'NCCT Demo Learning')))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(schema.group)
    .values({
      organizationId: ncctOrganizationId,
      name: 'NCCT Demo Learning',
      description: 'Courses used by the NCCT SIH demonstration.'
    })
    .returning();
  if (!created) throw new Error('Could not create the NCCT demo learning group');
  return created;
}

async function firstOrCreateCourse(data: typeof schema.course.$inferInsert) {
  const [existing] = await db
    .select()
    .from(schema.course)
    .where(and(eq(schema.course.groupId, data.groupId!), eq(schema.course.title, data.title)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db.insert(schema.course).values(data).returning();
  if (!created) throw new Error(`Could not create course ${data.title}`);
  return created;
}

async function firstOrCreateResource(data: typeof schema.ncctResource.$inferInsert) {
  const [existing] = await db
    .select()
    .from(schema.ncctResource)
    .where(
      and(
        eq(schema.ncctResource.institutionId, data.institutionId),
        eq(schema.ncctResource.type, data.type),
        eq(schema.ncctResource.name, data.name)
      )
    )
    .limit(1);
  if (existing) return existing;
  const [created] = await db.insert(schema.ncctResource).values(data).returning();
  if (!created) throw new Error(`Could not create resource ${data.name}`);
  return created;
}

async function main() {
  const [institution, secondInstitution] = await Promise.all([
    firstOrCreateInstitution({
      organizationId: ncctOrganizationId,
      code: 'VAM-DEMO',
      name: 'VAMNICOM Demo Centre',
      type: 'VAMNICOM',
      district: 'Pune',
      state: 'Maharashtra',
      contactEmail: 'vam-demo@example.org'
    }),
    firstOrCreateInstitution({
      organizationId: ncctOrganizationId,
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
      organizationId: ncctOrganizationId,
      institutionId: institution.id,
      profileId: studentProfileId || undefined,
      traineeNumber: 'NCCT-DEMO-001',
      cooperativeName: 'Sahyadri Farmers Cooperative',
      district: 'Pune',
      state: 'Maharashtra',
      phone: '+91 9000000001',
      skills: ['bookkeeping', 'cooperative management'],
      directoryVisible: true
    }),
    firstOrCreateTrainee({
      organizationId: ncctOrganizationId,
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
      organizationId: ncctOrganizationId,
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

  if (tutorProfileId) {
    const existingMembership = await db
      .select()
      .from(schema.ncctInstitutionMember)
      .where(
        and(
          eq(schema.ncctInstitutionMember.institutionId, institution.id),
          eq(schema.ncctInstitutionMember.profileId, tutorProfileId)
        )
      )
      .limit(1);
    if (!existingMembership[0]) {
      await db.insert(schema.ncctInstitutionMember).values({
        institutionId: institution.id,
        profileId: tutorProfileId,
        role: 'COORDINATOR',
        active: true
      });
    }
  }

  const [programme] = await db
    .select()
    .from(schema.ncctProgramme)
    .where(
      and(
        eq(schema.ncctProgramme.organizationId, ncctOrganizationId),
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
          organizationId: ncctOrganizationId,
          title: 'Cooperative Digital Operations',
          description: 'Practical training for cooperative administration, digital records, and employment readiness.',
          language: 'en',
          status: 'PUBLISHED',
          publishedAt: new Date().toISOString()
        })
        .returning()
    )[0];
  if (!savedProgramme) throw new Error('Could not create demo programme');

  const learningGroup = await firstOrCreateLearningGroup();
  const courses = await Promise.all([
    firstOrCreateCourse({
      groupId: learningGroup.id,
      title: 'Cooperative Digital Records',
      description: 'Maintain member records and cooperative reporting workflows.',
      status: 'ACTIVE',
      isPublished: true,
      isTemplate: false,
      metadata: { goals: 'Create accurate digital cooperative records', skills: ['digital literacy'] }
    }),
    firstOrCreateCourse({
      groupId: learningGroup.id,
      title: 'Cooperative Accounts and Employment Readiness',
      description: 'Apply bookkeeping skills and prepare for cooperative-sector employment.',
      status: 'ACTIVE',
      isPublished: true,
      isTemplate: false,
      metadata: { goals: 'Prepare a cooperative accounts portfolio', skills: ['bookkeeping'] }
    })
  ]);

  let programmeSteps = await db
    .select()
    .from(schema.ncctProgrammeStep)
    .where(eq(schema.ncctProgrammeStep.programmeId, savedProgramme.id))
    .orderBy(asc(schema.ncctProgrammeStep.position));
  if (programmeSteps.length === 0) {
    const insertedSteps = await db
      .insert(schema.ncctProgrammeStep)
      .values(
        courses.map((course, index) => ({
          programmeId: savedProgramme.id,
          courseId: course.id,
          position: index + 1,
          required: true
        }))
      )
      .returning();
    if (insertedSteps[1]) {
      await db
        .update(schema.ncctProgrammeStep)
        .set({ prerequisiteStepId: insertedSteps[0]?.id })
        .where(eq(schema.ncctProgrammeStep.id, insertedSteps[1].id));
    }
    programmeSteps = await db
      .select()
      .from(schema.ncctProgrammeStep)
      .where(eq(schema.ncctProgrammeStep.programmeId, savedProgramme.id))
      .orderBy(asc(schema.ncctProgrammeStep.position));
  }

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
      and(
        eq(schema.ncctJob.organizationId, ncctOrganizationId),
        eq(schema.ncctJob.title, 'Cooperative Accounts Assistant')
      )
    )
    .limit(1);
  const savedJob =
    job ??
    (
      await db
        .insert(schema.ncctJob)
        .values({
          organizationId: ncctOrganizationId,
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

  const [existingNomination] = await db
    .select()
    .from(schema.ncctNomination)
    .where(and(eq(schema.ncctNomination.batchId, savedBatch.id), eq(schema.ncctNomination.traineeId, trainees[0]!.id)))
    .limit(1);
  const savedNomination =
    existingNomination ??
    (
      await db
        .insert(schema.ncctNomination)
        .values({ batchId: savedBatch.id, traineeId: trainees[0]!.id, status: 'APPROVED' })
        .returning()
    )[0];
  if (!savedNomination) throw new Error('Could not create demo nomination');
  if (savedNomination.status !== 'APPROVED') {
    const [approved] = await db
      .update(schema.ncctNomination)
      .set({
        status: 'APPROVED',
        decisionByProfileId: tutorProfileId || undefined,
        decisionAt: new Date().toISOString(),
        decisionNote: 'Approved for the SIH demonstration path.',
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.ncctNomination.id, savedNomination.id))
      .returning();
    if (approved) Object.assign(savedNomination, approved);
  }

  const [existingEnrollment] = await db
    .select()
    .from(schema.ncctEnrollment)
    .where(and(eq(schema.ncctEnrollment.batchId, savedBatch.id), eq(schema.ncctEnrollment.traineeId, trainees[0]!.id)))
    .limit(1);
  const savedEnrollment =
    existingEnrollment ??
    (
      await db
        .insert(schema.ncctEnrollment)
        .values({
          batchId: savedBatch.id,
          traineeId: trainees[0]!.id,
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        })
        .returning()
    )[0];
  if (!savedEnrollment) throw new Error('Could not create demo enrolment');
  if (savedEnrollment.status !== 'COMPLETED') {
    await db
      .update(schema.ncctEnrollment)
      .set({ status: 'COMPLETED', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(schema.ncctEnrollment.id, savedEnrollment.id));
  }

  for (const step of programmeSteps) {
    const [existingProgress] = await db
      .select()
      .from(schema.ncctEnrollmentProgress)
      .where(
        and(
          eq(schema.ncctEnrollmentProgress.enrollmentId, savedEnrollment.id),
          eq(schema.ncctEnrollmentProgress.programmeStepId, step.id)
        )
      )
      .limit(1);
    if (!existingProgress) {
      await db.insert(schema.ncctEnrollmentProgress).values({
        enrollmentId: savedEnrollment.id,
        programmeStepId: step.id,
        status: 'COMPLETED',
        score: 90,
        completedAt: new Date().toISOString()
      });
    }
  }

  const [existingAssessment] = await db
    .select()
    .from(schema.ncctAssessment)
    .where(
      and(
        eq(schema.ncctAssessment.batchId, savedBatch.id),
        eq(schema.ncctAssessment.traineeId, trainees[0]!.id),
        eq(schema.ncctAssessment.title, 'Practical cooperative records review')
      )
    )
    .limit(1);
  if (!existingAssessment) {
    await db.insert(schema.ncctAssessment).values({
      batchId: savedBatch.id,
      traineeId: trainees[0]!.id,
      evaluatorProfileId: tutorProfileId || undefined,
      title: 'Practical cooperative records review',
      scheduledAt: '2026-04-20T09:00:00.000Z',
      score: 88,
      status: 'PASSED',
      feedback: 'Demonstrated accurate digital records and cooperative reporting.',
      decidedAt: new Date().toISOString()
    });
  }

  const [existingCredential] = await db
    .select()
    .from(schema.ncctCredential)
    .where(
      and(
        eq(schema.ncctCredential.traineeId, trainees[0]!.id),
        eq(schema.ncctCredential.programmeId, savedProgramme.id),
        eq(schema.ncctCredential.batchId, savedBatch.id)
      )
    )
    .limit(1);
  if (!existingCredential) {
    await db.insert(schema.ncctCredential).values({
      traineeId: trainees[0]!.id,
      programmeId: savedProgramme.id,
      batchId: savedBatch.id,
      certificateNumber: 'NCCT-DEMO-2026-001',
      verificationToken: `NCCT-DEMO-${trainees[0]!.id.replaceAll('-', '').slice(0, 20)}`
    });
  }

  const classroom = await firstOrCreateResource({
    institutionId: institution.id,
    type: 'ROOM',
    name: 'NCCT Demo Classroom',
    capacity: 30,
    active: true
  });
  const hostel = await firstOrCreateResource({
    institutionId: institution.id,
    type: 'HOSTEL',
    name: 'NCCT Demo Hostel',
    capacity: 20,
    active: true
  });
  const [existingSession] = await db
    .select()
    .from(schema.ncctSession)
    .where(and(eq(schema.ncctSession.batchId, savedBatch.id), eq(schema.ncctSession.title, 'Digital records workshop')))
    .limit(1);
  const savedSession =
    existingSession ??
    (
      await db
        .insert(schema.ncctSession)
        .values({
          batchId: savedBatch.id,
          title: 'Digital records workshop',
          startsAt: '2026-04-02T09:00:00.000Z',
          endsAt: '2026-04-02T13:00:00.000Z',
          room: classroom.name,
          instructorProfileId: tutorProfileId || undefined
        })
        .returning()
    )[0];
  if (!savedSession) throw new Error('Could not create demo session');

  const [existingBooking] = await db
    .select()
    .from(schema.ncctResourceBooking)
    .where(
      and(
        eq(schema.ncctResourceBooking.sessionId, savedSession.id),
        eq(schema.ncctResourceBooking.resourceId, classroom.id)
      )
    )
    .limit(1);
  if (!existingBooking) {
    await db.insert(schema.ncctResourceBooking).values({
      sessionId: savedSession.id,
      resourceId: classroom.id,
      startsAt: savedSession.startsAt,
      endsAt: savedSession.endsAt,
      quantity: 1,
      notes: 'Reserved for the demo workshop.'
    });
  }

  const [existingLogistics] = await db
    .select()
    .from(schema.ncctTraineeLogistics)
    .where(
      and(
        eq(schema.ncctTraineeLogistics.batchId, savedBatch.id),
        eq(schema.ncctTraineeLogistics.traineeId, trainees[0]!.id)
      )
    )
    .limit(1);
  if (!existingLogistics) {
    await db.insert(schema.ncctTraineeLogistics).values({
      batchId: savedBatch.id,
      traineeId: trainees[0]!.id,
      hostelResourceId: hostel.id,
      mealRequired: true,
      transportRequired: true,
      notes: 'Demo trainee logistics record.'
    });
  }

  const [existingApplication] = await db
    .select()
    .from(schema.ncctJobApplication)
    .where(
      and(eq(schema.ncctJobApplication.jobId, savedJob.id), eq(schema.ncctJobApplication.traineeId, trainees[0]!.id))
    )
    .limit(1);
  const savedApplication =
    existingApplication ??
    (
      await db
        .insert(schema.ncctJobApplication)
        .values({
          jobId: savedJob.id,
          traineeId: trainees[0]!.id,
          status: 'SHORTLISTED',
          coverNote: 'I completed the cooperative digital operations programme.'
        })
        .returning()
    )[0];
  if (!savedApplication) throw new Error('Could not create demo job application');
  if (savedApplication.status === 'APPLIED') {
    await db
      .update(schema.ncctJobApplication)
      .set({ status: 'SHORTLISTED', updatedAt: new Date().toISOString() })
      .where(eq(schema.ncctJobApplication.id, savedApplication.id));
  }
  const [existingApplicationEvent] = await db
    .select()
    .from(schema.ncctJobApplicationEvent)
    .where(
      and(
        eq(schema.ncctJobApplicationEvent.applicationId, savedApplication.id),
        eq(schema.ncctJobApplicationEvent.toStatus, 'SHORTLISTED')
      )
    )
    .limit(1);
  if (!existingApplicationEvent) {
    await db.insert(schema.ncctJobApplicationEvent).values({
      applicationId: savedApplication.id,
      fromStatus: 'APPLIED',
      toStatus: 'SHORTLISTED',
      note: 'Shortlisted for the SIH demonstration vacancy.',
      changedByProfileId: tutorProfileId || undefined
    });
  }

  console.log(
    JSON.stringify(
      {
        organizationId: ncctOrganizationId,
        institutions: [institution.code, secondInstitution.code],
        trainees: trainees.map((trainee) => trainee.traineeNumber),
        programme: savedProgramme.title,
        batch: savedBatch.name,
        job: savedJob.title,
        nominationId: savedNomination?.id,
        courseTitles: courses.map((course) => course.title),
        credential: 'NCCT-DEMO-2026-001',
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
