export function summarizeNcctNominations<T extends { nomination: { status: string } }>(rows: T[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.nomination.status, (counts.get(row.nomination.status) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([status, total]) => ({ status, total }))
    .sort((left, right) => left.status.localeCompare(right.status));
}
