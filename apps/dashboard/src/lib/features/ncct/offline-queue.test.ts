import { describe, expect, it } from 'vitest';
import { createNcctOfflineQueue, type NcctQueuedEvent } from './offline-queue';

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value)
  };
}

const event: NcctQueuedEvent = {
  eventId: 'event-001',
  eventType: 'lesson.completed',
  payload: { lessonId: 'lesson-001' }
};

describe('createNcctOfflineQueue', () => {
  it('deduplicates events before they are sent', () => {
    const queue = createNcctOfflineQueue('device-001', async () => true, createStorage());

    expect(queue.enqueue(event)).toBe(1);
    expect(queue.enqueue(event)).toBe(1);
    expect(queue.pendingCount()).toBe(1);
    expect(queue.pendingEvents()).toEqual([event]);
  });

  it('keeps events when delivery fails and clears them after a successful retry', async () => {
    const storage = createStorage();
    let shouldSend = false;
    const queue = createNcctOfflineQueue('device-001', async () => shouldSend, storage);
    queue.enqueue(event);

    expect(await queue.flush()).toBe(0);
    expect(queue.pendingCount()).toBe(1);

    shouldSend = true;
    expect(await queue.flush()).toBe(1);
    expect(queue.pendingCount()).toBe(0);
  });

  it('removes acknowledged events and keeps conflicts queued', async () => {
    const storage = createStorage();
    const queue = createNcctOfflineQueue(
      'device-001',
      async () => ({ ok: true, acknowledgedEventIds: ['event-001'] }),
      storage
    );
    queue.enqueue(event);
    queue.enqueue({ ...event, eventId: 'event-002' });

    expect(await queue.flush()).toBe(1);
    expect(queue.pendingCount()).toBe(1);
  });
});
