export type NcctQueuedEvent = {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

type QueueStorage = Pick<Storage, 'getItem' | 'setItem'>;

function storageKey(deviceId: string) {
  return `ncct-sync-queue:${deviceId}`;
}

function readQueue(deviceId: string, storage: QueueStorage): NcctQueuedEvent[] {
  const value = storage.getItem(storageKey(deviceId));
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as NcctQueuedEvent[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(deviceId: string, events: NcctQueuedEvent[], storage: QueueStorage) {
  storage.setItem(storageKey(deviceId), JSON.stringify(events));
}

export function createNcctOfflineQueue(
  deviceId: string,
  send: (events: NcctQueuedEvent[]) => Promise<boolean>,
  storage: QueueStorage = localStorage
) {
  return {
    pendingCount() {
      return readQueue(deviceId, storage).length;
    },
    enqueue(event: NcctQueuedEvent) {
      const events = readQueue(deviceId, storage);
      if (events.some((queued) => queued.eventId === event.eventId)) return events.length;
      events.push(event);
      writeQueue(deviceId, events, storage);
      return events.length;
    },
    async flush() {
      const events = readQueue(deviceId, storage);
      if (events.length === 0) return 0;
      const sent = await send(events);
      if (!sent) return 0;
      writeQueue(deviceId, [], storage);
      return events.length;
    }
  };
}
