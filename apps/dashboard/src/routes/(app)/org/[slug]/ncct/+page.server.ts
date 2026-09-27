import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { type ServerApiResult, safeServerApi } from '$lib/utils/services/api/server';

type NcctOverview = {
  success: true;
  data: {
    summary: {
      institutions: number;
      trainees: number;
      programmes: number;
      batches: number;
      pendingNominations: number;
      credentials: number;
      jobs: number;
    };
    institutions: Array<{ id: string; code: string; name: string; district: string; state: string; type: string }>;
    trainees: Array<{ id: string; traineeNumber: string; district: string; state: string; skills: string[] }>;
    programmes: Array<{ id: string; title: string; description: string; status: string }>;
    batches: Array<{ id: string; name: string; startsOn: string; endsOn: string; status: string; capacity: number }>;
    jobs: Array<{ id: string; employerName: string; title: string; location: string; status: string }>;
    sessions: Array<{ id: string; title: string; startsAt: string; endsAt: string; room: string | null }>;
    resources: Array<{ id: string; type: string; name: string; capacity: number; active: boolean }>;
    nominations: Array<{
      nomination: { id: string; status: string; decisionNote: string | null; createdAt: string };
      batch: { name: string; capacity: number };
      trainee: { traineeNumber: string; district: string; state: string };
      programme: { title: string };
      institution: { name: string; code: string };
    }>;
    credentials: Array<{
      credential: { id: string; certificateNumber: string; issuedAt: string; revokedAt: string | null };
      trainee: { traineeNumber: string; district: string; state: string };
      programme: { title: string };
    }>;
    applications: Array<{
      application: { id: string; status: string; createdAt: string; coverNote: string | null };
      job: { title: string; employerName: string; location: string };
      trainee: { traineeNumber: string; district: string; state: string };
    }>;
    assessments: Array<{
      id: string;
      batchId: string;
      traineeId: string;
      evaluatorProfileId: string | null;
      title: string;
      scheduledAt: string;
      score: number | null;
      status: string;
      feedback: string | null;
    }>;
  };
};

export const load = async ({ params, parent, cookies }) => {
  const { orgId } = await parent();
  const siteName = params.slug;
  if (!orgId) return { orgName: siteName, overview: null };

  const result: Promise<ServerApiResult<NcctOverview>> = safeServerApi(() =>
    classroomio.ncct.overview.$get({}, getApiHeaders(cookies, orgId))
  );
  const response = await result;

  return {
    orgName: siteName,
    overview: response.ok ? response.body.data : null
  };
};
