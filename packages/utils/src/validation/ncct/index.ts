import { z } from 'zod';

const isoDate = z.string().date();

export const ZCreateNcctInstitution = z.object({
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(160),
  type: z.enum(['VAMNICOM', 'RICM', 'ICM', 'PACS', 'SHG', 'DAIRY', 'OTHER']).default('OTHER'),
  district: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  contactEmail: z.string().email().optional()
});

export const ZUpdateNcctInstitution = z.object({
  code: z.string().trim().min(2).max(30).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  type: z.enum(['VAMNICOM', 'RICM', 'ICM', 'PACS', 'SHG', 'DAIRY', 'OTHER']).optional(),
  district: z.string().trim().min(2).max(80).optional(),
  state: z.string().trim().min(2).max(80).optional(),
  contactEmail: z.string().email().nullable().optional()
});

export const ZUpsertNcctInstitutionMember = z.object({
  institutionId: z.string().uuid(),
  profileId: z.string().uuid(),
  role: z.enum(['COORDINATOR', 'INSTRUCTOR', 'EVALUATOR']).default('COORDINATOR')
});

export const ZUpdateNcctInstitutionMember = z.object({
  role: z.enum(['COORDINATOR', 'INSTRUCTOR', 'EVALUATOR']).optional(),
  active: z.boolean().optional()
});

export const ZCreateNcctTrainee = z.object({
  institutionId: z.string().uuid(),
  traineeNumber: z.string().trim().min(2).max(40),
  cooperativeName: z.string().trim().max(160).optional(),
  district: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  directoryVisible: z.boolean().default(true)
});

export const ZUpdateNcctTrainee = z.object({
  institutionId: z.string().uuid().optional(),
  cooperativeName: z.string().trim().max(160).nullable().optional(),
  district: z.string().trim().min(2).max(80).optional(),
  state: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  directoryVisible: z.boolean().optional()
});

export const ZCreateNcctProgramme = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  language: z.literal('en').default('en')
});

export const ZAddNcctProgrammeStep = z.object({
  programmeId: z.string().uuid(),
  courseId: z.string().uuid(),
  position: z.number().int().positive(),
  prerequisiteStepId: z.string().uuid().nullable().optional(),
  required: z.boolean().default(true)
});

export const ZReorderNcctProgrammeStep = z.object({
  direction: z.enum(['UP', 'DOWN'])
});

export const ZCreateNcctBatch = z
  .object({
    programmeId: z.string().uuid(),
    institutionId: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    startsOn: isoDate,
    endsOn: isoDate,
    capacity: z.number().int().positive().max(10000),
    instructorProfileId: z.string().uuid().nullable().optional()
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    message: 'Batch end date must be on or after its start date',
    path: ['endsOn']
  });

export const ZUpdateNcctBatchStatus = z.object({
  status: z.enum(['OPEN', 'RUNNING', 'COMPLETED', 'CANCELLED'])
});

export const ZCreateNcctNomination = z.object({
  batchId: z.string().uuid(),
  traineeId: z.string().uuid()
});

export const ZDecideNcctNomination = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'WAITLISTED']),
  decisionNote: z.string().trim().max(1000).optional()
});

export const ZCreateNcctJob = z.object({
  employerName: z.string().trim().min(2).max(160),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(5000),
  location: z.string().trim().min(2).max(160),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).default([])
});

export const ZUpdateNcctJobStatus = z.object({
  status: z.enum(['OPEN', 'CLOSED'])
});

export const ZApplyToNcctJob = z.object({
  traineeId: z.string().uuid(),
  coverNote: z.string().trim().max(2000).optional()
});

