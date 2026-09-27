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
    institutions: Array<{
      id: string;
      code: string;
      name: string;
      district: string;
      state: string;
      type: string;
      contactEmail: string | null;
    }>;
    institutionMembers: Array<{
      member: { id: string; institutionId: string; profileId: string; role: string; active: boolean };
      institution: { id: string; name: string; code: string };
      profile: { id: string; fullname: string; email: string | null };
    }>;
    institutionMemberCandidates: Array<{
      profileId: string;
      fullname: string;
      email: string;
      roleId: number;
    }>;
    trainees: Array<{
      id: string;
      institutionId: string;
      traineeNumber: string;
      cooperativeName: string | null;
      district: string;
      state: string;
      phone: string | null;
      skills: string[];
      directoryVisible: boolean;
    }>;
    programmes: Array<{ id: string; title: string; description: string; status: string }>;
    programmeSteps: Array<{
      programmeId: string;
      steps: Array<{
        id: string;
        programmeId: string;
        courseId: string;
        position: number;
        prerequisiteStepId: string | null;
        required: boolean;
      }>;
    }>;
    batches: Array<{
      id: string;
      programmeId: string;
      institutionId: string;
      name: string;
      startsOn: string;
      endsOn: string;
      status: string;
      capacity: number;
      instructorProfileId: string | null;
    }>;
    jobs: Array<{
      id: string;
      employerName: string;
      title: string;
      description: string;
      location: string;
      status: string;
      skills: string[];
    }>;
    sessions: Array<{
      id: string;
      title: string;
      startsAt: string;
      endsAt: string;
      room: string | null;
      instructorProfileId: string | null;
    }>;
    resources: Array<{ id: string; type: string; name: string; capacity: number; active: boolean }>;
    resourceBookings: Array<{
      booking: { startsAt: string; endsAt: string; quantity: number; notes: string | null };
      resource: { id: string; name: string; type: string };
      session: { title: string };
      batch: { name: string; institutionId: string };
    }>;
    logistics: Array<{
      logistics: { mealRequired: boolean; transportRequired: boolean; notes: string | null };
      batch: { name: string; institutionId: string };
      trainee: { id: string; traineeNumber: string; institutionId: string };
      resource: { id: string; name: string } | null;
    }>;
    nominations: Array<{
      nomination: { id: string; status: string; decisionNote: string | null; createdAt: string };
      batch: { name: string; capacity: number };
      trainee: { traineeNumber: string; district: string; state: string };
      programme: { title: string };
      institution: { name: string; code: string };
    }>;
    enrollments: Array<{
      enrollment: { id: string; status: string; enrolledAt: string; completedAt: string | null };
      batch: { name: string };
      trainee: { traineeNumber: string; district: string; state: string };
      programme: { title: string };
    }>;
    credentials: Array<{
      credential: { id: string; certificateNumber: string; issuedAt: string; revokedAt: string | null };
      trainee: { id: string; institutionId: string; traineeNumber: string; district: string; state: string };
      programme: { title: string };
    }>;
    applications: Array<{
      application: { id: string; status: string; createdAt: string; coverNote: string | null };
      job: { id: string; title: string; employerName: string; location: string };
      trainee: { traineeNumber: string; district: string; state: string };
    }>;
    applicationEvents: Array<{
      event: {
        id: string;
        applicationId: string;
        fromStatus: string | null;
        toStatus: string;
        note: string | null;
        createdAt: string;
      };
      application: { id: string };
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
    reports: {
      institutionsByActivity: Array<{
        institutionId: string;
        code: string;
        name: string;
        trainees: number;
        batches: number;
        activeBatches: number;
        credentials: number;
      }>;
      traineesByState: Array<{ state: string; total: number }>;
      nominationsByStatus: Array<{ status: string; total: number }>;
      batchesByStatus: Array<{ status: string; total: number }>;
      enrollmentsByStatus: Array<{ status: string; total: number }>;
      credentialsByStatus: Array<{ status: string; total: number }>;
      assessmentsByStatus: Array<{ status: string; total: number }>;
      completionRate: number;
      placements: { applications: number; shortlisted: number; selected: number; openJobs: number };
    };
    auditEvents: Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string | null;
      metadata: Record<string, unknown>;
      createdAt: string;
    }>;
  };
};

export const load = async ({ params, parent, cookies }) => {
  const { orgId } = await parent();
  const siteName = params.slug;
  if (!orgId) return { orgName: siteName, overview: null, courses: [] };

  const headers = getApiHeaders(cookies, orgId);
  const [result, candidatesResult, coursesResult] = await Promise.all([
    safeServerApi(() => classroomio.ncct.overview.$get({}, headers)),
    safeServerApi(() => classroomio.ncct['institution-members'].candidates.$get({}, headers)),
    safeServerApi(() => classroomio.ncct.courses.$get({}, headers))
  ]);

  return {
    orgName: siteName,
    overview: result.ok
      ? { ...result.body.data, institutionMemberCandidates: candidatesResult.ok ? candidatesResult.body.data : [] }
      : null,
    courses: coursesResult.ok ? coursesResult.body.data : []
  };
};
