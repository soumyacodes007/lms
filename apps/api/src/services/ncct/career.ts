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
