export function summarizeNcctApplications<T extends { application: { status: string } }>(rows: T[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.application.status, (counts.get(row.application.status) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([status, total]) => ({ status, total }))
    .sort((left, right) => left.status.localeCompare(right.status));
}
