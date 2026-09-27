export function summarizeNcctBatchProgress<T extends { batch: { name: string }; enrollment: { status: string } }>(
  enrollments: T[]
) {
  const summaries = new Map<string, { batchName: string; total: number; completed: number; active: number }>();
  for (const row of enrollments) {
    const existing = summaries.get(row.batch.name) ?? {
      batchName: row.batch.name,
      total: 0,
      completed: 0,
      active: 0
    };
    existing.total += 1;
    if (row.enrollment.status === 'COMPLETED') existing.completed += 1;
    if (row.enrollment.status === 'ENROLLED') existing.active += 1;
    summaries.set(row.batch.name, existing);
  }
  return [...summaries.values()].sort((left, right) => left.batchName.localeCompare(right.batchName));
}
