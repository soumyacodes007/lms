import { describe, expect, it } from 'vitest';
import { summarizeNcctBatchProgress } from './progress-summary';

describe('NCCT batch progress summaries', () => {
  it('groups completion counts by batch', () => {
    expect(
      summarizeNcctBatchProgress([
        { batch: { name: 'April batch' }, enrollment: { status: 'COMPLETED' } },
        { batch: { name: 'April batch' }, enrollment: { status: 'ENROLLED' } },
        { batch: { name: 'May batch' }, enrollment: { status: 'WITHDRAWN' } }
      ])
    ).toEqual([
      { batchName: 'April batch', total: 2, completed: 1, active: 1 },
      { batchName: 'May batch', total: 1, completed: 0, active: 0 }
    ]);
  });
});
