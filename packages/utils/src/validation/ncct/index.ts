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

export const ZCreateNcctTrainee = z.object({
  institutionId: z.string().uuid(),
  traineeNumber: z.string().trim().min(2).max(40),
  cooperativeName: z.string().trim().max(160).optional(),
  district: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).default([])
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

export const ZApplyToNcctJob = z.object({
  traineeId: z.string().uuid(),
  coverNote: z.string().trim().max(2000).optional()
});

export type TCreateNcctInstitution = z.infer<typeof ZCreateNcctInstitution>;
export type TCreateNcctTrainee = z.infer<typeof ZCreateNcctTrainee>;
export type TCreateNcctProgramme = z.infer<typeof ZCreateNcctProgramme>;
export type TAddNcctProgrammeStep = z.infer<typeof ZAddNcctProgrammeStep>;
export type TCreateNcctBatch = z.infer<typeof ZCreateNcctBatch>;
export type TCreateNcctNomination = z.infer<typeof ZCreateNcctNomination>;
export type TDecideNcctNomination = z.infer<typeof ZDecideNcctNomination>;
export type TCreateNcctJob = z.infer<typeof ZCreateNcctJob>;
export type TApplyToNcctJob = z.infer<typeof ZApplyToNcctJob>;
