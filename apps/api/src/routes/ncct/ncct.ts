import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { handleError } from '@api/utils/errors';
import {
  ZAddNcctProgrammeStep,
  ZApplyToNcctJob,
  ZCreateNcctBatch,
  ZCreateNcctInstitution,
  ZCreateNcctJob,
  ZCreateNcctNomination,
  ZCreateNcctProgramme,
  ZCreateNcctTrainee,
  ZDecideNcctNomination
} from '@cio/utils/validation/ncct';
import { zValidator } from '@hono/zod-validator';
import * as z from 'zod';
import {
  addProgrammeStep,
  createEmploymentJob,
  decideNomination,
  getNcctOverview,
  listNcctProgrammeSteps,
  publishNcctProgramme,
  registerNcctInstitution,
  registerNcctTrainee,
  scheduleNcctBatch,
  submitJobApplication,
  submitNcctNomination
} from '@api/services/ncct/ncct';
import {
  listNcctBatches,
  listNcctInstitutions,
  listNcctJobs,
  listNcctProgrammes,
  listNcctTrainees
} from '@cio/db/queries/ncct';

const programmeParam = z.object({ programmeId: z.string().uuid() });
const nominationParam = z.object({ nominationId: z.string().uuid() });
const jobParam = z.object({ jobId: z.string().uuid() });

export const ncctRouter = new Hono()
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
        return c.json({ success: true, data: await submitNcctNomination(c.get('orgId')!, c.req.valid('json')) }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to submit nomination');
      }
    }
  )
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
            data: await decideNomination(c.req.valid('param').nominationId, actorId, c.req.valid('json'))
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to decide nomination');
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
          { success: true, data: await submitJobApplication(c.req.valid('param').jobId, c.req.valid('json')) },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to submit application');
      }
    }
  );
