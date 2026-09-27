import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { handleError } from '@api/utils/errors';
import {
  ZAddNcctProgrammeStep,
  ZApplyToNcctJob,
  ZCreateNcctBatch,
  ZCreateNcctAssessment,
  ZCreateNcctInstitution,
  ZCreateNcctJob,
  ZCreateNcctNomination,
  ZCreateNcctProgramme,
  ZCreateNcctResource,
  ZCreateNcctSession,
  ZCreateNcctSyncDevice,
  ZCreateNcctTrainee,
  ZDecideNcctNomination,
  ZIssueNcctCredential,
  ZNcctCareerChat,
  ZSubmitNcctAssessment,
  ZBookNcctResource,
  ZRecordNcctSyncEvents,
  ZSaveNcctTraineeLogistics,
  ZSearchNcctDirectory,
  ZUpdateNcctJobApplication,
  ZUpdateNcctProgress
} from '@cio/utils/validation/ncct';
import { zValidator } from '@hono/zod-validator';
import * as z from 'zod';
import {
  addProgrammeStep,
  createEmploymentJob,
  chatCareer,
  decideNomination,
  getNcctOverview,
  getCareerSnapshot,
  getAuditEvents,
  getEnrollmentProgress,
  getProgrammeProgress,
  bookResource,
  issueCredential,
  revokeCredential,
  listNcctAssessments,
  listNcctProgrammeSteps,
  publishNcctProgramme,
  registerNcctInstitution,
  registerResource,
  registerSyncDevice,
  registerNcctTrainee,
  receiveSyncEvents,
  saveTraineeLogistics,
  scheduleAssessment,
  scheduleNcctBatch,
  scheduleSession,
  searchCertifiedTrainees,
  submitAssessment,
  submitJobApplication,
  submitNcctNomination,
  updateJobApplication,
  updateEnrollmentProgress
} from '@api/services/ncct/ncct';
import {
  listNcctBatches,
  listNcctCredentials,
  listNcctInstitutions,
  listNcctJobApplications,
  listNcctJobs,
  listNcctNominations,
  listNcctProgrammes,
  listNcctResources,
  listNcctSessions,
  listNcctTrainees,
  verifyNcctCredential
} from '@cio/db/queries/ncct';

const programmeParam = z.object({ programmeId: z.string().uuid() });
const programmeProgressParam = z.object({ programmeId: z.string().uuid(), traineeId: z.string().uuid() });
const nominationParam = z.object({ nominationId: z.string().uuid() });
const jobParam = z.object({ jobId: z.string().uuid() });
const applicationParam = z.object({ applicationId: z.string().uuid() });
const assessmentParam = z.object({ assessmentId: z.string().uuid() });
const syncDeviceParam = z.object({ deviceId: z.string().uuid() });
const careerParam = z.object({ traineeId: z.string().uuid() });
const enrollmentParam = z.object({ enrollmentId: z.string().uuid() });
const verificationParam = z.object({ verificationToken: z.string().min(16).max(128) });
const credentialParam = z.object({ credentialId: z.string().uuid() });
const directoryQuery = ZSearchNcctDirectory;

