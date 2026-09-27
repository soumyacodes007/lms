export function matchNcctJobs<T extends { status: string; skills: string[] }>(traineeSkills: string[], jobs: T[]) {
  const normalizedSkills = new Set(traineeSkills.map((skill) => skill.trim().toLowerCase()).filter(Boolean));
  return jobs
    .filter((job) => job.status === 'OPEN')
    .map((job) => ({
      job,
      matchedSkills: job.skills.filter((skill) => normalizedSkills.has(skill.trim().toLowerCase()))
    }))
    .filter(({ matchedSkills }) => matchedSkills.length > 0);
}

type CareerMatch = { job: { title: string }; matchedSkills: string[] };

export function buildNcctCareerResponse(
  question: string,
  traineeSkills: string[],
  credentialCount: number,
  matchedJobs: CareerMatch[]
) {
  const normalizedQuestion = question.trim().toLowerCase();
  if (/(certificate|credential|verify|verification)/.test(normalizedQuestion)) {
    return credentialCount > 0
      ? `You have ${credentialCount} verified ${credentialCount === 1 ? 'credential' : 'credentials'}. You can share the verification link from your credential record with an employer.`
      : 'You do not have a verified credential yet. Complete the required programme steps and practical assessment, then ask your evaluator to issue one.';
  }

  if (/(learn|course|training|skill)/.test(normalizedQuestion)) {
    return traineeSkills.length > 0
      ? `Your registered skills are ${traineeSkills.join(', ')}. Continue the next ordered course step to add verified skills to your profile.`
      : 'Add your current skills to your trainee profile, then complete the ordered programme steps so employers can find them.';
  }

  if (/(apply|job|role|vacanc|employ)/.test(normalizedQuestion)) {
    return matchedJobs.length > 0
      ? `You have ${matchedJobs.length} matching open ${matchedJobs.length === 1 ? 'role' : 'roles'}. Start with ${matchedJobs[0]!.job.title}; it matches ${matchedJobs[0]!.matchedSkills.join(', ')}.`
      : 'There is no open vacancy matching your registered skills yet. Keep your profile updated and check the employment exchange again.';
  }

  return matchedJobs.length > 0
    ? `Your next step is to review ${matchedJobs[0]!.job.title}. The role matches ${matchedJobs[0]!.matchedSkills.join(', ')}.`
    : traineeSkills.length > 0
      ? `Your current skills are ${traineeSkills.join(', ')}. Complete your next programme step and check the employment exchange again.`
      : 'Start by adding your skills to your trainee profile so the assistant can recommend training and job opportunities.';
}
