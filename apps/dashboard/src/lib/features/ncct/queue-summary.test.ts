import { describe, expect, it } from 'vitest';
import { summarizeNcctQueue } from './queue-summary';

describe('NCCT offline queue summaries', () => {
  it('groups queued actions by event type', () => {
    expect(
      summarizeNcctQueue([
        { eventId: '1', eventType: 'progress.update', payload: {} },
        { eventId: '2', eventType: 'nomination.submit', payload: {} },
        { eventId: '3', eventType: 'progress.update', payload: {} }
      ])
    ).toEqual([
      { eventType: 'nomination.submit', total: 1 },
      { eventType: 'progress.update', total: 2 }
    ]);
  });
});
