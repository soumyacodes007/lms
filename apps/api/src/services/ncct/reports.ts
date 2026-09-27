export function getNcctAssessmentPassRate(statuses: string[]) {
  const evaluated = statuses.filter((status) => status === 'PASSED' || status === 'FAILED');
  if (evaluated.length === 0) return 0;
  return Math.round((evaluated.filter((status) => status === 'PASSED').length / evaluated.length) * 100);
}
