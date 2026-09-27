import { describe, expect, it } from 'vitest';
import { summarizeNcctBatchProgress } from './progress-summary';

describe('NCCT batch progress summaries', () => {
  it('groups completion counts by batch', () => {
    expect(
      summarizeNcctBatchProgress([
        {
          programme: { title: 'Cooperative leadership' },
          batch: { name: 'April batch' },
          enrollment: { status: 'COMPLETED' }
        },
        {
          programme: { title: 'Cooperative leadership' },
          batch: { name: 'April batch' },
          enrollment: { status: 'ENROLLED' }
        },
        { programme: { title: 'Digital finance' }, batch: { name: 'April batch' }, enrollment: { status: 'WITHDRAWN' } }
      ])
    ).toEqual([
      { batchName: 'Cooperative leadership · April batch', total: 2, completed: 1, active: 1 },
      { batchName: 'Digital finance · April batch', total: 1, completed: 0, active: 0 }
    ]);
  });
});