export const ncctRouter = new Hono()
  .get('/credentials/verify/:verificationToken', zValidator('param', verificationParam), async (c) => {
    try {
      const credential = await verifyNcctCredential(c.req.valid('param').verificationToken);
      if (!credential)
        return c.json({ success: false, error: 'Credential not found', code: 'NCCT_CREDENTIAL_NOT_FOUND' }, 404);

      return c.json({ success: true, data: credential }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to verify credential');
    }
  })
  .get('/overview', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      return c.json({ success: true, data: await getNcctOverview(c.get('orgId')!) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load NCCT overview');
    }
  })
  .get('/institutions', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      return c.json({ success: true, data: await listNcctInstitutions(c.get('orgId')!) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load institutions');
    }
  })
  .post(
    '/institutions',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZCreateNcctInstitution),
    async (c) => {
      try {
        return c.json(
          { success: true, data: await registerNcctInstitution(c.get('orgId')!, c.req.valid('json')) },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to create institution');
      }
    }
  )
  .get('/trainees', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      return c.json({ success: true, data: await listNcctTrainees(c.get('orgId')!) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load trainees');
    }
  })
  .post(
    '/trainees',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZCreateNcctTrainee),
    async (c) => {
      try {
        return c.json({ success: true, data: await registerNcctTrainee(c.get('orgId')!, c.req.valid('json')) }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create trainee');
      }
    }
  )
  .get('/programmes', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      return c.json({ success: true, data: await listNcctProgrammes(c.get('orgId')!) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load programmes');
    }
  })
  .post(
    '/programmes',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZCreateNcctProgramme),
    async (c) => {
      try {
        return c.json({ success: true, data: await publishNcctProgramme(c.get('orgId')!, c.req.valid('json')) }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create programme');
      }
    }
  )
  .get(
    '/programmes/:programmeId/steps',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', programmeParam),
    async (c) => {
      try {
        return c.json({ success: true, data: await listNcctProgrammeSteps(c.req.valid('param').programmeId) }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load programme steps');
      }
    }
  )
  .get(
    '/enrollments/:enrollmentId/progress',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', enrollmentParam),
    async (c) => {
      try {
        return c.json(
          { success: true, data: await getEnrollmentProgress(c.get('orgId')!, c.req.valid('param').enrollmentId) },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to load enrolment progress');
      }
    }
  )
  .post(
    '/enrollments/:enrollmentId/progress',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', enrollmentParam),
    zValidator('json', ZUpdateNcctProgress),
    async (c) => {
      try {
        return c.json(
          {
            success: true,
            data: await updateEnrollmentProgress(
              c.get('orgId')!,
              c.req.valid('param').enrollmentId,
              c.req.valid('json')
            )
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update enrolment progress');
      }
    }
  )
  .post(
    '/programmes/:programmeId/steps',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', programmeParam),
    zValidator('json', ZAddNcctProgrammeStep),
    async (c) => {
      try {
        return c.json({ success: true, data: await addProgrammeStep(c.req.valid('json')) }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to add programme step');
      }
    }
  )
  .get(
    '/programmes/:programmeId/progress/:traineeId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', programmeProgressParam),
    async (c) => {
      try {
        const { programmeId, traineeId } = c.req.valid('param');
        return c.json(
          { success: true, data: await getProgrammeProgress(c.get('orgId')!, programmeId, traineeId) },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to load programme progress');
      }
    }
  )
  .get('/batches', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      return c.json({ success: true, data: await listNcctBatches(c.get('orgId')!) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load batches');
    }
  })
  .post(
    '/batches',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZCreateNcctBatch),
    async (c) => {
      try {
        return c.json({ success: true, data: await scheduleNcctBatch(c.get('orgId')!, c.req.valid('json')) }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create batch');
      }
    }
  )
  .post(
    '/nominations',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZCreateNcctNomination),
    async (c) => {
      try {
        return c.json(
          {
            success: true,
            data: await submitNcctNomination(c.get('orgId')!, c.get('user')!.id, c.req.valid('json'))
          },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to submit nomination');
      }
    }
  )
  .get('/nominations', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      return c.json({ success: true, data: await listNcctNominations(c.get('orgId')!) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load nominations');
    }
  })
  .post(
    '/nominations/:nominationId/decision',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', nominationParam),
    zValidator('json', ZDecideNcctNomination),
    async (c) => {
      try {
        const actorId = c.get('user')!.id;
        return c.json(
          {
            success: true,
            data: await decideNomination(
              c.get('orgId')!,
              c.req.valid('param').nominationId,
              actorId,
              c.req.valid('json')
            )
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to decide nomination');
      }
    }
  )
  .get('/assessments', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const rows = await listNcctAssessments(c.get('orgId')!);
      return c.json({ success: true, data: rows.map(({ assessment }) => assessment) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load assessments');
    }
  })
  .post(
    '/assessments',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZCreateNcctAssessment),
    async (c) => {
      try {
        return c.json({ success: true, data: await scheduleAssessment(c.get('orgId')!, c.req.valid('json')) }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to schedule assessment');
      }
    }
  )
  .post(
    '/assessments/:assessmentId/result',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', assessmentParam),
    zValidator('json', ZSubmitNcctAssessment),
    async (c) => {
      try {
        return c.json(
          {
            success: true,
            data: await submitAssessment(
              c.get('orgId')!,
              c.req.valid('param').assessmentId,
              c.req.valid('json'),
              c.get('user')!.id
            )
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to submit assessment result');
      }
    }
  )
  .post(
    '/credentials',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZIssueNcctCredential),
    async (c) => {
      try {
        return c.json(
          {
            success: true,
            data: await issueCredential(c.get('orgId')!, c.req.valid('json'), c.get('user')!.id)
          },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to issue credential');
      }
    }
  )
  .get('/credentials', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      return c.json({ success: true, data: await listNcctCredentials(c.get('orgId')!) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load credentials');
    }
  })
  .post(
    '/credentials/:credentialId/revoke',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', credentialParam),
    async (c) => {
      try {
        return c.json(
          {
            success: true,
            data: await revokeCredential(c.get('orgId')!, c.req.valid('param').credentialId, c.get('user')!.id)
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to revoke credential');
      }
    }
  )
  .get('/directory', authMiddleware, orgMemberMiddleware, zValidator('query', directoryQuery), async (c) => {
    try {
      return c.json(
        { success: true, data: await searchCertifiedTrainees(c.get('orgId')!, c.req.valid('query').q) },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to search certified trainee directory');
    }
  })
  .get('/audit', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      return c.json({ success: true, data: await getAuditEvents(c.get('orgId')!) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load NCCT audit events');
    }
  })
  .get('/sessions', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const rows = await listNcctSessions(c.get('orgId')!);
      return c.json({ success: true, data: rows.map(({ session }) => session) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load sessions');
    }
  })
  .post(
    '/sessions',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZCreateNcctSession),
    async (c) => {
      try {
        return c.json({ success: true, data: await scheduleSession(c.get('orgId')!, c.req.valid('json')) }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to schedule session');
      }
    }
  )
  .get('/resources', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const rows = await listNcctResources(c.get('orgId')!);
      return c.json({ success: true, data: rows.map(({ resource }) => resource) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load resources');
    }
  })
  .post(
    '/resources',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZCreateNcctResource),
    async (c) => {
      try {
        return c.json({ success: true, data: await registerResource(c.get('orgId')!, c.req.valid('json')) }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to register resource');
      }
    }
  )
  .post(
    '/resource-bookings',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZBookNcctResource),
    async (c) => {
      try {
        return c.json({ success: true, data: await bookResource(c.req.valid('json')) }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to book resource');
      }
    }
  )
  .post(
    '/trainee-logistics',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZSaveNcctTraineeLogistics),
    async (c) => {
      try {
        return c.json({ success: true, data: await saveTraineeLogistics(c.req.valid('json')) }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to save trainee logistics');
      }
    }
  )
  .post(
    '/sync-devices',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZCreateNcctSyncDevice),
    async (c) => {
      try {
        return c.json({ success: true, data: await registerSyncDevice(c.get('orgId')!, c.req.valid('json')) }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to register sync device');
      }
    }
  )
  .post(
    '/sync-devices/:deviceId/events',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', syncDeviceParam),
    zValidator('json', ZRecordNcctSyncEvents),
    async (c) => {
      try {
        return c.json(
          {
            success: true,
            data: await receiveSyncEvents(c.get('orgId')!, c.req.valid('param').deviceId, c.req.valid('json'))
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to receive sync events');
      }
    }
  )
  .get('/jobs', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      return c.json({ success: true, data: await listNcctJobs(c.get('orgId')!) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load jobs');
    }
  })
  .get('/applications', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      return c.json({ success: true, data: await listNcctJobApplications(c.get('orgId')!) }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load job applications');
    }
  })
  .post(
    '/applications/:applicationId/status',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', applicationParam),
    zValidator('json', ZUpdateNcctJobApplication),
    async (c) => {
      try {
        return c.json(
          {
            success: true,
            data: await updateJobApplication(c.get('orgId')!, c.req.valid('param').applicationId, c.req.valid('json'))
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update job application');
      }
    }
  )
  .post(
    '/jobs',
    authMiddleware,
    orgMemberMiddleware,
    orgTeamMemberMiddleware,
    zValidator('json', ZCreateNcctJob),
    async (c) => {
      try {
        return c.json(
          { success: true, data: await createEmploymentJob(c.get('orgId')!, c.get('user')!.id, c.req.valid('json')) },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to create job');
      }
    }
  )
  .post(
    '/jobs/:jobId/applications',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', jobParam),
    zValidator('json', ZApplyToNcctJob),
    async (c) => {
      try {
        return c.json(
          {
            success: true,
            data: await submitJobApplication(c.get('orgId')!, c.req.valid('param').jobId, c.req.valid('json'))
          },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to submit application');
      }
    }
  )
  .get('/career/:traineeId', authMiddleware, orgMemberMiddleware, zValidator('param', careerParam), async (c) => {
    try {
      return c.json(
        { success: true, data: await getCareerSnapshot(c.get('orgId')!, c.req.valid('param').traineeId) },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to load career assistant');
    }
  })
  .post(
    '/career/:traineeId/chat',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', careerParam),
    zValidator('json', ZNcctCareerChat),
    async (c) => {
      try {
        return c.json(
          {
            success: true,
            data: await chatCareer(c.get('orgId')!, c.req.valid('param').traineeId, c.req.valid('json'))
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to send career assistant message');
      }
    }
  );