export const ZUpdateNcctJobApplication = z.object({
  status: z.enum(['APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'WITHDRAWN']),
  note: z.string().trim().max(1000).optional()
});

export const ZNcctCareerChat = z.object({
  message: z.string().trim().min(1).max(2000)
});

export const ZCreateNcctAssessment = z.object({
  batchId: z.string().uuid(),
  traineeId: z.string().uuid(),
  evaluatorProfileId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(2).max(160),
  scheduledAt: z.string().datetime()
});

export const ZSubmitNcctAssessment = z.object({
  status: z.enum(['PASSED', 'FAILED', 'SUBMITTED']),
  score: z.number().int().min(0).max(100).optional(),
  feedback: z.string().trim().max(3000).optional()
});

export const ZIssueNcctCredential = z.object({
  traineeId: z.string().uuid(),
  programmeId: z.string().uuid(),
  batchId: z.string().uuid(),
  certificateNumber: z.string().trim().min(4).max(80).optional()
});

export const ZCreateNcctSession = z
  .object({
    batchId: z.string().uuid(),
    title: z.string().trim().min(2).max(160),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    room: z.string().trim().max(120).optional(),
    instructorProfileId: z.string().uuid().nullable().optional(),
    notes: z.string().trim().max(2000).optional()
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: 'Session end must be after its start',
    path: ['endsAt']
  });

export const ZCreateNcctResource = z.object({
  institutionId: z.string().uuid(),
  type: z.enum(['ROOM', 'HOSTEL', 'MEAL', 'TRANSPORT', 'EQUIPMENT']),
  name: z.string().trim().min(2).max(160),
  capacity: z.number().int().positive().max(10000)
});

export const ZUpdateNcctResource = z.object({
  active: z.boolean()
});

export const ZBookNcctResource = z
  .object({
    sessionId: z.string().uuid(),
    resourceId: z.string().uuid(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    quantity: z.number().int().positive().default(1),
    notes: z.string().trim().max(1000).optional()
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: 'Booking end must be after its start',
    path: ['endsAt']
  });

export const ZSaveNcctTraineeLogistics = z.object({
  batchId: z.string().uuid(),
  traineeId: z.string().uuid(),
  hostelResourceId: z.string().uuid().nullable().optional(),
  mealRequired: z.boolean().default(false),
  transportRequired: z.boolean().default(false),
  notes: z.string().trim().max(1000).optional()
});

export const ZCreateNcctSyncDevice = z.object({
  institutionId: z.string().uuid(),
  name: z.string().trim().min(2).max(120)
});

export const ZRecordNcctSyncEvents = z.object({
  events: z
    .array(
      z.object({
        eventId: z.string().trim().min(8).max(120),
        eventType: z.string().trim().min(2).max(120),
        payload: z.record(z.string(), z.unknown())
      })
    )
    .max(500)
});

export const ZUpdateNcctProgress = z.object({
  programmeStepId: z.string().uuid(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  score: z.number().int().min(0).max(100).optional()
});

export const ZSearchNcctDirectory = z.object({
  q: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  district: z.string().trim().max(80).optional(),
  skill: z.string().trim().max(80).optional(),
  institutionId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  offset: z.coerce.number().int().min(0).default(0)
});

export type TCreateNcctInstitution = z.infer<typeof ZCreateNcctInstitution>;
export type TUpdateNcctInstitution = z.infer<typeof ZUpdateNcctInstitution>;
export type TUpsertNcctInstitutionMember = z.infer<typeof ZUpsertNcctInstitutionMember>;
export type TUpdateNcctInstitutionMember = z.infer<typeof ZUpdateNcctInstitutionMember>;
export type TCreateNcctTrainee = z.infer<typeof ZCreateNcctTrainee>;
export type TUpdateNcctTrainee = z.infer<typeof ZUpdateNcctTrainee>;
export type TCreateNcctProgramme = z.infer<typeof ZCreateNcctProgramme>;
export type TAddNcctProgrammeStep = z.infer<typeof ZAddNcctProgrammeStep>;
export type TReorderNcctProgrammeStep = z.infer<typeof ZReorderNcctProgrammeStep>;
export type TCreateNcctBatch = z.infer<typeof ZCreateNcctBatch>;
export type TUpdateNcctBatchStatus = z.infer<typeof ZUpdateNcctBatchStatus>;
export type TCreateNcctNomination = z.infer<typeof ZCreateNcctNomination>;
export type TDecideNcctNomination = z.infer<typeof ZDecideNcctNomination>;
export type TCreateNcctJob = z.infer<typeof ZCreateNcctJob>;
export type TUpdateNcctJobStatus = z.infer<typeof ZUpdateNcctJobStatus>;
export type TApplyToNcctJob = z.infer<typeof ZApplyToNcctJob>;
export type TUpdateNcctJobApplication = z.infer<typeof ZUpdateNcctJobApplication>;
export type TNcctCareerChat = z.infer<typeof ZNcctCareerChat>;
export type TCreateNcctAssessment = z.infer<typeof ZCreateNcctAssessment>;
export type TSubmitNcctAssessment = z.infer<typeof ZSubmitNcctAssessment>;
export type TIssueNcctCredential = z.infer<typeof ZIssueNcctCredential>;
export type TCreateNcctSession = z.infer<typeof ZCreateNcctSession>;
export type TCreateNcctResource = z.infer<typeof ZCreateNcctResource>;
export type TUpdateNcctResource = z.infer<typeof ZUpdateNcctResource>;
export type TBookNcctResource = z.infer<typeof ZBookNcctResource>;
export type TSaveNcctTraineeLogistics = z.infer<typeof ZSaveNcctTraineeLogistics>;
export type TCreateNcctSyncDevice = z.infer<typeof ZCreateNcctSyncDevice>;
export type TRecordNcctSyncEvents = z.infer<typeof ZRecordNcctSyncEvents>;
export type TUpdateNcctProgress = z.infer<typeof ZUpdateNcctProgress>;
export type TSearchNcctDirectory = z.infer<typeof ZSearchNcctDirectory>;
